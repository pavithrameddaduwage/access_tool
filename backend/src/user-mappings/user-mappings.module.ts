import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserMappingsService } from './user-mappings.service';
import { UserMappingsController } from './user-mappings.controller';
import { UserMapping } from './entities/user-mapping.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserMapping])], // Register the entity
  controllers: [UserMappingsController], // Register the controller
  providers: [UserMappingsService], // Register the service
})
export class UserMappingsModule {}