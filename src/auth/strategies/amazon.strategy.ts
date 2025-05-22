/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-amazon';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { AppLogger } from '../../common/logger/app-logger.service';

type AmazonProfile = {
  email: string;
  name: string;
  userId: string;
  picture?: string;
  accessToken: string;
};

@Injectable()
export class AmazonStrategy extends PassportStrategy(Strategy, 'amazon') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly logger: AppLogger,
  ) {
    super({
      clientID: configService.get<string>('AMAZON_CLIENT_ID'),
      clientSecret: configService.get<string>('AMAZON_CLIENT_SECRET'),
      callbackURL: configService.get<string>('AMAZON_CALLBACK_URL'),
      scope: 'profile',
      authorizationURL: 'https://www.amazon.com/ap/oa',
      tokenURL: 'https://api.amazon.com/auth/o2/token',
    });
    this.logger.setContext(AmazonStrategy.name);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user: any) => void,
  ): Promise<void> {
    try {
      this.logger.debug(`Validating Amazon profile: ${profile.id}`);

      const email = this.extractEmail(profile);
      const name = profile.displayName || profile._json?.name || '';
      const userId = profile.id || profile._json?.user_id || '';

      if (!email) {
        this.logger.error('No email address found in Amazon profile data');
        return done(
          new Error('No email address received from Amazon'),
          undefined,
        );
      }

      const amazonProfile: AmazonProfile = { email, name, userId, accessToken };
      const user =
        await this.authService.validateOrCreateAmazonUser(amazonProfile);

      return done(null, user);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Amazon authentication error: ${errorMessage}`);
      return done(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
      );
    }
  }

  private extractEmail(profile: any): string {
    return (
      profile._json?.email ||
      (profile.emails && profile.emails[0]?.value) ||
      profile.email ||
      ''
    );
  }
}
