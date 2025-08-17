import { Controller, Post, Body, Logger } from '@nestjs/common';
import { YouthService } from './youth.service';

@Controller('youth')
export class YouthController {
  private readonly logger = new Logger(YouthController.name);

  constructor(private readonly youthService: YouthService) {}

  @Post('promote-player')
  async promotePlayer(@Body() body: { playerId: string; teamId: string }) {
    this.logger.log(
      `Promoting player ${body.playerId} for team ${body.teamId}`,
    );
    return this.youthService.promotePlayer(body.playerId, body.teamId);
  }
}
