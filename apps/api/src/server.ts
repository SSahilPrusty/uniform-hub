import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import fs from "fs";
import { config } from "./config/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Routes
import authRoutes from "./modules/auth/auth.routes.js";
import schoolsRoutes from "./modules/schools/schools.routes.js";
import productsRoutes from "./modules/products/products.routes.js";
import cartRoutes from "./modules/cart/cart.routes.js";
import checkoutRoutes from "./modules/checkout/checkout.routes.js";
import ordersRoutes from "./modules/orders/orders.routes.js";
import measurementsRoutes from "./modules/measurements/measurements.routes.js";
import productImagesRoutes from "./modules/productImages/productImages.routes.js";
import schoolPortalRoutes from "./modules/portals/schoolPortal.routes.js";
import franchisePortalRoutes from "./modules/portals/franchisePortal.routes.js";
import tailorPortalRoutes from "./modules/portals/tailorPortal.routes.js";
import adminRoutes from "./modules/portals/admin.routes.js";
import superAdminRoutes from "./modules/portals/superAdmin.routes.js";
import assignmentRoutes from "./modules/assignment/assignment.routes.js";
import dispatchRoutes from "./modules/dispatch/dispatch.routes.js";
import shiprocketRoutes from "./modules/dispatch/shiprocket.routes.js";

// Shiprocket integration routes
import paymentsRoutes from "./modules/payments/payments.routes.js";


const app = express();

// Security & Parsing
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      const whitelist = [
        "https://uniformhub.pages.dev",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
      ];
      // allow no origin (e.g., curl, mobile apps)
      if (!origin) {
        return callback(null, true);
      }
      if (whitelist.includes(origin)) {
        return callback(null, true);
      }
      // otherwise block
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static uploads serving
const uploadsPath = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use("/uploads", express.static(uploadsPath));

// Health Check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "UNIFORM HUB API",
    tagline: "Your School. Your Uniform. One Hub.",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API Routes Mounting
app.use("/api/auth", authRoutes);
app.use("/api/schools", schoolsRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/measurements", measurementsRoutes);

// Mandatory Super Admin Image Management
app.use("/api/super-admin/product-images", productImagesRoutes);

// Portals
app.use("/api/portal/school", schoolPortalRoutes);
app.use("/api/portal/franchise", franchisePortalRoutes);
app.use("/api/portal/tailor", tailorPortalRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/assignment", assignmentRoutes);
app.use("/api/dispatch/shiprocket", shiprocketRoutes);
app.use("/api/dispatch", dispatchRoutes);
app.use("/api/payments", paymentsRoutes);


// 404 Catch-all
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "API endpoint not found." });
});

// Centralized error handling
app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
  app.listen(config.port, () => {
    console.log(`====================================================`);
    console.log(`🚀 UNIFORM HUB API Server running on port ${config.port}`);
    console.log(`📡 URL: http://localhost:${config.port}`);
    console.log(`📁 Uploads served at: http://localhost:${config.port}/uploads`);
    console.log(`====================================================`);
  });
}

export default app;
