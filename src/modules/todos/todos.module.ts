import { Module } from '@nestjs/common';
import { TodosService } from './todos.service';
import { TodosController } from './todos.controller';
import { TodoRepository } from './repositories/todo.repository';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [TodosController],
  providers: [
    TodosService,
    TodoRepository,
    {
      provide: 'TodoRepositoryInterface',
      useClass: TodoRepository,
    },
  ],
})
export class TodosModule {}
