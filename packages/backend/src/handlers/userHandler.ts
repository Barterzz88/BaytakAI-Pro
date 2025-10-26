import prisma from '../db';
import { Request, Response } from 'express';
import { hashPassword, comparePassword, signAccessToken, signRefreshToken } from '../modules/auth';
import jwt from 'jsonwebtoken';

export const register = async (req: Request, res: Response) => {
  const { username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'username & password required' });
  try {
    const hashed = await hashPassword(password);
    const user = await prisma.user.create({ data: { username, password: hashed, role: role || 'USER' } });
    const access = signAccessToken(user);
    const refresh = signRefreshToken(user);
    await prisma.refreshToken.create({ data: { token: refresh, userId: user.id, expiresAt: new Date(Date.now()+30*24*3600*1000) } });
    res.cookie('refreshToken', refresh, { httpOnly: true, sameSite: 'lax' });
    res.json({ accessToken: access });
  } catch (e:any) {
    res.status(400).json({ message: e.message || 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'username & password required' });
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await comparePassword(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const access = signAccessToken(user);
    const refresh = signRefreshToken(user);
    await prisma.refreshToken.create({ data: { token: refresh, userId: user.id, expiresAt: new Date(Date.now()+30*24*3600*1000) } });
    res.cookie('refreshToken', refresh, { httpOnly: true, sameSite: 'lax' });
    res.json({ accessToken: access, role: user.role });
  } catch (e:any) {
    res.status(500).json({ message: 'Login error' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  if (!token) return res.status(400).json({ message: 'No refresh token' });
  try {
    const payload: any = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string);
    const dbToken = await prisma.refreshToken.findUnique({ where: { token } });
    if (!dbToken) return res.status(401).json({ message: 'Invalid refresh token' });
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return res.status(401).json({ message: 'User not found' });
    const access = signAccessToken(user);
    res.json({ accessToken: access });
  } catch (e:any) {
    res.status(401).json({ message: 'Refresh failed' });
  }
};

export const logout = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  if (token) {
    await prisma.refreshToken.deleteMany({ where: { token } });
    res.clearCookie('refreshToken');
  }
  res.json({ message: 'Logged out' });
};
