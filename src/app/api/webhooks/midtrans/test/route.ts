import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

// Only available outside production
function guardDev() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }
  return null
}

function buildSignature(orderId: string, statusCode: string, grossAmount: string): string {
  const serverKey = process.env.MIDTRANS_SERVER_KEY ?? ''
  return crypto
    .createHash('sha512')
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest('hex')
}

// GET /api/webhooks/midtrans/test
// Returns recent invoices (any status) so you can pick one to test
export async function GET(req: NextRequest) {
  const guard = guardDev()
  if (guard) return guard

  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      subscription: {
        include: {
          plan: { select: { name: true, type: true } },
          familySpace: { select: { name: true } },
        },
      },
      paymentLogs: {
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { event: true, createdAt: true },
      },
    },
  })

  return NextResponse.json({ invoices })
}

// POST /api/webhooks/midtrans/test
// Body: { order_id, transaction_status, payment_type?, gross_amount? }
// Generates a real SHA-512 signature and fires it against the live webhook handler.
export async function POST(req: NextRequest) {
  const guard = guardDev()
  if (guard) return guard

  let body: Record<string, string>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { order_id, transaction_status, payment_type, gross_amount } = body

  if (!order_id || !transaction_status) {
    return NextResponse.json(
      { error: 'order_id and transaction_status are required' },
      { status: 400 }
    )
  }

  // Resolve gross_amount: use provided value or look up invoice
  let resolvedAmount = gross_amount
  if (!resolvedAmount) {
    const invoice = await prisma.invoice.findUnique({
      where: { midtransOrderId: order_id },
      select: { amount: true },
    })
    if (!invoice) {
      return NextResponse.json(
        { error: `No invoice found with midtransOrderId: ${order_id}` },
        { status: 404 }
      )
    }
    resolvedAmount = String(invoice.amount) + '.00'
  }

  // Map transaction_status to a realistic status_code
  const statusCodeMap: Record<string, string> = {
    settlement: '200',
    capture: '200',
    pending: '201',
    deny: '202',
    cancel: '200',
    expire: '407',
    failure: '202',
    refund: '200',
    partial_refund: '200',
  }
  const status_code = statusCodeMap[transaction_status] ?? '200'

  // Build a valid Midtrans-style payload with real signature
  const signature_key = buildSignature(order_id, status_code, resolvedAmount)

  const payload: Record<string, string> = {
    order_id,
    status_code,
    gross_amount: resolvedAmount,
    signature_key,
    transaction_status,
    payment_type: payment_type ?? 'bank_transfer',
    fraud_status: transaction_status === 'capture' ? 'accept' : 'accept',
    transaction_id: `test-txn-${Date.now()}`,
    transaction_time: new Date().toISOString(),
    merchant_id: 'TEST',
  }

  // Fire against the actual webhook handler
  const webhookUrl = new URL('/api/webhooks/midtrans', req.url)
  const start = Date.now()

  let webhookResponse: Response
  let webhookBody: unknown
  try {
    webhookResponse = await fetch(webhookUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    webhookBody = await webhookResponse.json()
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to reach webhook handler', detail: String(err) },
      { status: 500 }
    )
  }

  const elapsed = Date.now() - start

  // Fetch fresh invoice state after the webhook ran
  const updatedInvoice = await prisma.invoice.findUnique({
    where: { midtransOrderId: order_id },
    select: {
      id: true,
      status: true,
      paidAt: true,
      paymentMethod: true,
      paymentLogs: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { event: true, createdAt: true },
      },
      subscription: {
        select: {
          status: true,
          currentPeriodEnd: true,
          plan: { select: { name: true } },
        },
      },
    },
  })

  return NextResponse.json({
    test: {
      payload_sent: payload,
      signature_valid: true,
    },
    webhook: {
      status: webhookResponse.status,
      body: webhookBody,
      elapsed_ms: elapsed,
    },
    invoice_after: updatedInvoice,
  })
}
