import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Post, PostStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreatePostDto, UpdatePostDto, PostQueryDto } from './dtos/post.dto';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async create(createPostDto: CreatePostDto): Promise<Post> {
    const { tags, ...postData } = createPostDto;

    // Handle tags - create or connect existing ones
    const tagConnections = tags ? await this.handleTags(tags) : [];

    const post = await this.prisma.post.create({
      data: {
        ...postData,
        tags: {
          connect: tagConnections,
        },
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
        tags: true,
        comments: {
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
            comments: true,
            likes: true,
          },
        },
      },
    });

    return post;
  }

  async findAll(query: PostQueryDto) {
    const {
      search,
      status,
      tag,
      userId,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Build where conditions
    const where: Prisma.PostWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    } else {
      // Only show published posts by default for public listing
      where.status = 'PUBLISHED';
    }

    if (userId) {
      where.userId = userId;
    }

    if (tag) {
      where.tags = {
        some: {
          name: { equals: tag, mode: 'insensitive' },
        },
      };
    }

    // Get posts with counts
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
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
          tags: true,
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<Post> {
    const post = await this.prisma.post.findUnique({
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
        tags: true,
        comments: {
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
              },
            },
            _count: {
              select: {
                likes: true,
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
            comments: true,
            likes: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  async update(id: number, updatePostDto: UpdatePostDto, userId: number): Promise<Post> {
    const existingPost = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    if (existingPost.userId !== userId) {
      throw new ForbiddenException('You can only update your own posts');
    }

    const { tags, ...postData } = updatePostDto;

    // Handle tags if provided
    let tagConnections: { id: number }[] | undefined = undefined;
    if (tags) {
      // Disconnect all existing tags and connect new ones
      await this.prisma.post.update({
        where: { id },
        data: {
          tags: {
            set: [], // Remove all existing connections
          },
        },
      });

      tagConnections = await this.handleTags(tags);
    }

    const updatedPost = await this.prisma.post.update({
      where: { id },
      data: {
        ...postData,
        ...(tagConnections && {
          tags: {
            connect: tagConnections,
          },
        }),
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
        tags: true,
        comments: {
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
            comments: true,
            likes: true,
          },
        },
      },
    });

    return updatedPost;
  }

  async remove(id: number, userId: number): Promise<{ message: string }> {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.post.delete({
      where: { id },
    });

    return { message: `Post with ID ${id} has been deleted successfully` };
  }

  async likePost(postId: number, userId: number): Promise<{ message: string; liked: boolean }> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    const existingLike = await this.prisma.postLike.findUnique({
      where: {
        user_post_unique: {
          userId,
          postId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await this.prisma.postLike.delete({
        where: {
          user_post_unique: {
            userId,
            postId,
          },
        },
      });

      return { message: 'Post unliked successfully', liked: false };
    } else {
      // Like
      await this.prisma.postLike.create({
        data: {
          userId,
          postId,
        },
      });

      return { message: 'Post liked successfully', liked: true };
    }
  }

  async getPostsByUser(userId: number, status?: PostStatus) {
    const where: Prisma.PostWhereInput = { userId };
    
    // Only filter by status if explicitly provided
    // This allows getting all posts (DRAFT + PUBLISHED) for own profile
    if (status) {
      where.status = status;
    }

    return this.prisma.post.findMany({
      where,
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
        tags: true,
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getTags() {
    return this.prisma.tag.findMany({
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        posts: {
          _count: 'desc',
        },
      },
    });
  }

  private async handleTags(tagNames: string[]): Promise<{ id: number }[]> {
    const tagConnections: { id: number }[] = [];

    for (const tagName of tagNames) {
      let tag = await this.prisma.tag.findUnique({
        where: { name: tagName.toLowerCase() },
      });

      if (!tag) {
        tag = await this.prisma.tag.create({
          data: { name: tagName.toLowerCase() },
        });
      }

      tagConnections.push({ id: tag.id });
    }

    return tagConnections;
  }
}
