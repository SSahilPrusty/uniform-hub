// Shiprocket service implementation
import axios from 'axios';
import { prisma } from '../../config/db.js';
import crypto from 'crypto';
// import { logger } from '../../utils/logger.js'; // logger not needed

/**
 * Simple in‑memory cache for the auth token. In production this could be replaced by a
 * distributed cache (Redis) but for local development a module‑level variable suffices.
 */
let tokenCache: { token: string; expiresAt: number } | null = null;

/**
 * Obtain a Shiprocket auth token. The token is cached until its expiry (default 24 h).
 * Uses environment variables `SHIPROCKET_EMAIL` and `SHIPROCKET_PASSWORD`.
 */
export async function getShiprocketToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now) {
    return tokenCache.token;
  }
  const email = process.env.SHIPROCKET_EMAIL || '';
  const password = process.env.SHIPROCKET_PASSWORD || '';
  if (!email || !password) {
    throw new Error('Shiprocket credentials are not set');
  }
  const resp = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
    email,
    password,
  });
  const { token, expires_in } = resp.data;
  const expiresAt = now + (expires_in ?? 86400) * 1000; // fallback 24h
  tokenCache = { token, expiresAt };
  return token;
}

/**
 * Create a shipment in Shiprocket.
 * The `orderId` refers to the local UniformHub order.
 * This function ensures idempotency by checking whether a shipment
 * record already exists for the given order.
 */
export async function createShipment(orderId: string, shipmentPayload: any) {
  // Prevent duplicate shipments
  const existing = await prisma.shipment.findFirst({ where: { orderId } });
  if (existing) {
    return existing; // idempotent – return existing record
  }

  const token = await getShiprocketToken();
  const resp = await axios.post(
    'https://apiv2.shiprocket.in/v1/external/orders/create/forward/shipment',
    shipmentPayload,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  const data = resp.data;
  // Save shipment details locally
  const shipment = await prisma.shipment.create({
    data: {
      orderId,
      trackingNumber: data.tracking_number ?? '',
      courierName: data.courier_name ?? '',
      status: data.status ?? 'CREATED',
      shippedAt: data.shipped_at ? new Date(data.shipped_at) : null,
      deliveredAt: data.delivered_at ? new Date(data.delivered_at) : null,
    },
  });
  return shipment;
}

/**
 * Track a shipment – simple wrapper that forwards the request to Shiprocket.
 */
export async function trackShipment(trackingNumber: string) {
  const token = await getShiprocketToken();
  const resp = await axios.get(
    `https://apiv2.shiprocket.in/v1/external/courier/track/${trackingNumber}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return resp.data;
}

/**
 * Verify Shiprocket webhook signature.
 * Shiprocket uses an `x-api-key` header containing the secret you configure in the dashboard.
 * The secret is stored in `process.env.SHIPROCKET_WEBHOOK_SECRET`.
 * We simply compare the header value to the secret (timing‑safe).
 */
export function verifyShiprocketWebhookSignature(headers: any): boolean {
  const received = headers["x-api-key"] as string;
  const expected = process.env.SHIPROCKET_WEBHOOK_SECRET || "";
  if (!received || !expected) return false;
  const receivedBuf = Buffer.from(received);
  const expectedBuf = Buffer.from(expected);
  if (receivedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(receivedBuf, expectedBuf);
}


/**
 * Process a webhook event – currently handles `order_shipped` and `order_delivered`.
 * Updates the local shipment record accordingly.
 */
export async function handleShiprocketWebhook(event: any) {
  const { type, data } = event;
  if (!data?.order_id) return;
  const shipment = await prisma.shipment.findFirst({ where: { orderId: data.order_id } });
  if (!shipment) return; // ignore if we have no record yet

  if (type === 'order_shipped') {
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: { status: 'SHIPPED', shippedAt: new Date(data.shipped_at) },
    });
  } else if (type === 'order_delivered') {
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: { status: 'DELIVERED', deliveredAt: new Date(data.delivered_at) },
    });
  }
}
