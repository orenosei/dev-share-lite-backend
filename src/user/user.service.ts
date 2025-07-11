import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { UpdateUserDto } from './dtos/user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string): Promise<Omit<User, 'password'>[]> {
    const where: Prisma.UserWhereInput = {};
    
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        bio: true,
        avatarUrl: true,
        phone: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users;
  }

  async findOne(id: number): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        bio: true,
        avatarUrl: true,
        phone: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByUsername(username: string): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        bio: true,
        avatarUrl: true,
        phone: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with username ${username} not found`);
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<Omit<User, 'password'>> {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check for duplicate username or email if they're being updated
    if (updateUserDto.username || updateUserDto.email) {
      const duplicateUser = await this.prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } }, // Exclude current user
            {
              OR: [
                updateUserDto.username ? { username: updateUserDto.username } : {},
                updateUserDto.email ? { email: updateUserDto.email } : {},
              ].filter(condition => Object.keys(condition).length > 0),
            },
          ],
        },
      });

      if (duplicateUser) {
        throw new ConflictException('Username or email already exists');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...updateUserDto,
        address: updateUserDto.address as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        bio: true,
        avatarUrl: true,
        phone: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async updateAvatar(id: number, avatarUrl: string): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { avatarUrl },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        bio: true,
        avatarUrl: true,
        phone: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async deleteAvatar(id: number): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { avatarUrl: null },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        bio: true,
        avatarUrl: true,
        phone: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async remove(id: number): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: `User with ID ${id} has been deleted successfully` };
  }

  async getUserStats(id: number): Promise<{
    postsCount: number;
    commentsCount: number;
    likesReceived: number;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const [postsCount, commentsCount, likesReceived] = await Promise.all([
      this.prisma.post.count({
        where: { userId: id },
      }),
      this.prisma.comment.count({
        where: { userId: id },
      }),
      this.prisma.postLike.count({
        where: {
          post: {
            userId: id,
          },
        },
      }),
    ]);

    return {
      postsCount,
      commentsCount,
      likesReceived,
    };
  }
}
