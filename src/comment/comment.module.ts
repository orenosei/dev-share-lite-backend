import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { PrismaService } from '../prisma.service';
import { NotificationService } from '../notification/notification.service';

@Module({
  controllers: [CommentController],
  providers: [CommentService, PrismaService, NotificationService],
  exports: [CommentService],
})
export class CommentModule {}
