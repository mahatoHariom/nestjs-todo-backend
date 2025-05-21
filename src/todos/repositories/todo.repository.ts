import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTodoDto, UpdateTodoDto } from '../dto/todo.dto';
import { AppLogger } from '../../common/logger/app-logger.service';
import { TodoRepositoryInterface } from '../interfaces/repository/todo.repository.interface';
import { Todo } from '@prisma/client';

@Injectable()
export class TodoRepository implements TodoRepositoryInterface {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(TodoRepository.name);
  }

  async create(userId: number, createTodoDto: CreateTodoDto): Promise<Todo> {
    this.logger.debug(`Creating todo for user: ${userId}`);

    return this.prisma.todo.create({
      data: {
        ...createTodoDto,
        dueDate: createTodoDto.dueDate ? new Date(createTodoDto.dueDate) : null,
        userId,
      },
    });
  }

  async findAll(userId: number): Promise<Todo[]> {
    this.logger.debug(`Finding all todos for user: ${userId}`);

    return this.prisma.todo.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, userId: number): Promise<Todo | null> {
    this.logger.debug(`Finding todo with id: ${id} for user: ${userId}`);

    return this.prisma.todo.findFirst({
      where: { id, userId },
    });
  }

  async update(
    id: number,
    userId: number,
    updateTodoDto: UpdateTodoDto,
  ): Promise<Todo> {
    this.logger.debug(`Updating todo with id: ${id} for user: ${userId}`);

    return this.prisma.todo.update({
      where: { id },
      data: {
        ...updateTodoDto,
        dueDate: updateTodoDto.dueDate
          ? new Date(updateTodoDto.dueDate)
          : undefined,
      },
    });
  }

  async remove(id: number, userId: number): Promise<Todo> {
    this.logger.debug(`Removing todo with id: ${id} for user: ${userId}`);

    return this.prisma.todo.delete({
      where: { id },
    });
  }

  async exists(id: number, userId: number): Promise<boolean> {
    this.logger.debug(
      `Checking if todo with id: ${id} exists for user: ${userId}`,
    );

    const todo = await this.prisma.todo.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    return !!todo;
  }
}
