"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UserService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../prisma/prisma.service");
const role_enum_1 = require("../common/enums/role.enum");
let UserService = UserService_1 = class UserService {
    prisma;
    logger = new common_1.Logger(UserService_1.name);
    SALT_ROUNDS = 12;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createUserDto, currentUser) {
        const normalizedEmail = createUserDto.email.toLowerCase().trim();
        if (currentUser.role === role_enum_1.Role.MANAGER) {
            if (createUserDto.role !== role_enum_1.Role.STAFF) {
                throw new common_1.ForbiddenException('Managers are only authorized to create Staff accounts');
            }
            if (createUserDto.branchId && createUserDto.branchId !== currentUser.branchId) {
                throw new common_1.ForbiddenException('Managers are not authorized to create accounts for other branches');
            }
            createUserDto.branchId = currentUser.branchId || undefined;
        }
        else if (currentUser.role !== role_enum_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('You do not have permission to create user accounts');
        }
        const existing = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (existing) {
            throw new common_1.ConflictException('A user with this email already exists');
        }
        let rawPassword = createUserDto.password;
        const mustResetPassword = !rawPassword;
        if (!rawPassword) {
            rawPassword = crypto.randomBytes(9).toString('base64');
            rawPassword = `Temp@${rawPassword}`;
        }
        const hashedPassword = await bcrypt.hash(rawPassword, this.SALT_ROUNDS);
        const user = await this.prisma.user.create({
            data: {
                email: normalizedEmail,
                name: createUserDto.name || null,
                password: hashedPassword,
                role: createUserDto.role,
                branchId: createUserDto.branchId || null,
                mustResetPassword,
            },
        });
        this.logger.log(`User created: ${user.email} (Role: ${user.role}, Branch: ${user.branchId}) by ${currentUser.email || currentUser.id}`);
        const result = this.sanitizeUser(user);
        if (mustResetPassword) {
            result.temporaryPassword = rawPassword;
        }
        return result;
    }
    async findAll(currentUser) {
        const where = {};
        if (currentUser.role === role_enum_1.Role.MANAGER) {
            where.branchId = currentUser.branchId;
        }
        else if (currentUser.role === role_enum_1.Role.STAFF) {
            return [];
        }
        const users = await this.prisma.user.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
        return users.map((user) => this.sanitizeUser(user));
    }
    async findById(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async findByIdSafe(id) {
        const user = await this.findById(id);
        return this.sanitizeUser(user);
    }
    async findByEmail(email) {
        const normalizedEmail = email.toLowerCase().trim();
        return this.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
    }
    async update(id, updateUserDto) {
        await this.findById(id);
        const data = { ...updateUserDto };
        if (updateUserDto.password) {
            data.password = await bcrypt.hash(updateUserDto.password, this.SALT_ROUNDS);
            data.mustResetPassword = false;
        }
        const user = await this.prisma.user.update({
            where: { id: id },
            data: data,
        });
        this.logger.log(`User updated: ${user.email}`);
        return this.sanitizeUser(user);
    }
    async deactivate(id) {
        await this.findById(id);
        const user = await this.prisma.user.update({
            where: { id },
            data: { isActive: false },
        });
        this.logger.log(`User deactivated: ${user.email}`);
        return this.sanitizeUser(user);
    }
    async updateLastLogin(id) {
        await this.prisma.user.update({
            where: { id },
            data: { lastLogin: new Date() },
        });
    }
    sanitizeUser(user) {
        const { password, totpSecret, ...sanitized } = user;
        return sanitized;
    }
};
exports.UserService = UserService;
exports.UserService = UserService = UserService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserService);
//# sourceMappingURL=user.service.js.map