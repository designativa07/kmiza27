import { Controller, Post, Body, Logger } from '@nestjs/common';
import { YouthService } from './youth.service';

@Controller('youth')
export class YouthController {
  private readonly logger = new Logger(YouthController.name);

  constructor(private readonly youthService: YouthService) {}
}
