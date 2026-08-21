import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Usuarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private svc: UsersService) {}

  @Post() @RequirePermissions('users.create')
  create(@Body() b: any) { return this.svc.create(b); }

  @Get() @RequirePermissions('users.view')
  list() { return this.svc.list(); }

  @Patch(':id') @RequirePermissions('users.update')
  update(@Param('id') id: string, @Body() b: any) { return this.svc.update(id, b); }

  @Delete(':id') @RequirePermissions('users.delete')
  remove(@Param('id') id: string, @Request() req) { return this.svc.remove(id, req.user.id); }
}