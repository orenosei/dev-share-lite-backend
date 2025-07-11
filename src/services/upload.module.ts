import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { UploadController } from './upload.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [UploadController],
  providers: [CloudinaryService, PrismaService],
  exports: [CloudinaryService],
})
export class UploadModule {}
