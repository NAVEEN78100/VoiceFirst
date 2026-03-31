import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly SALT_ROUNDS = 12;

  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const normalizedEmail = createUserDto.email.toLowerCase().trim();

    // Check if user already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      this.SALT_ROUNDS,
    );

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        role: createUserDto.role,
        branchId: createUserDto.branchId || null,
      },
    });

    this.logger.log(`User created: ${user.email} with role ${user.role}`);
    return this.sanitizeUser(user);
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
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
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
