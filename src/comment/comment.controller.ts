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
import { CommentService } from './comment.service';
import { CreateCommentDto, UpdateCommentDto, CommentQueryDto } from './dtos/comment.dto';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  async create(@Body() createCommentDto: CreateCommentDto) {
    return this.commentService.create(createCommentDto);
  }

  @Get()
  async findAll(@Query() query: CommentQueryDto) {
    return this.commentService.findAll(query);
  }

  @Get('post/:postId')
  async getCommentsByPost(@Param('postId', ParseIntPipe) postId: number) {
    return this.commentService.getCommentsByPost(postId);
  }

  @Get('user/:userId')
  async getCommentsByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.commentService.getCommentsByUser(userId);
  }

  @Get(':id/replies')
  async getReplies(@Param('id', ParseIntPipe) id: number) {
    return this.commentService.getReplies(id);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.commentService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommentDto: UpdateCommentDto,
    @Query('userId', ParseIntPipe) userId: number, // In real app, this would come from JWT token
  ) {
    return this.commentService.update(id, updateCommentDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number, // In real app, this would come from JWT token
  ) {
    return this.commentService.remove(id, userId);
  }

  @Post(':id/like')
  async likeComment(
    @Param('id', ParseIntPipe) id: number,
    @Body('userId', ParseIntPipe) userId: number, // In real app, this would come from JWT token
  ) {
    return this.commentService.likeComment(id, userId);
  }
}
