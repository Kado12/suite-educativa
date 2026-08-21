import { SetMetadata } from "@nestjs/common";
import { Permission } from "@suite/shared";
import { PERMISSIONS_KEY } from "../guards/permissions.guard";

export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions)