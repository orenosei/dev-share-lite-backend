import { IsNotEmpty, IsString, IsOptional, IsInt } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateCommentDto {
    @IsNotEmpty()
    @IsString()
    content: string;

    @IsNotEmpty()
    @IsInt()
    userId: number;

    @IsNotEmpty()
    @IsInt()
    postId: number;

    @IsOptional()
    @IsInt()
    parentId?: number; // For replies
}

export class UpdateCommentDto {
    @IsOptional()
    @IsString()
    content?: string;
}

export class CommentResponseDto {
    id: number;
    content: string;
    createdAt: Date;
    userId: number;
    postId: number;
    parentId?: number;
    user: {
        id: number;
        username: string;
        firstName?: string;
        lastName?: string;
        avatarUrl?: string;
    };
    replies: CommentResponseDto[];
    likes: {
        id: number;
        userId: number;
        user: {
            id: number;
            username: string;
        };
    }[];
    _count: {
        likes: number;
        replies: number;
    };
}

export class CommentQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    postId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    userId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    limit?: number = 20;

    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc' = 'asc'; // Comments usually show oldest first
}
