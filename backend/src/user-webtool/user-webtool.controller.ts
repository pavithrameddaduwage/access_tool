import { Controller, Get, Post, Body, Param, Delete, HttpStatus, HttpCode, UseGuards, Req } from '@nestjs/common';
import { UserWebtoolService } from './user-webtool.service';
import { CreateUserWebtoolDto } from './dto/create-user-webtool.dto';
import { ExternalWebtoolAssignmentDto } from './dto/external-webtool-assignment.dto';
import { ExternalWebtoolGuard } from 'src/auth/guards/external-webtool.guard';
import { ExternalDeleteAssignmentDto } from './dto/external-delete-assignment.dto';

@Controller('user-webtools')
export class UserWebtoolController {
  constructor(private readonly userWebtoolService: UserWebtoolService) {}

  @Post()
  create(@Body() createUserWebtoolDto: CreateUserWebtoolDto) {
    return this.userWebtoolService.create(createUserWebtoolDto);
  }

  @Get()
  findAll() {
    return this.userWebtoolService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userWebtoolService.findOne(+id);
  }

  @Delete(':email/:webtoolId')
  remove(@Param('email') email: string, @Param('webtoolId') webtoolId: string) {  //maybe number idk
    return this.userWebtoolService.remove(email, +webtoolId);
  }

  
  @Get('user/:email')
  getUserWebtoolsByUser(@Param('email') email: string) {
    return this.userWebtoolService.getUserWebtoolsByUser(email);
  }
  @Delete(':email/:webtoolId/role/:roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeRole(
    @Param('email') email: string,
    @Param('webtoolId') webtoolId: string,
    @Param('roleId') roleId: string
  ) {
    return this.userWebtoolService.removeRole(
      email,
      +webtoolId,
      +roleId
    );
  }



  // This is just for external use by other webtools I guess @Post('external-assignment')...
  @Post('external-assignment')
  @UseGuards(ExternalWebtoolGuard)
  async createExternalAssignment(
    @Body() dto: ExternalWebtoolAssignmentDto,
    @Req() req: Request  
  ) {
    return this.userWebtoolService.createExternalAssignment(dto);
  }


  @Delete('external-assignment')
@UseGuards(ExternalWebtoolGuard)
async deleteExternalAssignment(
  @Body() dto: ExternalDeleteAssignmentDto
) {
  return this.userWebtoolService.deleteExternalAssignment(dto);
}
}