/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
    constructor(private configService: ConfigService) {
        super({
        clientID: configService.get<string>('FACEBOOK_APP_ID'),
        clientSecret: configService.get<string>('FACEBOOK_APP_SECRET'),
        callbackURL: configService.get<string>('FACEBOOK_CALLBACK_URL'),
        profileFields: ['id', 'emails', 'name', 'photos'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (err: any, user: any, info?: any) => void,
    ): Promise<any> {
        const { id, name, emails, photos } = profile;

        const user = {
        facebookId: id,
        email: emails[0].value,
        firstName: name.givenName,
        lastName: name.familyName,
        profileImage: photos[0].value,
        accessToken,
        };

        done(null, user);
    }
}