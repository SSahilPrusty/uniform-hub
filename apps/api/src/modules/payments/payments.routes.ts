import { Router } from 'express';
import { createRazorpayOrder, verifyRazorpaySignature, razorpayWebhook } from './razorpay.controller';

const router = Router();

// Create Razorpay order
router.post('/razorpay/create', createRazorpayOrder);

// Verify signature after client-side payment
router.post('/razorpay/verify', verifyRazorpaySignature);

// Razorpay webhook endpoint (public, no auth)
router.post('/razorpay/webhook', razorpayWebhook);

export default router;
