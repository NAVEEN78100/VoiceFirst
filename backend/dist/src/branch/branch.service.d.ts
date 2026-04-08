import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
export declare class BranchService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createBranchDto: CreateBranchDto): Promise<{
        id: string;
        name: string;
        code: string | null;
        location: string | null;
        isActive: boolean;
        areaId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(): Promise<({
        _count: {
            users: number;
            touchpoints: number;
        };
    } & {
        id: string;
        name: string;
        code: string | null;
        location: string | null;
        isActive: boolean;
        areaId: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(id: string): Promise<{
        touchpoints: {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            branchId: string;
            token: string;
            type: import("@prisma/client").$Enums.TouchpointType;
            staffId: string | null;
        }[];
    } & {
        id: string;
        name: string;
        code: string | null;
        location: string | null;
        isActive: boolean;
        areaId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, updateBranchDto: UpdateBranchDto): Promise<{
        id: string;
        name: string;
        code: string | null;
        location: string | null;
        isActive: boolean;
        areaId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        code: string | null;
        location: string | null;
        isActive: boolean;
        areaId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
