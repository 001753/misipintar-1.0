/**
 * Seed default plans — hanya bisa diakses di development
 * GET /api/seed/plans
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const plans = [
    {
      type: 'STARTER' as const,
      name: 'Starter',
      price: 0,
      yearlyPrice: 0,
      limits: { maxChildren: 2, maxTasksPerMonth: 10 },
    },
    {
      type: 'PRO' as const,
      name: 'Pro',
      price: 29000,
      yearlyPrice: 290000,
      limits: { maxChildren: 5, maxTasksPerMonth: -1 },
    },
    {
      type: 'EDUCATOR' as const,
      name: 'Educator',
      price: 99000,
      yearlyPrice: 990000,
      limits: { maxChildren: -1, maxTasksPerMonth: -1, maxFamilies: 30 },
    },
    {
      type: 'SCHOOL' as const,
      name: 'School',
      price: 0,
      yearlyPrice: 0,
      limits: { maxChildren: -1, maxTasksPerMonth: -1, maxFamilies: -1, sso: true },
    },
  ]

  const results: string[] = []
  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { type: plan.type },
      update: { name: plan.name, price: plan.price, yearlyPrice: plan.yearlyPrice, limits: plan.limits },
      create: { ...plan, currency: 'IDR' },
    })
    results.push(plan.name)
  }

  return NextResponse.json({ seeded: results, message: 'Plans seeded successfully.' })
}
