// Razorpay payment controller
import { Request, Response } from "express";
import Razorpay from "razorpay";
import { prisma } from "../../../../prisma/client"; // adjust path as needed
import crypto from "crypto";
import { config } from "../../config/index.js";

// Initialise Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

/**
 * Create a Razorpay order for a given UniformHub order.
 * Expects { orderId: string } in body.
 */
export const createRazorpayOrder = async (req: Request, res: Response) => {
  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({ error: "orderId is required" });
  }

  // Fetch order and calculate amount in paise (INR)
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  if (order.paymentStatus !== "PENDING") {
    return res.status(400).json({ error: "Order already has a payment status" });
  }

  const amountInPaise = Math.round(order.totalAmount * 100);

  try {
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: order.id,
    });

    // Save payment record (idempotent – check for existing)
    const payment = await prisma.payment.upsert({
      where: { transactionRef: razorpayOrder.id },
      update: { provider: "RAZORPAY", amount: order.totalAmount, status: "PENDING" },
      create: {
        orderId: order.id,
        amount: order.totalAmount,
        provider: "RAZORPAY",
        transactionRef: razorpayOrder.id,
        status: "PENDING",
        metadata: JSON.stringify({ razorpayOrderId: razorpayOrder.id }),
      },
    });

    return res.json({
      orderId: razorpayOrder.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (error) {
    console.error("Razorpay order creation error", error);
    return res.status(500).json({ error: "Failed to create Razorpay order" });
  }
};

/**
 * Verify Razorpay payment signature.
 * Expects { razorpay_order_id, razorpay_payment_id, razorpay_signature } in body.
 */
export const verifyRazorpaySignature = async (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    return res.status(400).json({ error: "Invalid signature" });
  }

  // Update payment and order status atomically
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.update({
      where: { transactionRef: razorpay_order_id },
      data: {
        status: "SUCCESS",
        transactionRef: razorpay_payment_id,
        signature: razorpay_signature,
      },
    });

    await tx.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: "PAID" },
    });
  });

  return res.json({ success: true });
};

/**
 * Razorpay webhook endpoint – validates signature and updates payment status.
 * Should be registered in Razorpay dashboard.
 */
export const razorpayWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["x-razorpay-signature"] as string;
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
  const expected = crypto.createHmac("sha256", secret).update(JSON.stringify(req.body)).digest("hex");

  if (signature !== expected) {
    return res.status(400).json({ error: "Invalid webhook signature" });
  }

  const event = req.body;
  if (event.event === "payment.captured") {
    const paymentEntity = event.payload.payment.entity;
    const razorpayOrderId = paymentEntity.order_id;
    const razorpayPaymentId = paymentEntity.id;

    // Idempotent update – ignore if already SUCCESS
    const existing = await prisma.payment.findUnique({ where: { transactionRef: razorpayOrderId } });
    if (existing && existing.status === "SUCCESS") {
      return res.json({ status: "already_processed" });
    }

    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({
        where: { transactionRef: razorpayOrderId },
        data: { status: "SUCCESS", transactionRef: razorpayPaymentId, signature: paymentEntity.signature },
      });
      await tx.order.update({ where: { id: payment.orderId }, data: { paymentStatus: "PAID" } });
    });
  }

  return res.json({ received: true });
};
