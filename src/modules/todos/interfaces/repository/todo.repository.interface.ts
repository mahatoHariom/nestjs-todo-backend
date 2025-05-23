import { Todo } from '@prisma/client';
import { CreateTodoDto, UpdateTodoDto } from '../../dto/todo.dto';

export interface TodoRepositoryInterface {
  create(userId: number, createTodoDto: CreateTodoDto): Promise<Todo>;
  findAll(userId: number): Promise<Todo[]>;
  findOne(id: number, userId: number): Promise<Todo | null>;
  update(
    id: number,
    userId: number,
    updateTodoDto: UpdateTodoDto,
  ): Promise<Todo>;
  remove(id: number, userId: number): Promise<Todo>;
  exists(id: number, userId: number): Promise<boolean>;
}
