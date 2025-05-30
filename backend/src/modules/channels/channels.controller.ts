import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { Channel } from '../../entities';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  create(@Body() createChannelDto: Partial<Channel>) {
    return this.channelsService.create(createChannelDto);
  }

  @Get()
  findAll(@Query('active') active?: string, @Query('type') type?: string) {
    if (active === 'true') {
      return this.channelsService.findActive();
    }
    if (type) {
      return this.channelsService.findByType(type);
    }
    return this.channelsService.findAll();
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
  remove(@Param('id') id: string) {
    return this.channelsService.remove(+id);
  }
} 