import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getStats() {
    try {
      const [totalPosts, totalUsers, totalComments, recentPosts, topUsers] = await Promise.all([
        this.prisma.post.count({
          where: {
            status: 'PUBLISHED'
          }
        }),
        this.prisma.user.count(),
        this.prisma.comment.count(),
        this.prisma.post.count({
          where: {
            status: 'PUBLISHED',
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        }),
        this.prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        })
      ]);

      const totalLikes = await this.prisma.postLike.count();

      return {
        totalPosts,
        totalUsers,
        totalComments,
        totalLikes,
        recentPosts, // Posts in last 7 days
        newUsers: topUsers, // Users in last 30 days
        growthRate: {
          posts: recentPosts,
          users: topUsers
        }
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {
        totalPosts: 0,
        totalUsers: 0,
        totalComments: 0,
        totalLikes: 0,
        recentPosts: 0,
        newUsers: 0,
        growthRate: {
          posts: 0,
          users: 0
        }
      };
    }
  }
}
