import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Comment, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateCommentDto, UpdateCommentDto, CommentQueryDto } from './dtos/comment.dto';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  async create(createCommentDto: CreateCommentDto): Promise<Comment> {
    // Check if post exists
    const post = await this.prisma.post.findUnique({
      where: { id: createCommentDto.postId },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${createCommentDto.postId} not found`);
    }

    // Check if parent comment exists (if replying to a comment)
    if (createCommentDto.parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: createCommentDto.parentId },
      });

      if (!parentComment) {
        throw new NotFoundException(`Parent comment with ID ${createCommentDto.parentId} not found`);
      }

      // Ensure parent comment is on the same post
      if (parentComment.postId !== createCommentDto.postId) {
        throw new ForbiddenException('Parent comment must be on the same post');
      }
    }

    const comment = await this.prisma.comment.create({
      data: createCommentDto,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            _count: {
              select: {
                likes: true,
                replies: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
    });

    return comment;
  }

  async findAll(query: CommentQueryDto) {
    const {
      postId,
      userId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'asc',
    } = query;

    const skip = (page - 1) * limit;

    // Build where conditions
    const where: Prisma.CommentWhereInput = {};

    if (postId) {
      where.postId = postId;
      where.parentId = null; // Only get top-level comments for a post
    }

    if (userId) {
      where.userId = userId;
    }

    // Get comments with counts
    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
              _count: {
                select: {
                  likes: true,
                  replies: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          likes: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
          _count: {
            select: {
              likes: true,
              replies: true,
            },
          },
        },
      }),
      this.prisma.comment.count({ where }),
    ]);

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<Comment> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        parent: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            _count: {
              select: {
                likes: true,
                replies: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return comment;
  }

  async update(id: number, updateCommentDto: UpdateCommentDto, userId: number): Promise<Comment> {
    const existingComment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!existingComment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    if (existingComment.userId !== userId) {
      throw new ForbiddenException('You can only update your own comments');
    }

    const updatedComment = await this.prisma.comment.update({
      where: { id },
      data: updateCommentDto,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            _count: {
              select: {
                likes: true,
                replies: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
    });

    return updatedComment;
  }

  async remove(id: number, userId: number): Promise<{ message: string }> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        replies: true,
      },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // Delete all replies first (cascade delete)
    if (comment.replies.length > 0) {
      await this.prisma.comment.deleteMany({
        where: {
          parentId: id,
        },
      });
    }

    await this.prisma.comment.delete({
      where: { id },
    });

    return { message: `Comment with ID ${id} has been deleted successfully` };
  }

  async likeComment(commentId: number, userId: number): Promise<{ message: string; liked: boolean }> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${commentId} not found`);
    }

    const existingLike = await this.prisma.commentLike.findUnique({
      where: {
        user_comment_unique: {
          userId,
          commentId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await this.prisma.commentLike.delete({
        where: {
          user_comment_unique: {
            userId,
            commentId,
          },
        },
      });

      return { message: 'Comment unliked successfully', liked: false };
    } else {
      // Like
      await this.prisma.commentLike.create({
        data: {
          userId,
          commentId,
        },
      });

      return { message: 'Comment liked successfully', liked: true };
    }
  }

  async getCommentsByPost(postId: number) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    return this.prisma.comment.findMany({
      where: {
        postId,
        parentId: null, // Only get top-level comments
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            likes: {
              select: {
                userId: true,
              },
            },
            _count: {
              select: {
                likes: true,
                replies: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async getCommentsByUser(userId: number) {
    return this.prisma.comment.findMany({
      where: { userId },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getReplies(parentId: number) {
    const parentComment = await this.prisma.comment.findUnique({
      where: { id: parentId },
    });

    if (!parentComment) {
      throw new NotFoundException(`Parent comment with ID ${parentId} not found`);
    }

    return this.prisma.comment.findMany({
      where: { parentId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}
