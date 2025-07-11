import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Post, PostStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreatePostDto, UpdatePostDto, PostQueryDto } from './dtos/post.dto';
import { CloudinaryService } from '../services/cloudinary.service';

@Injectable()
export class PostService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

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
        images: {
          select: {
            id: true,
            url: true,
            publicId: true,
            createdAt: true,
          },
        },
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
      tags,
      userId,
      author,
      dateFrom,
      dateTo,
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
      // Only show published posts by default for public listing (unless explicitly searching for drafts)
      where.status = 'PUBLISHED';
    }

    if (userId) {
      where.userId = userId;
    }

    // Search by author username
    if (author) {
      where.user = {
        username: { contains: author, mode: 'insensitive' },
      };
    }

    // Single tag filter
    if (tag) {
      where.tags = {
        some: {
          name: { equals: tag, mode: 'insensitive' },
        },
      };
    }

    // Multiple tags filter
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      where.tags = {
        some: {
          name: { in: tagArray.map(t => t.trim().toLowerCase()) },
        },
      };
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    // Build orderBy clause
    let orderBy: any = {};
    
    if (sortBy === 'comments') {
      orderBy = {
        comments: {
          _count: sortOrder,
        },
      };
    } else if (sortBy === 'likes' || sortBy === 'likesCount') {
      orderBy = {
        likes: {
          _count: sortOrder,
        },
      };
    } else if (sortBy === 'popular' || sortBy === 'popularity') {
      // This will be handled separately in getPostsByPopularity
      orderBy = {
        createdAt: 'desc', // Default fallback
      };
    } else {
      orderBy = {
        [sortBy]: sortOrder,
      };
    }

    // Get posts with counts
    let posts;
    let total;

    if (sortBy === 'popular' || sortBy === 'popularity') {
      // Use special popularity sorting
      posts = await this.getPostsByPopularity(where, skip, limit);
      total = await this.prisma.post.count({ where });
    } else {
      [posts, total] = await Promise.all([
        this.prisma.post.findMany({
          where,
          skip,
          take: limit,
          orderBy,
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
            images: {
              select: {
                id: true,
                url: true,
                publicId: true,
                createdAt: true,
              },
            },
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
    }

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
        images: {
          select: {
            id: true,
            url: true,
            publicId: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
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

  async getPostsByUser(userId: number, status?: PostStatus, page?: number, limit?: number) {
    const currentPage = page || 1;
    const currentLimit = limit || 10;
    const where: Prisma.PostWhereInput = { userId };
    
    // Only filter by status if explicitly provided
    // This allows getting all posts (DRAFT + PUBLISHED) for own profile
    if (status) {
      where.status = status;
    }

    const skip = (currentPage - 1) * currentLimit;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: currentLimit,
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
          images: {
            select: {
              id: true,
              url: true,
              publicId: true,
              createdAt: true,
            },
          },
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
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      posts,
      pagination: {
        page: currentPage,
        limit: currentLimit,
        total,
        totalPages: Math.ceil(total / currentLimit),
      },
    };
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

  private async getPostsByPopularity(
    where: Prisma.PostWhereInput,
    skip: number,
    limit: number,
  ) {
    // For complex where conditions, we'll use the regular Prisma query
    // but with a computed popularity field
    const posts = await this.prisma.post.findMany({
      where,
      skip,
      take: limit,
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
        images: {
          select: {
            id: true,
            url: true,
            publicId: true,
            createdAt: true,
          },
        },
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

    // Calculate popularity score and sort in memory
    const postsWithScore = posts.map(post => {
      const likesCount = post._count.likes;
      const commentsCount = post._count.comments;
      const daysSinceCreation = Math.floor(
        (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Popularity formula: (likes * 3) + (comments * 2) + recency bonus
      const recencyBonus = Math.max(0, 30 - daysSinceCreation) * 0.5;
      const popularityScore = (likesCount * 3) + (commentsCount * 2) + recencyBonus;
      
      return {
        ...post,
        popularityScore,
      };
    });

    // Sort by popularity score
    postsWithScore.sort((a, b) => {
      if (b.popularityScore !== a.popularityScore) {
        return b.popularityScore - a.popularityScore;
      }
      // If same score, sort by creation date (newer first)
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return postsWithScore;
  }

  async uploadImages(postId: number, files: Express.Multer.File[]): Promise<any> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const uploadResults: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const uploadResult = await this.cloudinaryService.uploadPostImage(
          file.buffer, 
          postId, 
          i
        );
        
        const postImage = await this.prisma.postImage.create({
          data: {
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            postId: postId,
          },
        });

        uploadResults.push({
          id: postImage.id,
          url: postImage.url,
          publicId: postImage.publicId,
        });
      } catch (error) {
        console.error('Error uploading image:', error);
        throw new Error(`Failed to upload image: ${file.originalname}`);
      }
    }

    return {
      message: `Successfully uploaded ${uploadResults.length} images`,
      images: uploadResults,
    };
  }

  async deleteImage(postId: number, imageId: number): Promise<any> {
    const image = await this.prisma.postImage.findFirst({
      where: {
        id: imageId,
        postId: postId,
      },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    try {
      await this.cloudinaryService.deleteImage(image.publicId);
      
      await this.prisma.postImage.delete({
        where: { id: imageId },
      });

      return {
        message: 'Image deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error('Failed to delete image');
    }
  }
}
