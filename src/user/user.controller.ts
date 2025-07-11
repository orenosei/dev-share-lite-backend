import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { UpdateUserDto } from './dtos/user.dto';
import { CloudinaryService } from '../services/cloudinary.service';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  async findAll(@Query('search') search?: string) {
    return this.userService.findAll(search);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Get('username/:username')
  async findByUsername(@Param('username') username: string) {
    return this.userService.findByUsername(username);
  }

  @Get(':id/stats')
  async getUserStats(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUserStats(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }

  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @Param('id', ParseIntPipe) id: number,
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
        id,
      );

      // Update user's avatar URL in database
      const updatedUser = await this.userService.updateAvatar(id, uploadResult.url);

      return {
        success: true,
        data: {
          user: updatedUser,
          avatar: {
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            width: uploadResult.width,
            height: uploadResult.height,
          },
        },
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload avatar: ${error.message}`);
    }
  }

  @Delete(':id/avatar')
  async deleteAvatar(@Param('id', ParseIntPipe) id: number) {
    try {
      // Get user to check if avatar exists
      const user = await this.userService.findOne(id);
      
      if (user.avatarUrl) {
        // Extract publicId from Cloudinary URL
        // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{folder}/{publicId}.{format}
        const urlParts = user.avatarUrl.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
        if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
          // Get the part after 'upload' and version (could be folder/publicId.format)
          const pathAfterVersion = urlParts.slice(uploadIndex + 2).join('/');
          const publicIdWithFormat = pathAfterVersion.split('.')[0];
          
          // Delete from Cloudinary (ignore errors if file doesn't exist)
          try {
            await this.cloudinaryService.deleteImage(publicIdWithFormat);
          } catch (cloudinaryError) {
            // Continue even if Cloudinary deletion fails
            console.warn('Failed to delete from Cloudinary:', cloudinaryError.message);
          }
        }
      }

      // Remove avatar URL from database
      const updatedUser = await this.userService.deleteAvatar(id);

      return {
        success: true,
        data: updatedUser,
        message: 'Avatar deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(`Failed to delete avatar: ${error.message}`);
    }
  }
}
