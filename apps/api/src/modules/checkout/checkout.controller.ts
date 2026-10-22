import { Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { logAudit } from "../../utils/audit.js";
import { autoAssignOrder } from "../assignment/assignment.service.js";

export const processCheckout = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { addressId, newAddress, paymentMethod = "TEST_GATEWAY", customerNotes } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(401).json({ success: false, error: "User session not found." });
      return;
    }

    // Determine delivery address
    let shippingAddress: any = null;
    if (addressId) {
      shippingAddress = await prisma.address.findFirst({
        where: { id: addressId, userId },
      });
    } else if (newAddress) {
      shippingAddress = await prisma.address.create({
        data: {
          userId,
          name: newAddress.name,
          phone: newAddress.phone,
          addressLine1: newAddress.addressLine1,
          addressLine2: newAddress.addressLine2 || null,
          city: newAddress.city,
          district: newAddress.district || null,
          state: newAddress.state,
          pincode: newAddress.pincode,
          isDefault: !!newAddress.isDefault,
        },
      });
    }

    if (!shippingAddress) {
      res.status(400).json({ success: false, error: "A valid shipping address is required." });
      return;
    }

    // Get user cart
    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            variant: true,
            product: { include: { images: true } },
            measurement: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      res.status(400).json({ success: false, error: "Shopping cart is empty." });
      return;
    }

    // Run order placement in Prisma Transaction to guarantee atomicity and avoid overselling
    const createdOrder = await prisma.$transaction(async (tx) => {
      // 1. Stock verification & deduction
      for (const item of cart.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
        });

        if (!variant || variant.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for ${item.product.name} (Size: ${item.variant.size}). Available: ${
              variant?.stock || 0
            }`
          );
        }

        // Deduct stock
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: variant.stock - item.quantity },
        });
      }

      // 2. Calculate totals on server
      const subtotal = cart.items.reduce(
        (sum, item) => sum + item.variant.sellingPrice * item.quantity,
        0
      );

      let discount = 0;
      if (cart.couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: cart.couponCode.toUpperCase() },
        });
        if (coupon && coupon.isActive && subtotal >= coupon.minOrderAmount) {
          if (coupon.discountPercent) {
            discount = (subtotal * coupon.discountPercent) / 100;
            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
              discount = coupon.maxDiscount;
            }
          } else if (coupon.discountAmount) {
            discount = coupon.discountAmount;
          }
        }
      }

      const deliveryFee = subtotal >= 1499 ? 0 : 70;
      const taxAmount = Math.round((subtotal - discount) * 0.05);
      const totalAmount = Math.max(0, subtotal - discount + deliveryFee + taxAmount);

      // Generate unique Order Number
      const timestampSuffix = Date.now().toString().slice(-6);
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `UH-${timestampSuffix}-${randomSuffix}`;

      // 3. Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          customerName: shippingAddress.name,
          customerEmail: user.email,
          customerPhone: shippingAddress.phone,
          shippingAddressJson: JSON.stringify(shippingAddress),
          subtotal,
          discount,
          deliveryFee,
          taxAmount,
          totalAmount,
          status: paymentMethod === "COD" ? "CONFIRMED" : "PAYMENT_PENDING",
          paymentMethod,
          paymentStatus: paymentMethod === "COD" ? "PENDING" : "PENDING",
          notes: customerNotes || null,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              variantId: item.variantId,
              variantSku: item.variant.sku,
              size: item.variant.size,
              color: item.variant.color,
              price: item.variant.sellingPrice,
              quantity: item.quantity,
              subtotal: item.variant.sellingPrice * item.quantity,
              productImageUrl: item.product.images[0]?.url || null,
              customMeasurementId: item.customMeasurementId || null,
            })),
          },
        },
        include: { items: true },
      });

      // 4. Create Payment Intent
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          amount: totalAmount,
          currency: "INR",
          provider: paymentMethod === "COD" ? "CASH_ON_DELIVERY" : "TEST_GATEWAY",
          transactionRef: `TXN-${order.orderNumber}`,
          status: paymentMethod === "COD" ? "PENDING" : "PENDING",
        },
      });

      // 5. Create Tailoring Jobs if any item contains custom measurements
      for (const orderItem of order.items) {
        if (orderItem.customMeasurementId) {
          await tx.tailoringJob.create({
            data: {
              jobCode: `JOB-${order.orderNumber}-${orderItem.id.slice(0, 4).toUpperCase()}`,
              orderId: order.id,
              orderItemId: orderItem.id,
              status: "NEW",
              customerMeasurementId: orderItem.customMeasurementId,
              tailorNotes: "Bespoke uniform measurements submitted with order.",
            },
          });
        }
      }

      // 6. Clear cart items
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      // Reset coupon
      await tx.cart.update({
        where: { id: cart.id },
        data: { couponCode: null },
      });

      return { order, payment };
    });

    await logAudit({
      userId,
      userName: user.name,
      action: "ORDER_CREATED",
      entityType: "Order",
      entityId: createdOrder.order.id,
      details: {
        orderNumber: createdOrder.order.orderNumber,
        totalAmount: createdOrder.order.totalAmount,
        paymentMethod,
      },
    });

    // Create Notification
    await prisma.notification.create({
      data: {
        userId,
        title: "Order Placed Successfully",
        message: `Your uniform order #${createdOrder.order.orderNumber} has been received.`,
        type: "ORDER",
        linkUrl: `/orders/${createdOrder.order.id}/track`,
      },
    });

    // Trigger automatic tailor assignment if order requires tailoring
    try {
      await autoAssignOrder(createdOrder.order.id);
    } catch (assignmentError: any) {
      console.error("Auto assignment processing warning:", assignmentError.message);
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      data: {
        order: createdOrder.order,
        payment: createdOrder.payment,
        paymentSimulation: {
          mode: "TEST_GATEWAY",
          message: "Uniform Hub Test Gateway ready for simulation confirmation.",
          verifyUrl: `/api/checkout/verify-payment`,
        },
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, transactionRef, signature, mockSuccess = true } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) {
      res.status(404).json({ success: false, error: "Order not found." });
      return;
    }

    if (!mockSuccess) {
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: "FAILED" },
      });
      await prisma.payment.updateMany({
        where: { orderId },
        data: { status: "FAILED" },
      });
      res.status(400).json({ success: false, error: "Payment was declined or failed." });
      return;
    }

    // Success confirmation
    const trackingNumber = `UH-EXP-${Math.floor(100000 + Math.random() * 900000)}`;
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
        paymentReference: transactionRef || `TEST_PAY_${Date.now()}`,
        trackingNumber,
        courierPartner: "Blue Dart Express",
      },
    });

    await prisma.payment.updateMany({
      where: { orderId },
      data: {
        status: "SUCCESS",
        signature: signature || `sim_sig_${Date.now()}`,
      },
    });

    await logAudit({
      userId: order.userId,
      userName: order.customerName,
      action: "PAYMENT_CONFIRMED",
      entityType: "Payment",
      entityId: order.id,
      details: { orderNumber: order.orderNumber, trackingNumber },
    });

    res.json({
      success: true,
      message: "Payment confirmed successfully. Order is now confirmed and being processed.",
      data: updatedOrder,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
