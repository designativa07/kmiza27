import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([]), // Não precisamos de entidades específicas para este módulo
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'kmiza27_secret_key_admin',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
