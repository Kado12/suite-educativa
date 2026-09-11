import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Auditable } from '../audit/audit.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Usuarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private svc: UsersService) { }

  @Get()
  @RequirePermissions('users.view')
  list() {
    return this.svc.list();
  }

  @Post()
  @RequirePermissions('users.create')
  @Auditable('CREATE', 'User')
  create(@Body() dto: CreateUserDto) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('users.update')
  @Auditable('UPDATE', 'User')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.svc.update(id, dto);
  }

  @Patch(':id/activate')
  @RequirePermissions('users.update')
  @Auditable('ACTIVATE', 'User')
  activate(@Param('id') id: string) {
    return this.svc.activate(id);
  }

  @Delete(':id')
  @RequirePermissions('users.delete')
  @Auditable('DELETE', 'User')
  remove(@Param('id') id: string, @Request() req) {
    return this.svc.remove(id, req.user.id);
  }
}