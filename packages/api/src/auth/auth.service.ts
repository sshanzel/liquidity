import {Injectable, UnauthorizedException, ConflictException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {UserService} from '../user/user.service';
import {LoginInput} from './dto/login.input';
import {RegisterInput} from './dto/register.input';
import {AuthResponse} from './dto/auth.response';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    const existing = await this.userService.findByEmail(input.email);
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);
    const user = await this.userService.create({
      email: input.email,
      password: hashedPassword,
    });

    const accessToken = this.generateToken(user.id, user.email);
    return {accessToken, user};
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.userService.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.generateToken(user.id, user.email);
    return {accessToken, user};
  }

  private generateToken(userId: string, email: string): string {
    return this.jwtService.sign({sub: userId, email});
  }
}
