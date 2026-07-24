// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  generateDokuSignature,
  sha256Base64,
} from "@/lib/doku";

const mocks = vi.hoisted(() => ({
  prisma: {
    invoice: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    paymentLog: {
      findFirst: vi.fn(), // replay protection early-exit check
      create: vi.fn(),
    },
    subscription: {
      update: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  sendPushNotification: vi.fn(),
  getUserFcmTokens: vi.fn(),
  publishToFamily: vi.fn(),
  incrementUnreadBadge: vi.fn(),
  sendReceiptEmail: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/notifications/fcm", () => ({
  sendPushNotification: mocks.sendPushNotification,
  getUserFcmTokens: mocks.getUserFcmTokens,
}));
vi.mock("@/lib/notifications/sse", () => ({
  publishToFamily: mocks.publishToFamily,
  incrementUnreadBadge: mocks.incrementUnreadBadge,
}));
vi.mock("@/lib/send-receipt-email", () => ({
  sendReceiptEmail: mocks.sendReceiptEmail,
}));

import { POST } from "@/app/api/webhooks/doku/route";

const CLIENT_ID = "MCH-DOKU-TEST";
const SECRET_KEY = "doku-secret-key-for-tests";
const REQUEST_TARGET = "/api/webhooks/doku";

function makeInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: "invoice-doku-test",
    amount: 29000,
    status: "PENDING",
    billingCycle: "MONTHLY",
    paymentProvider: "DOKU",
    providerInvoiceNumber: "DOKU-TEST-001",
    providerRequestId: null,
    expiredAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    createdAt: new Date("2026-07-24T01:00:00.000Z"),
    subscriptionId: "subscription-doku-test",
    subscription: {
      plan: {
        id: "plan-pro",
        name: "Pro",
        type: "PRO",
        price: 29000,
        yearlyPrice: 290000,
        currency: "IDR",
      },
      familySpace: {
        id: "family-doku-test",
        name: "Keluarga Test",
        ownerId: "owner-doku-test",
      },
    },
    ...overrides,
  };
}

function makeRequest(
  payload: unknown,
  options: { requestId?: string; timestamp?: string; signature?: string } = {}
) {
  const body = JSON.stringify(payload);
  const requestId = options.requestId ?? "doku-request-test-001";
  const timestamp = options.timestamp ?? new Date().toISOString();
  const signature =
    options.signature ??
    generateDokuSignature({
      clientId: CLIENT_ID,
      requestId,
      requestTimestamp: timestamp,
      requestTarget: REQUEST_TARGET,
      digest: sha256Base64(body),
      secretKey: SECRET_KEY,
    });

  return new Request(`http://localhost${REQUEST_TARGET}`, {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/json",
      "Client-Id": CLIENT_ID,
      "Request-Id": requestId,
      "Request-Timestamp": timestamp,
      Signature: signature,
    },
  });
}

function successPayload(amount = 29000) {
  return {
    order: {
      invoice_number: "DOKU-TEST-001",
      amount,
    },
    transaction: {
      status: "SUCCESS",
    },
    channel: {
      id: "VIRTUAL_ACCOUNT_BANK_MANDIRI",
    },
  };
}

describe("POST /api/webhooks/doku", () => {
  beforeEach(() => {
    process.env.DOKU_CLIENT_ID = CLIENT_ID;
    process.env.DOKU_SECRET_KEY = SECRET_KEY;

    mocks.prisma.invoice.findFirst.mockReset();
    mocks.prisma.invoice.updateMany.mockReset();
    mocks.prisma.paymentLog.findFirst.mockReset();
    mocks.prisma.paymentLog.create.mockReset();
    mocks.prisma.subscription.update.mockReset();
    mocks.prisma.notification.create.mockReset();
    mocks.prisma.user.findUnique.mockReset();
    mocks.prisma.$transaction.mockReset();
    mocks.sendPushNotification.mockReset();
    mocks.getUserFcmTokens.mockReset();
    mocks.publishToFamily.mockReset();
    mocks.incrementUnreadBadge.mockReset();
    mocks.sendReceiptEmail.mockReset();

    // Default: no replay match (Request-Id not seen before)
    mocks.prisma.paymentLog.findFirst.mockResolvedValue(null);

    mocks.prisma.paymentLog.create.mockResolvedValue({});
    mocks.prisma.subscription.update.mockResolvedValue({});
    mocks.prisma.notification.create.mockResolvedValue({});
    mocks.prisma.user.findUnique.mockResolvedValue({
      name: "Parent Test",
      email: "parent@test.internal",
      phone: null,
    });
    mocks.getUserFcmTokens.mockResolvedValue([]);
    mocks.sendPushNotification.mockResolvedValue(undefined);
    mocks.publishToFamily.mockResolvedValue(undefined);
    mocks.incrementUnreadBadge.mockResolvedValue(undefined);
    mocks.sendReceiptEmail.mockResolvedValue(undefined);
    mocks.prisma.$transaction.mockImplementation(
      async (callback: (tx: typeof mocks.prisma) => unknown) =>
        callback(mocks.prisma)
    );
  });

  // ── Pre-DB validation ───────────────────────────────────────────────────────

  it("mengembalikan 400 untuk payload JSON yang rusak", async () => {
    const response = await POST(
      new Request(`http://localhost${REQUEST_TARGET}`, {
        method: "POST",
        body: "{not-json",
      }) as never
    );

    expect(response.status).toBe(400);
    expect((await response.json()).message).toBe("Invalid JSON");
    expect(mocks.prisma.paymentLog.findFirst).not.toHaveBeenCalled();
    expect(mocks.prisma.invoice.findFirst).not.toHaveBeenCalled();
  });

  it("mengembalikan 403 untuk signature invalid sebelum menyentuh database", async () => {
    const request = makeRequest(successPayload(), { signature: "HMACSHA256=invalid" });

    const response = await POST(request as never);

    expect(response.status).toBe(403);
    expect(mocks.prisma.paymentLog.findFirst).not.toHaveBeenCalled();
    expect(mocks.prisma.invoice.findFirst).not.toHaveBeenCalled();
  });

  it("mengembalikan 403 untuk notification signed yang sudah terlalu lama", async () => {
    const timestamp = new Date(Date.now() - 11 * 60 * 1000).toISOString();
    const request = makeRequest(successPayload(), { timestamp });

    const response = await POST(request as never);

    expect(response.status).toBe(403);
    expect((await response.json()).message).toBe("Expired notification");
    expect(mocks.prisma.paymentLog.findFirst).not.toHaveBeenCalled();
    expect(mocks.prisma.invoice.findFirst).not.toHaveBeenCalled();
  });

  // ── P0: Replay protection (early-exit) ─────────────────────────────────────

  it("P0 replay: memblokir request dengan Request-Id yang sudah ada sebelum invoice lookup", async () => {
    // paymentLog.findFirst menemukan log yang sudah ada → early-exit
    mocks.prisma.paymentLog.findFirst.mockResolvedValue({ id: "existing-log-001" });

    const response = await POST(makeRequest(successPayload()) as never);

    expect(response.status).toBe(200);
    expect((await response.json()).message).toBe("OK — duplicate notification");
    // Early-exit: invoice.findFirst tidak boleh dipanggil sama sekali
    expect(mocks.prisma.invoice.findFirst).not.toHaveBeenCalled();
    expect(mocks.prisma.invoice.updateMany).not.toHaveBeenCalled();
    expect(mocks.prisma.subscription.update).not.toHaveBeenCalled();
  });

  it("P0 replay: replay protection menggunakan providerRequestId dari header Request-Id", async () => {
    mocks.prisma.paymentLog.findFirst.mockResolvedValue({ id: "existing-log-002" });

    await POST(makeRequest(successPayload(), { requestId: "my-specific-request-id" }) as never);

    expect(mocks.prisma.paymentLog.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { providerRequestId: "my-specific-request-id" },
        select: { id: true },
      })
    );
  });

  // ── P0: Status-filtered invoice lookup ─────────────────────────────────────

  it("P0 filter: invoice lookup untuk event payment menggunakan filter status PENDING + expiredAt > now", async () => {
    mocks.prisma.invoice.findFirst.mockResolvedValue(null);

    await POST(makeRequest(successPayload()) as never);

    expect(mocks.prisma.invoice.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "PENDING",
          expiredAt: expect.objectContaining({ gt: expect.any(Date) }),
        }),
      })
    );
  });

  it("P0 filter: invoice lookup untuk event REFUND menggunakan filter status PAID", async () => {
    mocks.prisma.invoice.findFirst.mockResolvedValue(null);

    await POST(
      makeRequest({
        ...successPayload(),
        transaction: { status: "REFUND" },
      }) as never
    );

    expect(mocks.prisma.invoice.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "PAID" }),
      })
    );
  });

  it("P0 filter: invoice lookup untuk event REFUNDED (alias) menggunakan filter status PAID", async () => {
    mocks.prisma.invoice.findFirst.mockResolvedValue(null);

    await POST(
      makeRequest({
        ...successPayload(),
        transaction: { status: "REFUNDED" },
      }) as never
    );

    expect(mocks.prisma.invoice.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "PAID" }),
      })
    );
  });

  // ── Unknown / ineligible order ──────────────────────────────────────────────

  it("mengakui invoice DOKU yang tidak dikenal tanpa aktivasi", async () => {
    mocks.prisma.invoice.findFirst.mockResolvedValue(null);

    const response = await POST(makeRequest(successPayload()) as never);

    expect(response.status).toBe(200);
    expect((await response.json()).message).toBe("OK — unknown order");
    expect(mocks.prisma.paymentLog.create).not.toHaveBeenCalled();
    expect(mocks.prisma.subscription.update).not.toHaveBeenCalled();
  });

  it("P0 filter: notifikasi SUCCESS terlambat untuk invoice expired/failed dikembalikan sebagai unknown order tanpa aktivasi", async () => {
    // Filter status:PENDING + expiredAt > now tidak menemukan invoice expired →
    // findFirst mengembalikan null, handler harus berhenti di "unknown order".
    mocks.prisma.invoice.findFirst.mockResolvedValue(null);

    const response = await POST(makeRequest(successPayload()) as never);

    expect(response.status).toBe(200);
    expect((await response.json()).message).toBe("OK — unknown order");
    // Tidak ada mutasi apapun yang boleh terjadi
    expect(mocks.prisma.paymentLog.create).not.toHaveBeenCalled();
    expect(mocks.prisma.invoice.updateMany).not.toHaveBeenCalled();
    expect(mocks.prisma.subscription.update).not.toHaveBeenCalled();
  });

  it("P0 filter: notifikasi REFUND untuk invoice yang bukan PAID dikembalikan sebagai unknown order", async () => {
    // Invoice PENDING tidak cocok dengan filter status:PAID untuk refund events
    mocks.prisma.invoice.findFirst.mockResolvedValue(null);

    const response = await POST(
      makeRequest({
        ...successPayload(),
        transaction: { status: "REFUND" },
      }) as never
    );

    expect(response.status).toBe(200);
    expect((await response.json()).message).toBe("OK — unknown order");
    expect(mocks.prisma.subscription.update).not.toHaveBeenCalled();
  });

  // ── Success flow ────────────────────────────────────────────────────────────

  it("mengaktifkan subscription hanya dari invoice PENDING yang belum expired", async () => {
    mocks.prisma.invoice.findFirst.mockResolvedValue(makeInvoice());
    mocks.prisma.invoice.updateMany.mockResolvedValue({ count: 1 });

    const response = await POST(makeRequest(successPayload()) as never);

    expect(response.status).toBe(200);
    expect((await response.json()).message).toBe("OK");
    expect(mocks.prisma.invoice.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "PENDING",
          expiredAt: expect.objectContaining({ gt: expect.any(Date) }),
        }),
        data: expect.objectContaining({ status: "PAID" }),
      })
    );
    expect(mocks.prisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "subscription-doku-test" },
        data: expect.objectContaining({ status: "PRO" }),
      })
    );
    expect(mocks.prisma.notification.create).toHaveBeenCalledTimes(1);
  });

  it("tidak mengaktifkan subscription jika invoice expired dalam narrow window (updateMany count=0)", async () => {
    // findFirst menemukan PENDING invoice (masih dalam filter), tapi antara
    // findFirst dan updateMany invoice sempat expired (race condition narrow window).
    mocks.prisma.invoice.findFirst.mockResolvedValue(makeInvoice());
    mocks.prisma.invoice.updateMany
      .mockResolvedValueOnce({ count: 0 }) // lock gagal → invoice sudah berubah
      .mockResolvedValueOnce({ count: 1 }); // mark EXPIRED

    const response = await POST(makeRequest(successPayload()) as never);

    expect(response.status).toBe(200);
    expect((await response.json()).message).toBe("OK — already processed");
    expect(mocks.prisma.subscription.update).not.toHaveBeenCalled();
    // Harus mencoba mark EXPIRED
    expect(mocks.prisma.invoice.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "PENDING",
          expiredAt: expect.objectContaining({ lte: expect.any(Date) }),
        }),
        data: { status: "EXPIRED" },
      })
    );
  });

  // ── Amount mismatch ─────────────────────────────────────────────────────────

  it("menolak nominal mismatch dan tidak mengubah invoice", async () => {
    mocks.prisma.invoice.findFirst.mockResolvedValue(makeInvoice());

    const response = await POST(makeRequest(successPayload(28000)) as never);

    expect(response.status).toBe(400);
    expect((await response.json()).message).toBe("Amount mismatch");
    expect(mocks.prisma.invoice.updateMany).not.toHaveBeenCalled();
    expect(mocks.prisma.subscription.update).not.toHaveBeenCalled();
  });

  // ── Failure / Expired events ────────────────────────────────────────────────

  it("menandai invoice FAILED untuk notification pembayaran gagal", async () => {
    mocks.prisma.invoice.findFirst.mockResolvedValue(makeInvoice());

    const response = await POST(
      makeRequest({
        ...successPayload(),
        transaction: { status: "FAILED" },
      }) as never
    );

    expect(response.status).toBe(200);
    expect((await response.json()).message).toBe("OK");
    expect(mocks.prisma.invoice.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "invoice-doku-test", status: { not: "PAID" } },
        data: expect.objectContaining({ status: "FAILED" }),
      })
    );
    expect(mocks.prisma.subscription.update).not.toHaveBeenCalled();
  });

  it("menandai invoice EXPIRED untuk notification ORDER_EXPIRED dari DOKU", async () => {
    mocks.prisma.invoice.findFirst.mockResolvedValue(makeInvoice());

    const response = await POST(
      makeRequest({
        ...successPayload(),
        transaction: { status: "ORDER_EXPIRED" },
      }) as never
    );

    expect(response.status).toBe(200);
    expect((await response.json()).message).toBe("OK");
    expect(mocks.prisma.invoice.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "invoice-doku-test", status: { not: "PAID" } },
        data: expect.objectContaining({ status: "EXPIRED" }),
      })
    );
    expect(mocks.prisma.subscription.update).not.toHaveBeenCalled();
  });

  // ── Duplicate / idempotency ─────────────────────────────────────────────────

  it("mengakui duplicate Request-Id via early-exit tanpa menyentuh invoice", async () => {
    // Simulasi: paymentLog.findFirst menemukan request-id yang sudah ada
    mocks.prisma.paymentLog.findFirst.mockResolvedValue({ id: "seen-before" });

    const response = await POST(makeRequest(successPayload()) as never);

    expect(response.status).toBe(200);
    expect((await response.json()).message).toBe("OK — duplicate notification");
    expect(mocks.prisma.invoice.findFirst).not.toHaveBeenCalled();
    expect(mocks.prisma.invoice.updateMany).not.toHaveBeenCalled();
    expect(mocks.prisma.subscription.update).not.toHaveBeenCalled();
  });

  it("fallback idempotency: unique constraint dalam transaction mencegah aktivasi ganda (concurrent arrival race)", async () => {
    // Simulasi race condition: dua request dengan Request-Id sama tiba bersamaan,
    // keduanya lolos early-exit (paymentLog.findFirst = null), lalu satu kalah
    // di dalam transaction karena unique constraint pada paymentLog.providerRequestId.
    mocks.prisma.invoice.findFirst.mockResolvedValue(makeInvoice());
    const duplicateError = Object.assign(new Error("unique"), { code: "P2002" });
    mocks.prisma.paymentLog.create.mockRejectedValue(duplicateError);

    const response = await POST(makeRequest(successPayload()) as never);

    expect(response.status).toBe(200);
    expect((await response.json()).message).toBe("OK — duplicate notification");
    expect(mocks.prisma.invoice.updateMany).not.toHaveBeenCalled();
    expect(mocks.prisma.subscription.update).not.toHaveBeenCalled();
  });

  // ── Refund flow ─────────────────────────────────────────────────────────────

  it("menangani notifikasi REFUND: invoice → REFUNDED, subscription → FREE, notifikasi terkirim", async () => {
    // findFirst harus mengembalikan invoice berstatus PAID (sesuai filter refund)
    mocks.prisma.invoice.findFirst.mockResolvedValue(makeInvoice({ status: "PAID" }));
    mocks.prisma.invoice.updateMany.mockResolvedValue({ count: 1 });

    const response = await POST(
      makeRequest({
        ...successPayload(),
        transaction: { status: "REFUND" },
      }) as never
    );

    expect(response.status).toBe(200);
    expect((await response.json()).message).toBe("OK");

    // Invoice harus diubah ke REFUNDED — hanya jika masih PAID
    expect(mocks.prisma.invoice.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "invoice-doku-test", status: "PAID" },
        data: { status: "REFUNDED" },
      })
    );

    // Subscription harus dikembalikan ke FREE
    expect(mocks.prisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "subscription-doku-test" },
        data: expect.objectContaining({ status: "FREE" }),
      })
    );

    // Notifikasi in-app harus dibuat
    expect(mocks.prisma.notification.create).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "SUBSCRIPTION_REFUNDED" }),
      })
    );
  });

  it("menangani notifikasi REFUNDED (alias): subscription di-downgrade ke FREE", async () => {
    mocks.prisma.invoice.findFirst.mockResolvedValue(makeInvoice({ status: "PAID" }));
    mocks.prisma.invoice.updateMany.mockResolvedValue({ count: 1 });

    const response = await POST(
      makeRequest({
        ...successPayload(),
        transaction: { status: "REFUNDED" },
      }) as never
    );

    expect(response.status).toBe(200);
    expect(mocks.prisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "FREE", cancelReason: "Refund dari DOKU" }),
      })
    );
  });

  it("refund duplicate Request-Id tidak menjalankan update kedua", async () => {
    mocks.prisma.invoice.findFirst.mockResolvedValue(makeInvoice({ status: "PAID" }));
    const duplicateError = Object.assign(new Error("unique"), { code: "P2002" });
    // paymentLog.create di dalam transaction lempar duplicate
    mocks.prisma.$transaction.mockRejectedValue(duplicateError);

    const response = await POST(
      makeRequest({
        ...successPayload(),
        transaction: { status: "REFUND" },
      }) as never
    );

    expect(response.status).toBe(200);
    expect((await response.json()).message).toBe("OK — duplicate notification");
  });

  // ── Timestamp consistency ───────────────────────────────────────────────────

  it("menggunakan satu nilai 'now' yang konsisten untuk seluruh request", async () => {
    // Verifikasi bahwa expiredAt.gt (di findFirst) dan expiredAt.gt (di updateMany)
    // menggunakan timestamp yang sama — tidak ada drift akibat multiple Date() calls.
    mocks.prisma.invoice.findFirst.mockResolvedValue(makeInvoice());
    mocks.prisma.invoice.updateMany.mockResolvedValue({ count: 1 });

    await POST(makeRequest(successPayload()) as never);

    const findFirstCall = mocks.prisma.invoice.findFirst.mock.calls[0][0];
    const updateManyCall = mocks.prisma.invoice.updateMany.mock.calls[0][0];

    const nowFromFindFirst: Date = findFirstCall.where.expiredAt.gt;
    const nowFromUpdateMany: Date = updateManyCall.where.expiredAt.gt;

    // Kedua Date harus identik (objek sama atau nilai yang sangat berdekatan ≤ 1 ms)
    expect(Math.abs(nowFromFindFirst.getTime() - nowFromUpdateMany.getTime())).toBeLessThanOrEqual(1);
  });
});
