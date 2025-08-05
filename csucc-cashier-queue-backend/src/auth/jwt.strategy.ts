import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from './constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: (req) => {
        // For WebSocket connections, the token is in req.handshake.auth.token
        if (req.handshake && req.handshake.auth && req.handshake.auth.token) {
          return req.handshake.auth.token;
        }
        // For HTTP requests, extract from Authorization header
        const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        if (token) {
          return token;
        }
        // Fallback for other cases, if any
        return null;
      },
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}

