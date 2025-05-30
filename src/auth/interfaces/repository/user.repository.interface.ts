import { User } from '@prisma/client';
import { RegisterDto } from '../../../modules/auth/dto/auth.dto';

export interface UserRepositoryInterface {
  findByEmail(email: string): Promise<User | null>;
  createUser(registerDto: RegisterDto): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  createGoogleUser(
    email: string,
    name: string,
    picture: string | null,
  ): Promise<User>;
  createAmazonUser(
    email: string,
    name: string,
    picture: string | null,
  ): Promise<User>;
}
