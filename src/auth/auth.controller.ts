import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { RegisterDto, LoginDto, ChangePasswordDto } from './dtos/auth.dto';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('register')
    async register(@Body() body: RegisterDto): Promise<Omit<User, 'password'>> {
        return this.authService.register(body);
    }

    @Post('login')
    async login(@Body() body: LoginDto): Promise<Omit<User, 'password'>> {
        return this.authService.login(body.identifier, body.password);
    }

    @Post('change-password')
    @UseGuards(AuthGuard)
    async changePassword(@Request() req: any, @Body() body: ChangePasswordDto): Promise<{ message: string }> {
        await this.authService.changePassword(req.user.id, body.currentPassword, body.newPassword);
        return { message: 'Password changed successfully' };
    }
}
