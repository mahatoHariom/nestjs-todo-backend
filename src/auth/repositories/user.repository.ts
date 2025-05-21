import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from '../dto/auth.dto';
import { UserRepositoryInterface } from '../interfaces/repository/user.repository.interface';
import { AppLogger } from '../../common/logger/app-logger.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserRepository implements UserRepositoryInterface {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(UserRepository.name);
  }

  async findByEmail(email: string): Promise<User | null> {
    this.logger.debug(`Finding user by email: ${email}`);
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async createUser(registerDto: RegisterDto): Promise<User> {
    const { email, password, name } = registerDto;
    this.logger.debug(`Creating user with email: ${email}`);

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        authProvider: 'local',
      },
    });
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    this.logger.debug(`Updating user with ID: ${id}`);
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async createGoogleUser(
    email: string,
    name: string,
    picture: string | null,
  ): Promise<User> {
    this.logger.debug(`Creating Google user with email: ${email}`);

    return this.prisma.user.create({
      data: {
        email,
        name,
        password: '',
        authProvider: 'google',
        profilePicture: picture,
      },
    });
  }
}
