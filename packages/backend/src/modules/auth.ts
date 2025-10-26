import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import * as bcrypt from 'bcrypt';
import prisma from '../db';

declare global {
  namespace Express {
    interface Request { user?: any }
  }
}

const JWT_SECRET = process.env.JWT_SECRET as string;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET as string;

export const hashPassword = (password: string) => bcrypt.hash(password, 10);
export const comparePassword = (password:string, hash:string) => bcrypt.compare(password, hash);

export const signAccessToken = (user:any) => {
  return jwt.sign({ id: user.id, username: user.username, role: user.role}, JWT_SECRET, { expiresIn: '15m' });
};

export const signRefreshToken = (user:any) => {
  return jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '30d' });
};

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  const bearer = req.headers.authorization || '';
  const token = bearer.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Not authorized' });
  try {
    const payload: any = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
