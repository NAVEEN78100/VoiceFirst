import { Role } from '../../common/enums/role.enum';
export declare class CreateUserDto {
    email: string;
    password?: string;
    name?: string;
    role: Role;
    branchId?: string;
}
