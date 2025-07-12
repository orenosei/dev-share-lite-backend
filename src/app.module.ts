import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { CommentModule } from './comment/comment.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [AuthModule, UserModule, PostModule, CommentModule, NotificationModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
