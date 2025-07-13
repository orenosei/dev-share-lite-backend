import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PostService } from './post.service';
import { CreatePostDto, UpdatePostDto, PostQueryDto } from './dtos/post.dto';
import { PostStatus } from '@prisma/client';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  async create(@Body() createPostDto: CreatePostDto) {
    return this.postService.create(createPostDto);
  }

  @Get()
  async findAll(@Query() query: PostQueryDto) {
    return this.postService.findAll(query);
  }

  @Get('tags')
  async getTags() {
    return this.postService.getTags();
  }

  @Get('user/:userId')
  async getPostsByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc'
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    
    return this.postService.getPostsByUser(userId, {
      page: pageNumber,
      limit: limitNumber,
      status: status as PostStatus,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc'
    });
  }

  @Get('user/:userId/liked')
  async getLikedPostsByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc'
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    
    return this.postService.getLikedPostsByUser(userId, {
      page: pageNumber,
      limit: limitNumber,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc'
    });
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
    @Query('userId', ParseIntPipe) userId: number, 
  ) {
    return this.postService.update(id, updatePostDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number, 
  ) {
    return this.postService.remove(id, userId);
  }

  @Post(':id/like')
  async likePost(
    @Param('id', ParseIntPipe) id: number,
    @Body('userId', ParseIntPipe) userId: number, 
  ) {
    return this.postService.likePost(id, userId);
  }

  @Post(':id/images')
  @UseInterceptors(FilesInterceptor('images', 10)) 
  async uploadImages(
    @Param('id', ParseIntPipe) postId: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    // Validate file types
    for (const file of files) {
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException(`File ${file.originalname} is not an image`);
      }
      
      // Validate file size (5MB max per file)
      if (file.size > 5 * 1024 * 1024) {
        throw new BadRequestException(`File ${file.originalname} is too large (max 5MB)`);
      }
    }

    return this.postService.uploadImages(postId, files);
  }

  @Delete(':postId/images/:imageId')
  async deleteImage(
    @Param('postId', ParseIntPipe) postId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.postService.deleteImage(postId, imageId);
  }
}
