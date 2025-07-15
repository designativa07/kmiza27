import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { WhatsAppMenuService, MenuSection } from './whatsapp-menu.service';
import { WhatsAppMenuConfig } from '../../entities/whatsapp-menu-config.entity';

@Controller('whatsapp-menu')
export class WhatsAppMenuController {
  constructor(private readonly menuService: WhatsAppMenuService) {}

  @Get('sections')
  async getMenuSections(): Promise<MenuSection[]> {
    return await this.menuService.getMenuSections();
  }

  @Get('general-config')
  async getGeneralConfig(): Promise<{ title: string; description: string; footer: string }> {
    return await this.menuService.getGeneralConfig();
  }

  @Post('general-config')
  async updateGeneralConfig(@Body() config: { title: string; description: string; footer: string }): Promise<{ success: boolean }> {
    const success = await this.menuService.updateGeneralConfig(config);
    return { success };
  }

  @Get('configs')
  async getAllConfigs(): Promise<WhatsAppMenuConfig[]> {
    return await this.menuService.getAllMenuConfigs();
  }

  @Post('configs')
  async createConfig(@Body() config: Partial<WhatsAppMenuConfig>): Promise<WhatsAppMenuConfig> {
    return await this.menuService.createMenuConfig(config);
  }

  @Put('configs/:id')
  async updateConfig(
    @Param('id') id: number,
    @Body() updates: Partial<WhatsAppMenuConfig>
  ): Promise<WhatsAppMenuConfig | null> {
    return await this.menuService.updateMenuConfig(id, updates);
  }

  @Delete('configs/:id')
  async deleteConfig(@Param('id') id: number): Promise<{ success: boolean }> {
    const success = await this.menuService.deleteMenuConfig(id);
    return { success };
  }

  @Post('reorder')
  async reorderItems(@Body() updates: { id: number; section_order?: number; item_order?: number }[]): Promise<{ success: boolean }> {
    const success = await this.menuService.reorderMenuItems(updates);
    return { success };
  }

  @Post('reset-default')
  async resetToDefault(): Promise<{ success: boolean }> {
    const success = await this.menuService.resetToDefault();
    return { success };
  }
} 