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
} from '@nestjs/common';
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
    @Query('status') status?: PostStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.postService.getPostsByUser(userId, status, page, limit);
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
}
