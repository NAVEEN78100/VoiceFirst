import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly SALT_ROUNDS = 12;

  constructor(private readonly prisma: PrismaService) {}

  async create(
    createUserDto: CreateUserDto,
    currentUser: { id: string; role: Role; branchId?: string | null; email?: string },
  ) {
    const normalizedEmail = createUserDto.email.toLowerCase().trim();

    // 1. RBAC Check
    if (currentUser.role === Role.MANAGER) {
      // Manager can only create STAFF
      if (createUserDto.role !== Role.STAFF) {
        throw new ForbiddenException(
          'Managers are only authorized to create Staff accounts',
        );
      }
      // Manager can only create for their own branch
      if (createUserDto.branchId && createUserDto.branchId !== currentUser.branchId) {
        throw new ForbiddenException(
          'Managers are not authorized to create accounts for other branches',
        );
      }
      // Ensure branchId is set to manager's branch if not provided or to ensure it matches
      createUserDto.branchId = currentUser.branchId || undefined;
    } else if (currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to create user accounts',
      );
    }

    // 2. Uniqueness Check
    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    // 3. Password Logic
    let rawPassword = createUserDto.password;
    const mustResetPassword = !rawPassword; // Force reset if auto-generated

    if (!rawPassword) {
      // Generate secure 12-char temp password
      rawPassword = crypto.randomBytes(9).toString('base64');
      // Ensure it meets standard complexity (simple version for temp)
      rawPassword = `Temp@${rawPassword}`;
    }

    const hashedPassword = await bcrypt.hash(rawPassword, this.SALT_ROUNDS);

    // 4. Persistence
    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        name: createUserDto.name || null,
        password: hashedPassword,
        role: createUserDto.role,
        branchId: createUserDto.branchId || null,
        mustResetPassword,
      } as any,
    });

    this.logger.log(
      `User created: ${user.email} (Role: ${user.role}, Branch: ${user.branchId}) by ${currentUser.email || currentUser.id}`,
    );

    const result = this.sanitizeUser(user);

    // If password was generated, return it once (securely)
    if (mustResetPassword) {
      (result as any).temporaryPassword = rawPassword;
    }

    return result;
  }

  async findAll(currentUser: { role: Role; branchId?: string | null }) {
    const where: any = {};

    // Data-level filtering based on role
    if (currentUser.role === Role.MANAGER) {
      where.branchId = currentUser.branchId;
    } else if (currentUser.role === Role.STAFF) {
      // Staff should not list users, but if called, return empty
      return [];
    }
    // ADMIN and CX can see all users

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => this.sanitizeUser(user));
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByIdSafe(id: string) {
    const user = await this.findById(id);
    return this.sanitizeUser(user);
  }

  async findByEmail(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    return this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findById(id); // Ensure user exists

    const data: any = { ...updateUserDto };

    if (updateUserDto.password) {
      data.password = await bcrypt.hash(
        updateUserDto.password,
        this.SALT_ROUNDS,
      );
      data.mustResetPassword = false;
    }

    const user = await this.prisma.user.update({
      where: { id: id },
      data: data,
    });

    this.logger.log(`User updated: ${user.email}`);
    return this.sanitizeUser(user);
  }

  async deactivate(id: string) {
    await this.findById(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log(`User deactivated: ${user.email}`);
    return this.sanitizeUser(user);
  }

  async updateLastLogin(id: string) {
    await this.prisma.user.update({
      where: { id },
      data: { lastLogin: new Date() },
    });
  }

  /**
   * Remove sensitive fields before returning user data
   */
  private sanitizeUser(user: any) {
    const { password, totpSecret, ...sanitized } = user;
    return sanitized;
  }
}
