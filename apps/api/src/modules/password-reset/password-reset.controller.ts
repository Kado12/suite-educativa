import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PasswordResetService } from './password-reset.service';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResolvePasswordResetDto } from './dto/resolve-password-reset.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Password Reset')
@Controller('password-reset')
export class PasswordResetController {
  constructor(private service: PasswordResetService) {}

  @Post('request')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async requestReset(@Body() dto: RequestPasswordResetDto) {
    return this.service.requestPasswordReset(dto.email);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('users.update')
  async listPending() {
    return this.service.listPendingRequests();
  }

  @Get('pending/count')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('users.update')
  async getPendingCount() {
    const count = await this.service.getPendingCount();
    return { count };
  }

  @Post(':id/resolve')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('users.update')
  async resolve(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: ResolvePasswordResetDto,
  ) {
    return this.service.resolveRequest(id, req.user.id, dto.customPassword);
  }
}