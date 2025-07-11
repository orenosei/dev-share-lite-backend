import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from '../services/cloudinary.service';

@Module({
  controllers: [UserController],
  providers: [UserService, PrismaService, CloudinaryService],
  exports: [UserService], 
})
export class UserModule {}
