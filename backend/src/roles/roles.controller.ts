import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException, Put } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

 @Get()
       async getAllRoles() {
         return this.rolesService.getAllRoles();
       }
     
       @Get(':id')
       async getRoleById(@Param('id') id: number) {
         const role = await this.rolesService.getRoleById(id);
         if (!role) {
           throw new NotFoundException(`Role with ID ${id} not found.`);
         }
         return role;
       }

       @Get('webtool/:webtoolId')
       async getRolesByWebtool(@Param('webtoolId') webtoolId: string) {
         return this.rolesService.getRolesByWebtool(+webtoolId);
       }
     
       @Post()
       async createRole(@Body() createRoleDto: CreateRoleDto) {
         return this.rolesService.createRole(createRoleDto);
       }
     
   
       @Put(':id')
       async updateWebtool(
         @Param('id') id: number,
         @Body() updateRoleDto: UpdateRoleDto,
       ) {
         const role = await this.rolesService.getRoleById(id);
         if (!role) {
           throw new NotFoundException(`Role with ID ${id} not found.`);
         }
         return this.rolesService.updateRole(id, updateRoleDto);
       }
   
   
     
       @Delete(':id')
       async deleteRole (@Param('id') id: number) {
         const role = await this.rolesService.getRoleById(id);
         if (!role) {
           throw new NotFoundException(`Role with ID ${id} not found.`);
         }
         return this.rolesService.deleteRole(id);
       }
}
