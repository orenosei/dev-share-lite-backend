import { 
  Controller, 
  Get, 
  Patch, 
  Delete, 
  Param, 
  Query, 
  ParseIntPipe,
  HttpCode,
  HttpStatus 
} from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('user/:userId')
  async getUserNotifications(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 20;
    
    return this.notificationService.getUserNotifications(userId, pageNum, limitNum);
  }

  @Get('user/:userId/unread-count')
  async getUnreadCount(@Param('userId', ParseIntPipe) userId: number) {
    const count = await this.notificationService.getUnreadCount(userId);
    return { unreadCount: count };
  }

  @Patch(':id/read/:userId')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Param('id', ParseIntPipe) notificationId: number,
    @Param('userId', ParseIntPipe) userId: number
  ) {
    await this.notificationService.markAsRead(notificationId, userId);
    return { success: true, message: 'Notification marked as read' };
  }

  @Patch('user/:userId/read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Param('userId', ParseIntPipe) userId: number) {
    await this.notificationService.markAllAsRead(userId);
    return { success: true, message: 'All notifications marked as read' };
  }

  @Delete(':id/user/:userId')
  @HttpCode(HttpStatus.OK)
  async deleteNotification(
    @Param('id', ParseIntPipe) notificationId: number,
    @Param('userId', ParseIntPipe) userId: number
  ) {
    await this.notificationService.deleteNotification(notificationId, userId);
    return { success: true, message: 'Notification deleted' };
  }
}
