import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../server.js";

describe("UNIFORM HUB API Test Suite", () => {
  it("GET /api/health should return ok with platform identity", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.app).toBe("UNIFORM HUB API");
    expect(res.body.tagline).toBe("Your School. Your Uniform. One Hub.");
  });

  it("GET /api/schools should return list of partner schools", async () => {
    const res = await request(app).get("/api/schools");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/products should return product catalog", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/products/categories should return uniform categories", async () => {
    const res = await request(app).get("/api/products/categories");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("POST /api/auth/login with invalid credentials should fail securely", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "invalid.user@unknown.com",
      password: "WrongPassword999",
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("GET /api/super-admin/overview should reject unauthenticated request", async () => {
    const res = await request(app).get("/api/super-admin/overview");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("GET /api/admin/dashboard should reject unauthenticated request", async () => {
    const res = await request(app).get("/api/admin/dashboard");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
