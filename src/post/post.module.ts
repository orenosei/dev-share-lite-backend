import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from '../services/cloudinary.service';

@Module({
  controllers: [PostController],
  providers: [PostService, PrismaService, CloudinaryService],
  exports: [PostService],
})
export class PostModule {}
