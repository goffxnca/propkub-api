import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    console.log(
      'JwtStrategy@config.get(JWT_SECRET):',
      config.get('JWT_SECRET'),
    );
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET')!,
      ignoreExpiration: false,
    });
  }
  validate(payload: any) {
    return { userId: payload.sub };
  }
}
