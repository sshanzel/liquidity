import {Injectable, UnauthorizedException, ConflictException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {UserService} from '../user/user.service';
import {User} from '../db/catalog/entities/user.entity';
import {LoginInput} from './dto/login.input';
import {RegisterInput} from './dto/register.input';
import {AuthResponse} from './dto/auth.response';

export interface JwtPayload {
  sub: string;
  tenantId: string;
  username: string;
  taxId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    const existing = await this.userService.findByUsername(input.username);
    if (existing) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);
    const user = await this.userService.create({
      tenantId: input.tenantId,
      username: input.username,
      password: hashedPassword,
      taxId: input.taxId,
    });

    const accessToken = this.generateToken(user);
    return {accessToken, user};
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.userService.findByUsername(input.username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.generateToken(user);
    return {accessToken, user};
  }

  private generateToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      username: user.username,
      taxId: user.taxId,
    };
    return this.jwtService.sign(payload);
  }
}
