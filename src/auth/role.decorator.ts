import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/users/entities/user.entity';

// 권한을 위한 유저 role 타입 지정 (any는 모든 유저일 경우)
export type AllowedRoles = keyof typeof UserRole | 'Any';

// Role decorator
export const Role = (roles: AllowedRoles[]) => SetMetadata('roles', roles);
