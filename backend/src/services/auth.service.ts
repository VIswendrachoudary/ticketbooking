import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.js';
import { env } from '../config/env.js';

export class AuthService {
  static async register(data: { email: string; password: string; name: string; role?: string }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw { statusCode: 400, message: 'User with this email already exists' };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const role = data.role && ['ADMIN', 'ORGANISER', 'CUSTOMER'].includes(data.role.toUpperCase())
      ? data.role.toUpperCase()
      : 'CUSTOMER';

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role,
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
    };
  }

  static async login(data: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw { statusCode: 401, message: 'Invalid email or password' };
    }

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      throw { statusCode: 401, message: 'Invalid email or password' };
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
    };
  }

  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }
    return user;
  }
}
