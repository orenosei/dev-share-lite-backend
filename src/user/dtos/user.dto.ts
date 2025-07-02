import { IsEmail, IsOptional, IsString, Matches, IsObject } from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    username?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsString()
    bio?: string;

    @IsOptional()
    @IsString()
    avatarUrl?: string;

    @IsOptional()
    @Matches(/^\+?[1-9]\d{1,14}$/, {
        message: 'Phone number must be a valid international format',
    })
    phone?: string;

    @IsOptional()
    @IsObject()
    address?: any;
}

export class UserResponseDto {
    id: number;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatarUrl?: string;
    phone?: string;
    address?: any;
    createdAt: Date;
    updatedAt: Date;
}
