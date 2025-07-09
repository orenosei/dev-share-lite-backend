import { IsEmail, IsNotEmpty, Matches, MinLength, IsOptional, IsString, IsObject } from 'class-validator';

export class RegisterDto {
    @IsNotEmpty()
    @IsString()
    username: string;

    @IsEmail()
    email: string;

    @IsNotEmpty()
    @MinLength(6)
    password: string;

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

export class LoginDto {
    @IsNotEmpty()
    @IsString()
    identifier: string; // Can be either email or username

    @IsNotEmpty()
    password: string;
}

export class ChangePasswordDto {
    @IsNotEmpty()
    @IsString()
    currentPassword: string;

    @IsNotEmpty()
    @MinLength(6)
    newPassword: string;
}