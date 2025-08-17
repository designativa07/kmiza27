import { Module } from '@nestjs/common';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { MarketAIService } from './market-ai.service';
import { MarketNotificationsService } from './market-notifications.service';

@Module({
  controllers: [MarketController],
  providers: [MarketService, MarketAIService, MarketNotificationsService],
  exports: [MarketService, MarketAIService, MarketNotificationsService],
})
export class MarketModule {}
