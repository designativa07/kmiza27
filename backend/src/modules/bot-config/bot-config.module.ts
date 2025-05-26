import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotConfigController } from './bot-config.controller';
import { BotConfigService } from './bot-config.service';
import { BotConfig } from '../../entities/bot-config.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BotConfig])
  ],
  controllers: [BotConfigController],
  providers: [BotConfigService],
  exports: [BotConfigService]
})
export class BotConfigModule {} 