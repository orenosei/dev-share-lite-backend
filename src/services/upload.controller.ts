import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  Body,
  BadRequestException,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import { PrismaService } from '../prisma.service';

@Controller('upload')
export class UploadController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly prismaService: PrismaService,
  ) {}

  /**
   * Upload avatar for user
   */
  @Post('avatar/:userId')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @Param('userId', ParseIntPipe) userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 5MB');
    }

    try {
      // Upload to Cloudinary
      const uploadResult = await this.cloudinaryService.uploadAvatar(
        file.buffer,
        userId,
      );

      // Update user's avatar URL in database
      await this.prismaService.user.update({
        where: { id: userId },
        data: { avatarUrl: uploadResult.url },
      });

      return {
        success: true,
        data: {
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          width: uploadResult.width,
          height: uploadResult.height,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload avatar: ${error.message}`);
    }
  }

  /**
   * Upload images for post
   */
  @Post('post/:postId')
  @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 images
  async uploadPostImages(
    @Param('postId', ParseIntPipe) postId: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    // Validate files
    for (const file of files) {
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException('Only image files are allowed');
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new BadRequestException('File size must be less than 10MB');
      }
    }

    try {
      const uploadedImages: any[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Upload to Cloudinary
        const uploadResult = await this.cloudinaryService.uploadPostImage(
          file.buffer,
          postId,
          i,
        );

        // Save to database
        const postImage = await this.prismaService.postImage.create({
          data: {
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            postId,
          },
        });

        uploadedImages.push(postImage);
      }

      return {
        success: true,
        data: uploadedImages,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload images: ${error.message}`);
    }
  }

  /**
   * Delete post image
   */
  @Delete('post-image/:imageId')
  async deletePostImage(
    @Param('imageId', ParseIntPipe) imageId: number,
    @Body() body: { userId: string },
  ) {
    const userId = parseInt(body.userId);
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    try {
      // Get image info
      const image = await this.prismaService.postImage.findUnique({
        where: { id: imageId },
        include: { post: true },
      });

      if (!image) {
        throw new BadRequestException('Image not found');
      }

      // Check if user has permission to delete (only post owner can delete)
      if (image.post.userId !== userId) {
        throw new BadRequestException('You do not have permission to delete this image');
      }

      // Delete from Cloudinary
      await this.cloudinaryService.deleteImage(image.publicId);

      // Delete from database
      await this.prismaService.postImage.delete({
        where: { id: imageId },
      });

      return {
        success: true,
        message: 'Image deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(`Failed to delete image: ${error.message}`);
    }
  }
}
