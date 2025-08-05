import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async validateUser(username: string, password: string): Promise<any> {
    // Simple hardcoded authentication for demo purposes
    // In production, this should validate against a database
    const validUsers = [
      { username: 'csucc_cashier', password: 'csucccashier2025', role: 'admin' },
      { username: 'cashier1', password: 'cashier123', role: 'cashier' },
      { username: 'cashier2', password: 'cashier123', role: 'cashier' },
    ];

    const user = validUsers.find(
      u => u.username === username && u.password === password
    );

    if (user) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.username, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        username: user.username,
        role: user.role,
      },
    };
  }
}
