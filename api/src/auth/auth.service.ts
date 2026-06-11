import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const kam = await this.prisma.kam.findUnique({ where: { email } });
    if (!kam) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const valid = await bcrypt.compare(password, kam.password);
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { email: kam.email, name: kam.name, sub: kam.id };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      kam: { id: kam.id, name: kam.name, email: kam.email },
    };
  }
}
