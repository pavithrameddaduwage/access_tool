import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { UserMappingsService } from "./user-mappings.service";
import { UserMapping } from "./entities/user-mapping.entity";

@Controller('user-mappings')
export class UserMappingsController {
  constructor(private readonly userMappingsService: UserMappingsService) {}

  @Get(':email')
  async getMapping(@Param('email') email: string): Promise<UserMapping | null> {
    const mapping = await this.userMappingsService.findByEmail(email);
    if (!mapping) {
      return null;
    }
    return mapping;
  }

  @Post()
  async createMapping(@Body() body: { email: string; realName: string }): Promise<UserMapping> {
    return this.userMappingsService.upsert(body.email, body.realName);
  }
}