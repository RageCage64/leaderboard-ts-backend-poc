import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Public } from 'src/publicDecorator';
import { User } from 'src/users/user.entity';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { comparePassword, hashPassword } from './passwords';

@Controller('auth')
export class AuthController {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  @Post('/register')
  @Public()
  async register(@Body() registerDto: RegisterDto) {
    if (registerDto.password != registerDto.passwordConfirm) {
      throw new BadRequestException();
    }
    const newUser = new User();
    newUser.username = registerDto.username;
    newUser.email = registerDto.email;
    newUser.password = await hashPassword(registerDto.password);
    const createdUser = await this.usersService.create(newUser);
    return {
      username: createdUser.username,
      email: createdUser.email,
    };
  }

  @Post('/login')
  @Public()
  async login(@Body() loginDto: LoginDto) {
    const user = await this.usersService.findOne({ email: loginDto.email });
    if (!user) {
      throw new NotFoundException();
    }
    if (!comparePassword(loginDto.password, user.password)) {
      throw new UnauthorizedException();
    }
    const payload = { username: user.username, sub: user.id };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  @Get('/me')
  async me(@Req() req) {
    return {
      user: req.user,
    };
  }
}
