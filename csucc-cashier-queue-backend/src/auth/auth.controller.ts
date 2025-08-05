import { Controller, Post, Request, UseGuards, Get, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('create-user')
  async createUser(@Body() createUserDto: CreateUserDto, @Request() req) {
    // Only admin can create users
    if (req.user.role !== 'admin') {
      throw new Error('Unauthorized: Only admin can create users');
    }
    return this.authService.createUser(createUserDto);
  }
}

