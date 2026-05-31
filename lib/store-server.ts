// lib/store-server.ts

import type { PrismaClient, Tenant as PrismaTenant } from '@prisma/client';
import { hashPassword } from './auth';
import prisma from '../prisma/client';

/** Helper to get Prisma client with fallback */
const getPrisma = (): PrismaClient => {
  return prisma;
};

// Exported type for tenant (extended to support frontend client properties)
export type Tenant = PrismaTenant & {
  theme?: string;
  isOnboarded?: boolean;
};

/** Server‑side: Fetch tenants from database */
export const fetchTenants = async (): Promise<Tenant[]> => {
  const prisma: PrismaClient = getPrisma();
  const tenants = await prisma.tenant.findMany();
  return tenants;
};

/** Server‑side: Create a new tenant (filtering extra fields to avoid Prisma errors) */
export const createTenant = async (data: {
  name: string;
  type: string;
  email: string;
  password: string;
  currency: string;
  plan: string;
  language: string;
}): Promise<Tenant> => {
  const prisma: PrismaClient = getPrisma();
  const hashed = await hashPassword(data.password);
  const { name, type, email, currency, plan, language } = data;
  
  // Default to a 30-day trial period
  const trialDate = new Date();
  trialDate.setDate(trialDate.getDate() + 30);
  const expiryDate = trialDate.toISOString().split('T')[0]; // "YYYY-MM-DD"

  const tenant = await prisma.tenant.create({
    data: { 
      name, 
      type, 
      email, 
      password: hashed, 
      currency, 
      plan, 
      language,
      subscriptionPeriod: 'monthly',
      expiryDate
    },
  });
  return tenant;
};

/** Server‑side: Update an existing tenant (filtering extra fields safely) */
export const updateTenant = async (
  id: string,
  data: Partial<{
    name: string;
    type: string;
    email: string;
    password: string;
    currency: string;
    plan: string;
    language: string;
    status: string;
    subscriptionPeriod: string;
    subscriptionPrice: number | null;
    expiryDate: string | null;
  }>
): Promise<Tenant> => {
  const prisma: PrismaClient = getPrisma();
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.password !== undefined) updateData.password = await hashPassword(data.password);
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.plan !== undefined) updateData.plan = data.plan;
  if (data.language !== undefined) updateData.language = data.language;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.subscriptionPeriod !== undefined) updateData.subscriptionPeriod = data.subscriptionPeriod;
  if (data.subscriptionPrice !== undefined) {
    updateData.subscriptionPrice = data.subscriptionPrice !== null ? parseFloat(data.subscriptionPrice.toString()) : null;
  }
  if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate;

  const tenant = await prisma.tenant.update({ where: { id }, data: updateData });
  return tenant;
};

/** Server‑side: Delete a tenant */
export const deleteTenant = async (id: string): Promise<void> => {
  const prisma: PrismaClient = getPrisma();
  await prisma.tenant.delete({ where: { id } });
};
