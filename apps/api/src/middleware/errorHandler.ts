import { Request, Response, NextFunction } from "express";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error("🔥 Global Error Handler:", err);

  const statusCode = err.statusCode || (err.status ? err.status : 500);
  const message = err.message || "Internal server error occurred.";

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
