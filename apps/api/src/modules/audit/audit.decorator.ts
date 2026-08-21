import { SetMetadata } from '@nestjs/common';
import { AUDIT_KEY } from './audit.interceptor';

export const Auditable = (action: string, entity: string) => SetMetadata(AUDIT_KEY, { action, entity });