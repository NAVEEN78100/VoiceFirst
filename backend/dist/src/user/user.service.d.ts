import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../common/enums/role.enum';
export declare class UserService {
    private readonly prisma;
    private readonly logger;
    private readonly SALT_ROUNDS;
    constructor(prisma: PrismaService);
    create(createUserDto: CreateUserDto, currentUser: {
        id: string;
        role: Role;
        branchId?: string | null;
        email?: string;
    }): Promise<any>;
    findAll(currentUser: {
        role: Role;
        branchId?: string | null;
    }): Promise<any[]>;
    findById(id: string): Promise<{
        id: string;
        name: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        password: string;
        role: import("@prisma/client").$Enums.Role;
        branchId: string | null;
        mustResetPassword: boolean;
        twoFactorEnabled: boolean;
        twoFactorMethod: import("@prisma/client").$Enums.TwoFactorMethod | null;
        totpSecret: string | null;
        lastLogin: Date | null;
    }>;
    findByIdSafe(id: string): Promise<any>;
    findByEmail(email: string): Promise<{
        id: string;
        name: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        password: string;
        role: import("@prisma/client").$Enums.Role;
        branchId: string | null;
        mustResetPassword: boolean;
        twoFactorEnabled: boolean;
        twoFactorMethod: import("@prisma/client").$Enums.TwoFactorMethod | null;
        totpSecret: string | null;
        lastLogin: Date | null;
    } | null>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<any>;
    deactivate(id: string): Promise<any>;
    updateLastLogin(id: string): Promise<void>;
    private sanitizeUser;
}
