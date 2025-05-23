/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
// import { PrismaService } from '@core/database/prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { AppLogger } from '@common/logger/app-logger.service';
import { User } from '@prisma/client';
import { UserRepositoryInterface } from '@app/auth/interfaces/repository/user.repository.interface';
type AuthenticatedUser = Pick<User, 'id' | 'email'> & {
  name: string | null;
  token: string;
  picture?: string | null;
};

interface GoogleUser {
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
  accessToken: string;
}

interface AmazonUser {
  email: string;
  name: string;
  userId: string;
  picture?: string;
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
    private readonly jwtService: JwtService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AuthService.name);
  }

  async register(registerDto: RegisterDto): Promise<AuthenticatedUser> {
    const { email } = registerDto;

    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      this.logger.warn(`Registration attempt with existing email: ${email}`);
      throw new ConflictException('Email already exists');
    }

    const user = await this.userRepository.createUser(registerDto);

    this.logger.log(`User registered successfully: ${user.id}`);

    const token = this.generateToken(
      user.id,
      user.email,
      user.name,
      user.profilePicture,
    );

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      token,
      picture: user.profilePicture,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthenticatedUser> {
    const { email, password } = loginDto;

    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      this.logger.warn(`Login attempt with non-existent email: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.authProvider === 'google') {
      this.logger.warn(`Local login attempt for Google user: ${user.id}`);
      throw new UnauthorizedException(
        'This account uses Google authentication. Please sign in with Google.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      this.logger.warn(`Invalid password attempt for user: ${user.id}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`User logged in successfully: ${user.id}`);

    const token = this.generateToken(
      user.id,
      user.email,
      user.name,
      user.profilePicture,
    );

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      token,
      picture: user.profilePicture,
    };
  }

  async validateOrCreateGoogleUser(
    googleUser: GoogleUser,
  ): Promise<AuthenticatedUser> {
    const { email, firstName, lastName, picture } = googleUser;
    this.logger.debug(`Google login attempt for: ${email}`);
    this.logger.debug(
      `Google profile details: firstName=${firstName}, lastName=${lastName}, picture=${picture ? 'present' : 'absent'}`,
    );

    let user = await this.userRepository.findByEmail(email);

    if (!user) {
      const fullName = `${firstName} ${lastName}`.trim();
      user = await this.userRepository.createGoogleUser(
        email,
        fullName,
        picture || null,
      );

      this.logger.log(`New Google user created with ID: ${user.id}`);

      const token = this.generateToken(
        user.id,
        user.email,
        user.name,
        user.profilePicture,
      );

      return {
        id: user.id,
        email: user.email,
        name: user.name || null,
        token,
        picture: user.profilePicture || null,
      };
    } else if (user.authProvider !== 'google') {
      this.logger.debug(
        `Updating existing user (id=${user.id}) to use Google auth`,
      );

      user = await this.userRepository.updateUser(user.id, {
        authProvider: 'google',
        profilePicture: picture || null,
      });

      this.logger.log(`Existing user updated to use Google auth: ${user.id}`);
    }

    this.logger.debug(
      `User data for token: id=${user.id}, email=${user.email}, name=${user.name || 'null'}, picture=${user.profilePicture ? 'present' : 'null'}`,
    );

    const token = this.generateToken(
      user.id,
      user.email,
      user.name,
      user.profilePicture,
    );

    if (token) {
      const tokenPrefix = token.substring(0, 15) + '...';
      this.logger.debug(`Generated token: ${tokenPrefix}`);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || null,
      token,
      picture: user.profilePicture || null,
    };
  }

  async validateOrCreateAmazonUser(
    amazonUser: AmazonUser,
  ): Promise<AuthenticatedUser> {
    const { email, name, picture } = amazonUser;
    this.logger.debug(`Amazon login attempt for: ${email}`);
    this.logger.debug(
      `Amazon profile details: name=${name}, picture=${picture ? 'present' : 'absent'}`,
    );

    let user = await this.userRepository.findByEmail(email);

    if (!user) {
      user = await this.userRepository.createAmazonUser(
        email,
        name,
        picture || null,
      );

      this.logger.log(`New Amazon user created with ID: ${user.id}`);

      const token = this.generateToken(
        user.id,
        user.email,
        user.name,
        user.profilePicture,
      );

      return {
        id: user.id,
        email: user.email,
        name: user.name || null,
        token,
        picture: user.profilePicture || null,
      };
    } else if (user.authProvider !== 'amazon') {
      this.logger.debug(
        `Updating existing user (id=${user.id}) to use Amazon auth`,
      );

      user = await this.userRepository.updateUser(user.id, {
        authProvider: 'amazon',
        profilePicture: picture || null,
      });

      this.logger.log(`Existing user updated to use Amazon auth: ${user.id}`);
    }

    this.logger.debug(
      `User data for token: id=${user.id}, email=${user.email}, name=${user.name || 'null'}, picture=${user.profilePicture ? 'present' : 'null'}`,
    );

    const token = this.generateToken(
      user.id,
      user.email,
      user.name,
      user.profilePicture,
    );

    if (token) {
      const tokenPrefix = token.substring(0, 15) + '...';
      this.logger.debug(`Generated token: ${tokenPrefix}`);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || null,
      token,
      picture: user.profilePicture || null,
    };
  }

  private generateToken(
    userId: number,
    email: string,
    name: string | null | undefined,
    picture: string | null | undefined,
  ): string {
    this.logger.debug(
      `Generating token with: userId=${userId}, email=${email}, name=${name || 'null'}, picture=${picture ? 'present' : 'null'}`,
    );

    const payload = {
      sub: userId,
      email,
      name: name || null,
      picture: picture || null,
    };

    this.logger.debug(`JWT payload: ${JSON.stringify(payload)}`);

    return this.jwtService.sign(payload);
  }
}
