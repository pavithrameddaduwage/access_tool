import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Public() // This is crucial
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() signInDto: Record<string, any>) {
    try {
      console.log('Login request received:', signInDto);
      const result = await this.authService.signIn(
        signInDto.email, 
        signInDto.password
      );
      return result;
    } catch (error) {
      console.error('Login error in controller:', error);
      throw error; // Let the exception filter handle it
    }
  }
  //   @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @Get('getADUserDetails/:userId')
  getADUserDetails(@Param('userId') userId) {
    return this.authService.getADUserDetails(userId);
  }


  @Post('searchUsers')
  async searchUsers(@Body() data: any) {
    try {
      const users = await this.authService.searchUsers(data.searchkey);
      return users;
    } catch (error) {
      return { error: 'Failed to search users', details: error.message };
    }
  }
}
