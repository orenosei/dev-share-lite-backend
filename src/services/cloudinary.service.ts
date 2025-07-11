import { v2 as cloudinary } from 'cloudinary';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  /**
   * Upload image to Cloudinary
   * @param file - File buffer or file path
   * @param folder - Folder name in Cloudinary (e.g., 'avatars', 'posts')
   * @param publicId - Custom public ID (optional)
   * @returns Upload result with URL and public_id
   */
  async uploadImage(
    file: Buffer | string,
    folder: string = 'uploads',
    publicId?: string,
  ): Promise<any> {
    try {
      const options: any = {
        folder,
        resource_type: 'auto',
        quality: 'auto:good',
        fetch_format: 'auto',
      };

      if (publicId) {
        options.public_id = publicId;
      }

      let uploadResult;
      
      if (Buffer.isBuffer(file)) {
        // Upload from buffer
        uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            options,
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(file);
        });
      } else {
        // Upload from file path
        uploadResult = await cloudinary.uploader.upload(file, options);
      }

      return {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        size: uploadResult.bytes,
      };
    } catch (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Upload avatar image with specific optimizations
   * @param file - Image file buffer
   * @param userId - User ID for naming
   * @returns Upload result
   */
  async uploadAvatar(file: Buffer, userId: number): Promise<any> {
    return this.uploadImage(
      file,
      'avatars',
      `avatar_${userId}_${Date.now()}`
    );
  }

  /**
   * Upload post image with specific optimizations
   * @param file - Image file buffer
   * @param postId - Post ID for naming
   * @param index - Image index for multiple images
   * @returns Upload result
   */
  async uploadPostImage(file: Buffer, postId: number, index: number = 0): Promise<any> {
    return this.uploadImage(
      file,
      'posts',
      `post_${postId}_${index}_${Date.now()}`
    );
  }

  /**
   * Delete image from Cloudinary
   * @param publicId - Public ID of the image to delete
   * @returns Deletion result
   */
  async deleteImage(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  /**
   * Get optimized image URL with transformations
   * @param publicId - Public ID of the image
   * @param transformations - Cloudinary transformations
   * @returns Optimized image URL
   */
  getOptimizedUrl(publicId: string, transformations: any = {}): string {
    return cloudinary.url(publicId, {
      quality: 'auto:good',
      fetch_format: 'auto',
      ...transformations,
    });
  }

  /**
   * Get avatar URL with specific size and optimizations
   * @param publicId - Public ID of the avatar
   * @param size - Size of the avatar (default: 150)
   * @returns Optimized avatar URL
   */
  getAvatarUrl(publicId: string, size: number = 150): string {
    return this.getOptimizedUrl(publicId, {
      width: size,
      height: size,
      crop: 'fill',
      gravity: 'face',
      radius: 'max',
    });
  }

  /**
   * Get post image URL with specific optimizations
   * @param publicId - Public ID of the post image
   * @param width - Width of the image
   * @param height - Height of the image
   * @returns Optimized post image URL
   */
  getPostImageUrl(publicId: string, width?: number, height?: number): string {
    const transformations: any = {
      crop: 'scale',
    };

    if (width) transformations.width = width;
    if (height) transformations.height = height;

    return this.getOptimizedUrl(publicId, transformations);
  }
}
