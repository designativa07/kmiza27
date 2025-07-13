import { Controller, Get, Param, Post, Body, Patch, Delete } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('admins')
  getAdminUsers() {
    return this.usersService.getAdminUsers();
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

  @Post('create-admin')
  createAdminUser(@Body() createAdminDto: {
    name: string;
    email?: string;
    phone_number?: string;
    password: string;
  }) {
    return this.usersService.createAdminUser(createAdminDto);
  }

  @Post('find-or-create')
  findOrCreateUser(@Body() userData: { phoneNumber: string; name?: string; origin?: string }) {
    return this.usersService.findOrCreateUser(userData.phoneNumber, userData.name, userData.origin);
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
  updateUser(@Param('id') id: string, @Body() updateData: { 
    name?: string; 
    phone_number?: string; 
    is_active?: boolean;
    is_admin?: boolean;
    email?: string;
  }) {
    return this.usersService.updateUser(+id, updateData);
  }

  @Patch(':id/promote-admin')
  promoteToAdmin(@Param('id') id: string) {
    return this.usersService.promoteToAdmin(+id);
  }

  @Patch(':id/demote-admin')
  demoteFromAdmin(@Param('id') id: string) {
    return this.usersService.demoteFromAdmin(+id);
  }

  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(+id);
  }
} 