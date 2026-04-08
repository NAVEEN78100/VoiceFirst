import { TouchpointService } from './touchpoint.service';
import { CreateTouchpointDto, UpdateTouchpointDto } from './dto/touchpoint.dto';
export declare class TouchpointController {
    private readonly touchpointService;
    constructor(touchpointService: TouchpointService);
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
