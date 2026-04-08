import { Role } from '../../common/enums/role.enum';
export declare class UpdateUserDto {
    password?: string;
    role?: Role;
    branchId?: string;
    isActive?: boolean;
}
