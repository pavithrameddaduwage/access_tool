import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PowerBiAuthService } from './powerbi-auth.service';
import { PowerBIService } from './powerbi.service';

@Module({
  imports: [ConfigModule],
  providers: [PowerBiAuthService, PowerBIService],
  exports: [PowerBiAuthService, PowerBIService],
})
export class PowerBIModule {}
