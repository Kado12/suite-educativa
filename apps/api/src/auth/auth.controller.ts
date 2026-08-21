import { Body, Controller, Get, Patch, Post, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor (private auth: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  profile(@Request() req) {
    return this.auth.getProfile(req.user.id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateProfile(@Request() req, @Body() body: { firstName?: string; lastName?: string; emailPrefix?: string }) {
    return this.auth.updateProfile(req.user.id, body);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  changePassword(@Request() req, @Body() body: { currentPassword: string; newPassword: string }) {
    return this.auth.changePassword(req.user.id, body.currentPassword, body.newPassword);
  }
}