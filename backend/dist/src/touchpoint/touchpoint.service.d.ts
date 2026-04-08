import { PrismaService } from '../prisma/prisma.service';
import { CreateTouchpointDto, UpdateTouchpointDto } from './dto/touchpoint.dto';
export declare class TouchpointService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(user: any): Promise<({
        branch: {
            id: string;
            name: string;
            code: string | null;
        };
        staff: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
        } | null;
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        branchId: string;
        token: string;
        type: import("@prisma/client").$Enums.TouchpointType;
        staffId: string | null;
    })[]>;
    findOne(id: string, user: any): Promise<{
        branch: {
            id: string;
            name: string;
            code: string | null;
            location: string | null;
            isActive: boolean;
            areaId: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        staff: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
        } | null;
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        branchId: string;
        token: string;
        type: import("@prisma/client").$Enums.TouchpointType;
        staffId: string | null;
    }>;
    findByToken(token: string): Promise<{
        name: string;
        type: import("@prisma/client").$Enums.TouchpointType;
        branch: {
            name: string;
            location: string | null;
        };
    }>;
    create(createTouchpointDto: CreateTouchpointDto, user: any): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        branchId: string;
        token: string;
        type: import("@prisma/client").$Enums.TouchpointType;
        staffId: string | null;
    }>;
    update(id: string, updateTouchpointDto: UpdateTouchpointDto, user: any): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        branchId: string;
        token: string;
        type: import("@prisma/client").$Enums.TouchpointType;
        staffId: string | null;
    }>;
    remove(id: string, user: any): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        branchId: string;
        token: string;
        type: import("@prisma/client").$Enums.TouchpointType;
        staffId: string | null;
    }>;
}
