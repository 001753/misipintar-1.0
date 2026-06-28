/**
 * Seed default plans + AppConfig — hanya bisa diakses di development
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
      limits: {
        maxChildren: 2,
        maxTasksPerMonth: 10,
        hasInterest: false,
        hasTax: false,
      },
    },
    {
      type: 'PRO' as const,
      name: 'Pro',
      price: 29000,
      yearlyPrice: 290000,
      limits: {
        maxChildren: 5,
        maxTasksPerMonth: -1,
        hasInterest: true,
        interestRate: 2,
        hasTax: true,
        taxRate: 5,
      },
    },
    {
      type: 'EDUCATOR' as const,
      name: 'Educator',
      price: 99000,
      yearlyPrice: 990000,
      limits: {
        maxChildren: -1,
        maxTasksPerMonth: -1,
        maxFamilies: 30,
        hasInterest: true,
        interestRate: 2,
        hasTax: true,
        taxRate: 5,
      },
    },
    {
      type: 'SCHOOL' as const,
      name: 'School',
      price: 0,
      yearlyPrice: 0,
      limits: {
        maxChildren: -1,
        maxTasksPerMonth: -1,
        maxFamilies: -1,
        hasInterest: true,
        interestRate: 2,
        hasTax: true,
        taxRate: 5,
        sso: true,
      },
    },
  ]

  const results: string[] = []
  for (const plan of plans) {
    await prisma.plan.upsert({
      where:  { type: plan.type },
      update: { name: plan.name, price: plan.price, yearlyPrice: plan.yearlyPrice, limits: plan.limits, isActive: true },
      create: { ...plan, currency: 'IDR', isActive: true },
    })
    results.push(plan.name)
  }

  // Seed AppConfig dengan phaseMode FREEMIUM sebagai default
  await prisma.appConfig.upsert({
    where:  { id: 'global-config' },
    update: { phaseMode: 'FREEMIUM' },
    create: {
      id:        'global-config',
      phaseMode: 'FREEMIUM',
      data: {
        interestRate:   2,
        taxRate:        5,
        maxTrialDays:   14,
        maintenanceMode: false,
        featureFlags: {
          pushNotifications: false,
          pdfReports:        true,
          interestEngine:    true,
          taxEngine:         true,
        },
      },
    },
  })

  return NextResponse.json({
    seeded:    results,
    phaseMode: 'FREEMIUM',
    message:   'Plans dan AppConfig (FREEMIUM) berhasil di-seed.',
  })
}
