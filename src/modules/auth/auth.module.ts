import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { AmazonStrategy } from './strategies/amazon.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserRepository } from '../../auth/repositories/user.repository';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    CommonModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '7d',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    AmazonStrategy,
    UserRepository,
    {
      provide: 'UserRepositoryInterface',
      useClass: UserRepository,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
