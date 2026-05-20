import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { WebtoolUserService } from "./webtool-user.service";
import { CreateWebtoolUserDto } from "./dto/create-webtool-user.dto";

@Controller('webtool-user')
export class WebtoolUserController {
  constructor(private readonly webtoolUserService: WebtoolUserService) {}

  @Get()
  findAll() {
    return this.webtoolUserService.findAll();
  }

  @Post()
  create(@Body() createDto: CreateWebtoolUserDto) {
    return this.webtoolUserService.create(createDto);
  }

  @Delete(':email/:webtoolId')
  async remove(
    @Param('email') email: string,
    @Param('webtoolId') webtoolId: string,
  ) {
    return this.webtoolUserService.remove(email, +webtoolId);
  }
}