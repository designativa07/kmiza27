import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, Team } from '../../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Team]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {} 