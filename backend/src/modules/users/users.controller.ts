import { Controller, Get, Param, Post, Body, Patch, Delete } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('stats')
  getStats() {
    return this.usersService.getUserStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Get('phone/:phone')
  findByPhone(@Param('phone') phone: string) {
    return this.usersService.findByPhone(phone);
  }

  @Post()
  createUser(@Body() createUserDto: { phoneNumber: string; name?: string }) {
    return this.usersService.createUser(createUserDto.phoneNumber, createUserDto.name);
  }

  @Post('find-or-create')
  findOrCreateUser(@Body() userData: { phoneNumber: string; name?: string }) {
    return this.usersService.findOrCreateUser(userData.phoneNumber, userData.name);
  }

  @Patch(':id/favorite-team')
  setFavoriteTeam(@Param('id') id: string, @Body() teamData: { teamSlug: string }) {
    // Primeiro buscar o usuário para pegar o phone_number
    return this.usersService.findOne(+id).then(user => {
      if (user) {
        return this.usersService.setFavoriteTeam(user.phone_number, teamData.teamSlug);
      }
      return null;
    });
  }

  @Post('phone/:phone/favorite-team')
  setFavoriteTeamByPhone(@Param('phone') phone: string, @Body() teamData: { teamSlug: string }) {
    return this.usersService.setFavoriteTeam(phone, teamData.teamSlug);
  }

  @Patch(':id')
  updateUser(@Param('id') id: string, @Body() updateData: { name?: string; phone_number?: string; is_active?: boolean }) {
    return this.usersService.updateUser(+id, updateData);
  }

  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(+id);
  }
} 