import prisma from '../db';
import { Request, Response } from 'express';

export const getPending = async (req: Request, res: Response) => {
  if ((req.user as any).role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });
  const pending = await prisma.property.findMany({ where: { status: 'PENDING_APPROVAL' }, include: { listedBy: true } });
  res.json({ data: pending });
};

export const approve = async (req: Request, res: Response) => {
  if ((req.user as any).role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });
  const { id } = req.params;
  const prop = await prisma.property.update({ where: { id }, data: { status: 'ACTIVE' } });
  res.json({ data: prop });
};