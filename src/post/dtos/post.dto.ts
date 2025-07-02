import { IsNotEmpty, IsString, IsOptional, IsEnum, IsArray, IsInt } from 'class-validator';
import { PostStatus } from '@prisma/client';

export class CreatePostDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsNotEmpty()
    @IsString()
    content: string;

    @IsOptional()
    @IsEnum(PostStatus)
    status?: PostStatus = PostStatus.DRAFT;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsNotEmpty()
    @IsInt()
    userId: number;
}

export class UpdatePostDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsEnum(PostStatus)
    status?: PostStatus;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];
}

export class PostResponseDto {
    id: number;
    title: string;
    content: string;
    status: PostStatus;
    createdAt: Date;
    updatedAt: Date;
    userId: number;
    user: {
        id: number;
        username: string;
        firstName?: string;
        lastName?: string;
        avatarUrl?: string;
    };
    tags: {
        id: number;
        name: string;
    }[];
    comments: any[];
    likes: any[];
    _count: {
        comments: number;
        likes: number;
    };
}

export class PostQueryDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsEnum(PostStatus)
    status?: PostStatus;

    @IsOptional()
    @IsString()
    tag?: string;

    @IsOptional()
    @IsInt()
    userId?: number;

    @IsOptional()
    @IsInt()
    page?: number = 1;

    @IsOptional()
    @IsInt()
    limit?: number = 10;

    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc' = 'desc';
}
