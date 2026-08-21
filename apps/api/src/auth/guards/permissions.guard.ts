import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AppRole, Permission, ROLE_PERMISSIONS } from "@suite/shared";

export const PERMISSIONS_KEY = 'permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true
    }

    const req = context.switchToHttp().getRequest();
    const role = req.user?.role as AppRole;
    if (!role) return false

    const userPerms = ROLE_PERMISSIONS[role] || [];
    return required.every((p) => userPerms.includes(p))
  }
}