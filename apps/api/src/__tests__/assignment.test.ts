import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../server.js";

describe("Uniform Hub: Order Assignment & Tailor Application Test Suite", () => {
  let adminToken: string;
  let customerToken: string;
  let tailorToken: string;
  let tailor2Token: string;
  let tailorId: string;
  let tailor2Id: string;

  beforeAll(async () => {
    // 1. Login Admin
    const adminRes = await request(app).post("/api/auth/login").send({
      email: "admin@uniformhub.in",
      password: "Admin@123",
    });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.token;

    // 2. Login Customer
    const custRes = await request(app).post("/api/auth/login").send({
      email: "parent.rahul@uniformhub.in",
      password: "Customer@123",
    });
    expect(custRes.status).toBe(200);
    customerToken = custRes.body.data.token;

    // 3. Login Tailor 1 (Ramesh)
    const tailorRes = await request(app).post("/api/auth/login").send({
      email: "master.tailor@uniformhub.in",
      password: "Tailor@123",
    });
    expect(tailorRes.status).toBe(200);
    tailorToken = tailorRes.body.data.token;
    tailorId = tailorRes.body.data.user.tailorProfile.id;

    // 4. Login Tailor 2 (Suresh)
    const tailor2Res = await request(app).post("/api/auth/login").send({
      email: "suresh.tailor@uniformhub.in",
      password: "Tailor@123",
    });
    expect(tailor2Res.status).toBe(200);
    tailor2Token = tailor2Res.body.data.token;
    tailor2Id = tailor2Res.body.data.user.tailorProfile.id;
  });

  // TEST 1: New Tailor Registration creates PENDING application
  let newTailorId: string;
  let newTailorEmail: string;

  it("TEST 1: Tailor registration creates user and profile with PENDING status", async () => {
    const timestamp = Date.now();
    newTailorEmail = `applicant.tailor.${timestamp}@uniformhub.in`;

    const regRes = await request(app).post("/api/auth/register").send({
      name: "New Applicant Tailor",
      email: newTailorEmail,
      password: "Password@123",
      confirmPassword: "Password@123",
      phone: "+919876500111",
      role: "TAILOR",
      shopName: "Premier Bespoke Uniforms",
      specializations: "Blazers, Trousers, Skirts",
      skills: "10 years alteration experience",
      address: "15 MG Road, Bengaluru",
    });

    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);

    // Verify Admin can see this application in PENDING applications
    const appsRes = await request(app)
      .get("/api/assignment/admin/tailor-applications?status=PENDING")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(appsRes.status).toBe(200);
    expect(appsRes.body.success).toBe(true);
    const found = appsRes.body.data.applications.find((a: any) => a.email === newTailorEmail);
    expect(found).toBeDefined();
    expect(found.approvalStatus).toBe("PENDING");
    expect(found.shopName).toBe("Premier Bespoke Uniforms");
    newTailorId = found.id;
  });

  // TEST 2: Admin approves application
  it("TEST 2: Admin approves tailor application -> becomes APPROVED and eligible", async () => {
    const approveRes = await request(app)
      .post(`/api/assignment/admin/tailor-applications/${newTailorId}/approve`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.success).toBe(true);
    expect(approveRes.body.data.approvalStatus).toBe("APPROVED");
    expect(approveRes.body.data.isAvailable).toBe(true);
    expect(approveRes.body.data.isVerified).toBe(true);

    // Verify now listed in Approved tab
    const approvedList = await request(app)
      .get("/api/assignment/admin/tailor-applications?status=APPROVED")
      .set("Authorization", `Bearer ${adminToken}`);

    const foundApproved = approvedList.body.data.applications.find((a: any) => a.id === newTailorId);
    expect(foundApproved).toBeDefined();
    expect(foundApproved.approvalStatus).toBe("APPROVED");
  });

  // TEST 3: Admin rejects another application with a reason
  it("TEST 3: Admin rejects tailor application with mandatory reason -> saved in Rejected tab", async () => {
    const rejectEmail = `rejected.tailor.${Date.now()}@uniformhub.in`;

    const regRes = await request(app).post("/api/auth/register").send({
      name: "Incomplete Tailor Applicant",
      email: rejectEmail,
      password: "Password@123",
      confirmPassword: "Password@123",
      phone: "+919876500222",
      role: "TAILOR",
      shopName: "Unverified Alterations",
    });

    expect(regRes.status).toBe(201);

    // Fetch applicant ID
    const appsRes = await request(app)
      .get("/api/assignment/admin/tailor-applications?status=PENDING")
      .set("Authorization", `Bearer ${adminToken}`);
    const applicant = appsRes.body.data.applications.find((a: any) => a.email === rejectEmail);
    expect(applicant).toBeDefined();

    // Rejection without reason must fail
    const failReject = await request(app)
      .post(`/api/assignment/admin/tailor-applications/${applicant.id}/reject`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "" });
    expect(failReject.status).toBe(400);

    // Rejection with reason
    const rejectRes = await request(app)
      .post(`/api/assignment/admin/tailor-applications/${applicant.id}/reject`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "Incomplete physical workshop verification and missing credentials." });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.data.approvalStatus).toBe("REJECTED");
    expect(rejectRes.body.data.rejectionReason).toContain("Incomplete physical workshop");

    // Rejected tailor cannot be assigned an order
    const dummyOrderRes = await request(app)
      .get("/api/assignment/admin/orders")
      .set("Authorization", `Bearer ${adminToken}`);
    if (dummyOrderRes.body.data.orders.length > 0) {
      const orderId = dummyOrderRes.body.data.orders[0].id;
      const assignRejected = await request(app)
        .post("/api/assignment/admin/assign")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          orderId,
          tailorId: applicant.id,
        });
      expect(assignRejected.status).toBe(400);
      expect(assignRejected.body.error).toContain("Cannot assign order to an unapproved tailor");
    }
  });

  // TEST 4 & 5: Customer places order with distinct sizes, Admin views exact sizes & assigns tailor
  let placedOrderId: string;

  it("TEST 4: Customer orders items with exact selected sizes -> Admin preserves individual sizes", async () => {
    // 1. Add item with Size 38 to cart
    const prodRes = await request(app).get("/api/products");
    expect(prodRes.body.data.length).toBeGreaterThan(0);
    const product = prodRes.body.data[0];
    const variant1 = product.variants[0]; // e.g. Size 38 or 30

    await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        productId: product.id,
        variantId: variant1.id,
        quantity: 2,
      });

    // 2. Checkout
    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        paymentMethod: "COD",
        newAddress: {
          name: "Rahul Verma",
          phone: "9876543215",
          addressLine1: "Flat 402, Sunrise Heights",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
        },
        customerNotes: "Please deliver between 9 AM and 2 PM.",
      });

    expect(checkoutRes.status).toBe(201);
    placedOrderId = checkoutRes.body.data.order.id;

    // 3. Verify in Admin Customer Order Assignment table
    const adminOrdersRes = await request(app)
      .get(`/api/assignment/admin/orders?search=${checkoutRes.body.data.order.orderNumber}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(adminOrdersRes.status).toBe(200);
    const orderData = adminOrdersRes.body.data.orders[0];
    expect(orderData).toBeDefined();
    expect(orderData.items.length).toBeGreaterThan(0);
    // Check size preservation
    expect(orderData.items[0].size).toBe(variant1.size);
    expect(orderData.items[0].quantity).toBe(2);
  });

  it("TEST 5: Admin assigns order to approved tailor (Ramesh) -> assignment recorded in database", async () => {
    const assignRes = await request(app)
      .post("/api/assignment/admin/assign")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        orderId: placedOrderId,
        tailorId,
        priority: "HIGH",
        notes: "Assigned to Master Tailor Ramesh with High Priority.",
      });

    expect(assignRes.status).toBe(200);
    expect(assignRes.body.success).toBe(true);

    // Verify order reflects assignment
    const checkRes = await request(app)
      .get(`/api/assignment/admin/orders?search=${placedOrderId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    const o = checkRes.body.data.orders.find((x: any) => x.id === placedOrderId);
    expect(o.productionStatus).toBe("ASSIGNED");
    expect(o.assignedTailor.id).toBe(tailorId);
  });

  it("TEST 6: Assigned order appears in assigned tailor's portal (Ramesh)", async () => {
    const myOrdersRes = await request(app)
      .get("/api/assignment/tailor/my-orders")
      .set("Authorization", `Bearer ${tailorToken}`);

    expect(myOrdersRes.status).toBe(200);
    const found = myOrdersRes.body.data.orders.find((o: any) => o.orderId === placedOrderId);
    expect(found).toBeDefined();
    expect(found.assignmentStatus).toBe("ASSIGNED");
  });

  it("TEST 7: Other tailor (Suresh) cannot access or modify Ramesh's order", async () => {
    // Other tailor calls accept on an order not assigned to them
    const unauthorizedAccept = await request(app)
      .post(`/api/assignment/tailor/${placedOrderId}/accept`)
      .set("Authorization", `Bearer ${tailor2Token}`);

    expect(unauthorizedAccept.status).toBe(400);
    expect(unauthorizedAccept.body.error).toContain("No active assignment awaiting acceptance");
  });

  it("TEST 8: Tailor accepts order & updates production status -> synchronizes with Admin", async () => {
    // 1. Accept
    const acceptRes = await request(app)
      .post(`/api/assignment/tailor/${placedOrderId}/accept`)
      .set("Authorization", `Bearer ${tailorToken}`);

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.order.productionStatus).toBe("ACCEPTED");

    // 2. Start Work -> IN_PROGRESS
    const progressRes = await request(app)
      .put(`/api/assignment/orders/${placedOrderId}/production-status`)
      .set("Authorization", `Bearer ${tailorToken}`)
      .send({
        newStatus: "IN_PROGRESS",
        notes: "Fabric cut and assembled according to customer size specifications.",
      });

    expect(progressRes.status).toBe(200);
    expect(progressRes.body.data.order.productionStatus).toBe("IN_PROGRESS");

    // 3. Admin sees updated status
    const adminCheck = await request(app)
      .get(`/api/assignment/admin/orders?search=${placedOrderId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    const adminOrder = adminCheck.body.data.orders.find((x: any) => x.id === placedOrderId);
    expect(adminOrder.productionStatus).toBe("IN_PROGRESS");
  });

  it("TEST 9: Admin reassigns order to Tailor 2 (Suresh) -> assignment history audit preserved", async () => {
    const reassignRes = await request(app)
      .post("/api/assignment/admin/reassign")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        orderId: placedOrderId,
        newTailorId: tailor2Id,
        reason: "Reassigned to Suresh Kumar for expedited blazer finishing.",
      });

    expect(reassignRes.status).toBe(200);

    // Suresh can now see the order
    const sureshOrders = await request(app)
      .get("/api/assignment/tailor/my-orders")
      .set("Authorization", `Bearer ${tailor2Token}`);

    const inSuresh = sureshOrders.body.data.orders.find((o: any) => o.orderId === placedOrderId);
    expect(inSuresh).toBeDefined();

    // Verify audit history trail
    const historyRes = await request(app)
      .get(`/api/assignment/orders/${placedOrderId}/history`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.data.assignmentHistories.length).toBeGreaterThan(0);
    const reassignAction = historyRes.body.data.assignmentHistories.find(
      (h: any) => h.action === "REASSIGNED"
    );
    expect(reassignAction).toBeDefined();
    expect(reassignAction.reason).toContain("expedited blazer finishing");
  });

  it("TEST 10: Tailor rejection returns order to Awaiting Assignment queue", async () => {
    // Suresh rejects the assignment with reason
    const rejectRes = await request(app)
      .post(`/api/assignment/tailor/${placedOrderId}/reject`)
      .set("Authorization", `Bearer ${tailor2Token}`)
      .send({
        reason: "Specialized trim color currently out of stock in studio.",
      });

    expect(rejectRes.status).toBe(200);

    // Verify order is back in AWAITING_TAILOR_ASSIGNMENT queue
    const adminCheck = await request(app)
      .get(`/api/assignment/admin/orders?status=AWAITING_TAILOR_ASSIGNMENT`)
      .set("Authorization", `Bearer ${adminToken}`);

    const found = adminCheck.body.data.orders.find((o: any) => o.id === placedOrderId);
    expect(found).toBeDefined();
    expect(found.productionStatus).toBe("AWAITING_TAILOR_ASSIGNMENT");
  });
});
