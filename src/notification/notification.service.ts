import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async createPostLikeNotification(postId: number, triggeredByUserId: number) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { user: true }
    });

    if (!post) return;

    if (post.userId === triggeredByUserId) return;

    const existingNotification = await this.prisma.notification.findFirst({
      where: {
        userId: post.userId,
        triggeredBy: triggeredByUserId,
        postId: postId,
        type: NotificationType.POST_LIKE,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
        }
      }
    });

    if (existingNotification) return;

    const triggerUser = await this.prisma.user.findUnique({
      where: { id: triggeredByUserId }
    });

    const triggerName = triggerUser?.firstName && triggerUser?.lastName 
      ? `${triggerUser.firstName} ${triggerUser.lastName}`
      : triggerUser?.username || 'Someone';

    await this.prisma.notification.create({
      data: {
        type: NotificationType.POST_LIKE,
        message: `${triggerName} liked your post: "${this.truncateText(post.title, 50)}"`,
        userId: post.userId,
        triggeredBy: triggeredByUserId,
        postId: postId
      }
    });
  }

  async createPostCommentNotification(postId: number, commentId: number, triggeredByUserId: number) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { user: true }
    });

    if (!post) return;

    if (post.userId === triggeredByUserId) return;

    const triggerUser = await this.prisma.user.findUnique({
      where: { id: triggeredByUserId }
    });

    const triggerName = triggerUser?.firstName && triggerUser?.lastName 
      ? `${triggerUser.firstName} ${triggerUser.lastName}`
      : triggerUser?.username || 'Someone';

    await this.prisma.notification.create({
      data: {
        type: NotificationType.POST_COMMENT,
        message: `${triggerName} commented on your post: "${this.truncateText(post.title, 50)}"`,
        userId: post.userId,
        triggeredBy: triggeredByUserId,
        postId: postId,
        commentId: commentId
      }
    });
  }

  async createCommentLikeNotification(commentId: number, triggeredByUserId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { user: true, post: true }
    });

    if (!comment) return;

    if (comment.userId === triggeredByUserId) return;

    const existingNotification = await this.prisma.notification.findFirst({
      where: {
        userId: comment.userId,
        triggeredBy: triggeredByUserId,
        commentId: commentId,
        type: NotificationType.COMMENT_LIKE,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    if (existingNotification) return;

    const triggerUser = await this.prisma.user.findUnique({
      where: { id: triggeredByUserId }
    });

    const triggerName = triggerUser?.firstName && triggerUser?.lastName 
      ? `${triggerUser.firstName} ${triggerUser.lastName}`
      : triggerUser?.username || 'Someone';

    await this.prisma.notification.create({
      data: {
        type: NotificationType.COMMENT_LIKE,
        message: `${triggerName} liked your comment on "${this.truncateText(comment.post.title, 50)}"`,
        userId: comment.userId,
        triggeredBy: triggeredByUserId,
        commentId: commentId,
        postId: comment.postId
      }
    });
  }

  async createCommentReplyNotification(parentCommentId: number, replyCommentId: number, triggeredByUserId: number) {
    const parentComment = await this.prisma.comment.findUnique({
      where: { id: parentCommentId },
      include: { user: true, post: true }
    });

    if (!parentComment) return;

    if (parentComment.userId === triggeredByUserId) return;

    const triggerUser = await this.prisma.user.findUnique({
      where: { id: triggeredByUserId }
    });

    const triggerName = triggerUser?.firstName && triggerUser?.lastName 
      ? `${triggerUser.firstName} ${triggerUser.lastName}`
      : triggerUser?.username || 'Someone';

    await this.prisma.notification.create({
      data: {
        type: NotificationType.COMMENT_REPLY,
        message: `${triggerName} replied to your comment on "${this.truncateText(parentComment.post.title, 50)}"`,
        userId: parentComment.userId,
        triggeredBy: triggeredByUserId,
        commentId: replyCommentId,
        postId: parentComment.postId
      }
    });
  }

  async getUserNotifications(userId: number, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      include: {
        triggerUser: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        },
        post: {
          select: {
            id: true,
            title: true
          }
        },
        comment: {
          select: {
            id: true,
            content: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const total = await this.prisma.notification.count({
      where: { userId }
    });

    const unreadCount = await this.prisma.notification.count({
      where: { userId, isRead: false }
    });

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      unreadCount
    };
  }

  async markAsRead(notificationId: number, userId: number) {
    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: userId
      },
      data: {
        isRead: true
      }
    });
  }

  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: {
        userId: userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });
  }

  async deleteNotification(notificationId: number, userId: number) {
    return this.prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId: userId
      }
    });
  }

  async getUnreadCount(userId: number) {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  async removePostLikeNotification(postId: number, triggeredByUserId: number) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) return;

    await this.prisma.notification.deleteMany({
      where: {
        userId: post.userId,
        triggeredBy: triggeredByUserId,
        postId: postId,
        type: NotificationType.POST_LIKE
      }
    });
  }

  async removeCommentLikeNotification(commentId: number, triggeredByUserId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) return;

    await this.prisma.notification.deleteMany({
      where: {
        userId: comment.userId,
        triggeredBy: triggeredByUserId,
        commentId: commentId,
        type: NotificationType.COMMENT_LIKE
      }
    });
  }
}
