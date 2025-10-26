import prisma from '../db';
import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

// Create signed upload URL (client-side can PUT)
export const createUploadUrl = async (req: Request, res: Response) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ message: 'filename required' });
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const path = `public/${Date.now()}_${filename}`;
    const { data, error } = await supabase.storage.from('public').createSignedUploadUrl(path, 60);
    if (error) throw error;
    res.json({ uploadUrl: data?.signedUrl, path });
  } catch (e:any) {
    console.error(e);
    res.status(500).json({ message: 'Failed to create upload url' });
  }
};

export const getAll = async (req: Request, res: Response) => {
  const properties = await prisma.property.findMany({ include: { listedBy: { select: { username: true } } }, orderBy: { createdAt: 'desc' } });
  res.json({ data: properties });
};

export const getOne = async (req: Request, res: Response) => {
  const property = await prisma.property.findUnique({ where: { id: req.params.id }, include: { listedBy: { select: { username: true } }, leads: true } });
  res.json({ data: property });
};

export const create = async (req: Request, res: Response) => {
  const { title, location, price, type, beds, baths, area, description, imageUrls } = req.body;
  try {
    const property = await prisma.property.create({
      data: {
        title, location, price: parseFloat(price), type, beds: parseInt(beds), baths: parseInt(baths), area: parseInt(area),
        description: description || '', imageUrls: imageUrls || [], listedById: (req.user as any).id, status: 'PENDING_APPROVAL'
      }
    });
    res.json({ data: property });
  } catch (e:any) {
    console.error(e);
    res.status(500).json({ message: 'Error creating property' });
  }
};

export const update = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const property = await prisma.property.update({ where: { id }, data: req.body });
    res.json({ data: property });
  } catch (e:any) {
    res.status(500).json({ message: 'Error updating property' });
  }
};

export const remove = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.property.delete({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch (e:any) {
    res.status(500).json({ message: 'Error deleting property' });
  }
};

export const createLead = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, phone, message } = req.body;
  try {
    const lead = await prisma.lead.create({ data: { propertyId: id, name, email, phone, message } });
    res.json({ data: lead });
  } catch (e:any) {
    res.status(500).json({ message: 'Error creating lead' });
  }
};
