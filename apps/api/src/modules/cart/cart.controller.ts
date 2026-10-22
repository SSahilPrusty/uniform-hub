import { Request, Response } from "express";
import { prisma } from "../../config/db.js";

const calculateCartTotals = async (cartId: string, couponCode?: string | null) => {
  const items = await prisma.cartItem.findMany({
    where: { cartId },
    include: {
      product: {
        include: {
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
        },
      },
      variant: true,
      measurement: true,
    },
  });

  const subtotal = items.reduce((sum, item) => sum + item.variant.sellingPrice * item.quantity, 0);

  let discount = 0;
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode.toUpperCase() },
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

  // Delivery fee logic: standard ₹70, free if subtotal >= ₹1499
  const deliveryFee = subtotal === 0 || subtotal >= 1499 ? 0 : 70;
  const taxAmount = Math.round((subtotal - discount) * 0.05); // 5% apparel GST
  const total = Math.max(0, subtotal - discount + deliveryFee + taxAmount);

  return {
    items,
    subtotal,
    discount,
    deliveryFee,
    taxAmount,
    total,
    couponCode: discount > 0 ? couponCode : null,
  };
};

export const getOrCreateCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const sessionId = (req.headers["x-session-id"] as string) || req.query.sessionId as string;

    let cart = null;
    if (userId) {
      cart = await prisma.cart.findFirst({
        where: { userId },
      });
      if (!cart) {
        cart = await prisma.cart.create({
          data: { userId },
        });
      }
    } else if (sessionId) {
      cart = await prisma.cart.findUnique({
        where: { sessionId },
      });
      if (!cart) {
        cart = await prisma.cart.create({
          data: { sessionId },
        });
      }
    } else {
      res.status(400).json({ success: false, error: "Either user authentication or x-session-id is required." });
      return;
    }

    const calculated = await calculateCartTotals(cart.id, cart.couponCode);

    res.json({
      success: true,
      data: {
        id: cart.id,
        ...calculated,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const addItemToCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, variantId, quantity = 1, customMeasurementId } = req.body;
    const userId = req.user?.id;
    const sessionId = (req.headers["x-session-id"] as string) || req.body.sessionId;

    // Check variant & stock
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant || !variant.isAvailable) {
      res.status(400).json({ success: false, error: "Selected product size is currently unavailable." });
      return;
    }

    if (variant.stock < quantity) {
      res.status(400).json({
        success: false,
        error: `Insufficient stock. Only ${variant.stock} item(s) available.`,
      });
      return;
    }

    // Find or create cart
    let cart = null;
    if (userId) {
      cart = await prisma.cart.findFirst({ where: { userId } });
      if (!cart) cart = await prisma.cart.create({ data: { userId } });
    } else if (sessionId) {
      cart = await prisma.cart.findUnique({ where: { sessionId } });
      if (!cart) cart = await prisma.cart.create({ data: { sessionId } });
    }

    if (!cart) {
      res.status(400).json({ success: false, error: "Cart could not be identified." });
      return;
    }

    // Check if item already exists
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId,
        },
      },
    });

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (newQty > variant.stock) {
        res.status(400).json({
          success: false,
          error: `Cannot add more. Maximum available stock is ${variant.stock}.`,
        });
        return;
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQty,
          customMeasurementId: customMeasurementId || existingItem.customMeasurementId,
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId,
          quantity,
          customMeasurementId: customMeasurementId || null,
        },
      });
    }

    const calculated = await calculateCartTotals(cart.id, cart.couponCode);

    res.json({
      success: true,
      message: "Product added to cart.",
      data: {
        id: cart.id,
        ...calculated,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateItemQuantity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { variant: true, cart: true },
    });

    if (!item) {
      res.status(404).json({ success: false, error: "Cart item not found." });
      return;
    }

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      if (quantity > item.variant.stock) {
        res.status(400).json({
          success: false,
          error: `Only ${item.variant.stock} available in stock.`,
        });
        return;
      }

      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
      });
    }

    const calculated = await calculateCartTotals(item.cart.id, item.cart.couponCode);

    res.json({
      success: true,
      data: {
        id: item.cart.id,
        ...calculated,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const removeItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { itemId } = req.params;

    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item) {
      res.status(404).json({ success: false, error: "Cart item not found." });
      return;
    }

    await prisma.cartItem.delete({ where: { id: itemId } });

    const calculated = await calculateCartTotals(item.cart.id, item.cart.couponCode);

    res.json({
      success: true,
      message: "Item removed from cart.",
      data: {
        id: item.cart.id,
        ...calculated,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const applyCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cartId, code } = req.body;

    if (!code) {
      await prisma.cart.update({
        where: { id: cartId },
        data: { couponCode: null },
      });
      const totals = await calculateCartTotals(cartId, null);
      res.json({ success: true, message: "Coupon removed.", data: totals });
      return;
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      res.status(400).json({ success: false, error: "Invalid or expired coupon code." });
      return;
    }

    await prisma.cart.update({
      where: { id: cartId },
      data: { couponCode: coupon.code },
    });

    const calculated = await calculateCartTotals(cartId, coupon.code);

    if (calculated.discount === 0) {
      res.status(400).json({
        success: false,
        error: `Coupon requires a minimum order amount of ₹${coupon.minOrderAmount}.`,
      });
      return;
    }

    res.json({
      success: true,
      message: `Coupon '${coupon.code}' applied successfully!`,
      data: {
        id: cartId,
        ...calculated,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
