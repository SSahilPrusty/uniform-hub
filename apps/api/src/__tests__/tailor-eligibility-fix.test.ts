import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../server.js";

describe("Uniform Hub: Order Assignment Tailor Eligibility & Modal Verification", () => {
  let adminToken: string;
  let testOrderId: string;
  let newTailorEmail: string;
  let newTailorId: string;
  let newTailorToken: string;
  let rejectedTailorId: string;

  beforeAll(async () => {
    // 1. Admin login
    const adminRes = await request(app).post("/api/auth/login").send({
      email: "admin@uniformhub.in",
      password: "Admin@123",
    });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.token;

    // 2. Fetch an existing order from admin orders
    const ordersRes = await request(app)
      .get("/api/assignment/admin/orders")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(ordersRes.status).toBe(200);
    expect(ordersRes.body.data.orders.length).toBeGreaterThan(0);
    testOrderId = ordersRes.body.data.orders[0].id;
  });

  // TEST 1: Register a new tailor
  it("TEST 1: Register a new tailor", async () => {
    const timestamp = Date.now();
    newTailorEmail = `eleg.tailor.${timestamp}@uniformhub.in`;

    const regRes = await request(app).post("/api/auth/register").send({
      name: "Elegance Stitchers",
      email: newTailorEmail,
      password: "Password@123",
      confirmPassword: "Password@123",
      phone: "+919876543000",
      role: "TAILOR",
      shopName: "Elegance Bespoke Uniforms",
      specializations: "School Uniforms, Blazers, Trousers",
      skills: "Master Pattern Maker, Bespoke Suiting",
      address: "88 Commercial Street",
      city: "Bengaluru",
      state: "Karnataka",
    });

    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);

    // Verify it is initially PENDING in tailor-applications
    const appsRes = await request(app)
      .get("/api/assignment/admin/tailor-applications?status=PENDING")
      .set("Authorization", `Bearer ${adminToken}`);
    const found = appsRes.body.data.applications.find((a: any) => a.email === newTailorEmail);
    expect(found).toBeDefined();
    expect(found.approvalStatus).toBe("PENDING");
    newTailorId = found.id;
  });

  // TEST 2: Approve that tailor through Tailor Applications
  it("TEST 2: Approve that tailor through Tailor Applications", async () => {
    const approveRes = await request(app)
      .post(`/api/assignment/admin/tailor-applications/${newTailorId}/approve`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.success).toBe(true);
    expect(approveRes.body.data.approvalStatus).toBe("APPROVED");
    expect(approveRes.body.data.isAvailable).toBe(true);
  });

  // TEST 3: Open Customer Order Assignment and click Assign Tailor -> Newly approved tailor appears
  it("TEST 3: Eligible tailors API returns newly approved tailor with full details", async () => {
    const res = await request(app)
      .get(`/api/assignment/admin/eligible-tailors/${testOrderId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const foundInList = res.body.data.find((t: any) => t.id === newTailorId);
    expect(foundInList).toBeDefined();
    expect(foundInList.name).toBe("Elegance Stitchers");
    expect(foundInList.shopName).toBe("Elegance Bespoke Uniforms");
    expect(foundInList.approvalStatus).toBe("APPROVED");
    expect(foundInList.isAvailable).toBe(true);
    expect(foundInList.isEligible).toBe(true);
    expect(foundInList.capacityAvailable).toBeGreaterThan(0);
  });

  // TEST 4: Assign an order to that tailor -> Saved in database
  it("TEST 4: Assign an order to that tailor -> successfully saved in DB", async () => {
    const assignRes = await request(app)
      .post("/api/assignment/admin/assign")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        orderId: testOrderId,
        tailorId: newTailorId,
        priority: "HIGH",
        notes: "Assigned during eligibility regression test",
      });

    expect(assignRes.status).toBe(200);
    expect(assignRes.body.success).toBe(true);
    expect(assignRes.body.data.assignment.tailorId).toBe(newTailorId);
  });

  // TEST 5: Log in to the assigned tailor's account -> Order appears in My Assigned Orders
  it("TEST 5: Log in to the assigned tailor's account -> assigned order appears in workbench", async () => {
    const loginRes = await request(app).post("/api/auth/login").send({
      email: newTailorEmail,
      password: "Password@123",
    });
    expect(loginRes.status).toBe(200);
    newTailorToken = loginRes.body.data.token;

    const myOrdersRes = await request(app)
      .get("/api/assignment/tailor/my-orders")
      .set("Authorization", `Bearer ${newTailorToken}`);

    expect(myOrdersRes.status).toBe(200);
    expect(myOrdersRes.body.success).toBe(true);
    const foundOrder = myOrdersRes.body.data.orders.find((o: any) => o.orderId === testOrderId);
    expect(foundOrder).toBeDefined();
    expect(foundOrder.tailorId).toBe(newTailorId);
  });

  // TEST 6: Refresh and reopen assignment modal -> Data remains correct
  it("TEST 6: Re-querying eligible tailors reflects updated live workload", async () => {
    const res = await request(app)
      .get(`/api/assignment/admin/eligible-tailors/${testOrderId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const tailorData = res.body.data.find((t: any) => t.id === newTailorId);
    expect(tailorData).toBeDefined();
    expect(tailorData.activeOrderCount).toBe(1);
    expect(tailorData.capacityAvailable).toBe(tailorData.maxActiveOrders - 1);
  });

  // TEST 7: Attempt to assign an order to a pending or rejected tailor -> Backend rejects
  it("TEST 7: Attempting to assign an order to a pending or rejected tailor fails", async () => {
    // 1. Register a tailor and reject them
    const rejEmail = `rejected.tailor.${Date.now()}@uniformhub.in`;
    const regRes = await request(app).post("/api/auth/register").send({
      name: "Disqualified Tailor",
      email: rejEmail,
      password: "Password@123",
      confirmPassword: "Password@123",
      phone: "+919876543999",
      role: "TAILOR",
      shopName: "Disqualified Shop",
    });
    expect(regRes.status).toBe(201);

    const appsRes = await request(app)
      .get("/api/assignment/admin/tailor-applications?status=PENDING")
      .set("Authorization", `Bearer ${adminToken}`);
    const foundPending = appsRes.body.data.applications.find((a: any) => a.email === rejEmail);
    expect(foundPending).toBeDefined();
    rejectedTailorId = foundPending.id;

    // Reject application
    await request(app)
      .post(`/api/assignment/admin/tailor-applications/${rejectedTailorId}/reject`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "Incomplete physical credentials" });

    // Attempt to assign to this rejected tailor
    const assignRejRes = await request(app)
      .post("/api/assignment/admin/assign")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        orderId: testOrderId,
        tailorId: rejectedTailorId,
      });

    expect(assignRejRes.status).toBe(400);
    expect(assignRejRes.body.success).toBe(false);
    expect(assignRejRes.body.error).toContain("unapproved");
  });

  // TEST 8: Error handling verification
  it("TEST 8: Querying non-existent order or invalid token produces clean error response", async () => {
    const noAuthRes = await request(app).get(`/api/assignment/admin/eligible-tailors/${testOrderId}`);
    expect(noAuthRes.status).toBe(401);
    expect(noAuthRes.body.success).toBe(false);

    // Call without orderId still works gracefully and returns eligible tailors
    const noOrderIdRes = await request(app)
      .get("/api/assignment/admin/eligible-tailors")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(noOrderIdRes.status).toBe(200);
    expect(noOrderIdRes.body.success).toBe(true);
    expect(noOrderIdRes.body.data.length).toBeGreaterThan(0);
  });
});
