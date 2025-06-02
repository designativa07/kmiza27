import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { Channel } from '../../entities/channel.entity';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  create(@Body() createChannelDto: Partial<Channel>) {
    return this.channelsService.create(createChannelDto);
  }

  @Get()
  findAll() {
    return this.channelsService.findAll();
  }

  @Get('active')
  findActive() {
    return this.channelsService.findActive();
  }

  @Get('type/:type')
  findByType(@Param('type') type: string) {
    return this.channelsService.findByType(type);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.channelsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateChannelDto: Partial<Channel>) {
    return this.channelsService.update(+id, updateChannelDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.channelsService.delete(+id);
  }
} 