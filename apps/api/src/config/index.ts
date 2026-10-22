import dotenv from "dotenv";
import path from "path";

// Load root or local .env
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  apiBaseUrl: process.env.API_BASE_URL || "http://localhost:5000",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || "uniform_hub_secret_token_default_key",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  storageProvider: process.env.STORAGE_PROVIDER || "local",
  uploadDir: process.env.UPLOAD_DIR || path.resolve(process.cwd(), "uploads"),
  paymentMode: process.env.PAYMENT_MODE || "test",
};
