import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-facebook';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(configService: ConfigService) {
    console.log('FacebookStrategy.constructor');
    super({
      clientID: configService.get<string>('FACEBOOK_CLIENT_ID') || '',
      clientSecret: configService.get<string>('FACEBOOK_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('FACEBOOK_CALLBACK_URL') || '',
      profileFields: ['id', 'emails', 'name'],
      scope: ['email'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: Function,
  ): any {
    console.log('FacebookStrategy.validate', { accessToken, refreshToken });
    const { id, emails, name } = profile;
    console.log('FacebookStrategy.validate', profile);
    const user = {
      facebookId: id,
      email: emails?.[0]?.value,
      name: name?.givenName + ' ' + name?.familyName,
    };
    done(null, user);
  }
}
