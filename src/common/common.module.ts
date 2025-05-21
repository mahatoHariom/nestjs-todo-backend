import { Module } from '@nestjs/common';
import { AppLogger } from './logger/app-logger.service';

@Module({
  providers: [AppLogger],
  exports: [AppLogger],
})
export class CommonModule {}
