import { Body, Controller, Post } from '@nestjs/common';
import { User } from '@prisma/client';
import { RegisterDto, LoginDto } from './dtos/auth.dto';
import { AuthService } from './auth.service';

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
}
