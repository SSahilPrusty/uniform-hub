import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../server.js";
import { prisma } from "../config/db.js";

describe("Uniform Hub: Complete Order Completion, Dispatch, Tracking & Delivery Workflow", () => {
  let adminToken: string;
  let customerToken: string;
  let customerId: string;
  let tailorToken: string;
  let tailorId: string;
  let franchiseToken: string;
  let franchiseId: string;
  let placedOrderId: string;
  let placedOrderNumber: string;

  beforeAll(async () => {
    // 1. Admin Login
    const adminRes = await request(app).post("/api/auth/login").send({
      email: "admin@uniformhub.in",
      password: "Admin@123",
    });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.token;

    // 2. Customer Login or Registration
    const custRes = await request(app).post("/api/auth/login").send({
      email: "customer@uniformhub.in",
      password: "Customer@123",
    });
    if (custRes.status === 200) {
      customerToken = custRes.body.data.token;
      customerId = custRes.body.data.user.id;
    } else {
      const regRes = await request(app).post("/api/auth/register").send({
        name: "Pooja Sharma",
        email: "customer@uniformhub.in",
        password: "Customer@123",
        confirmPassword: "Customer@123",
        phone: "+919876543210",
        role: "CUSTOMER",
      });
      customerToken = regRes.body.data.token;
      customerId = regRes.body.data.user.id;
    }

    // 3. Tailor Partner
    const tailorUser = await prisma.user.findFirst({
      where: { role: "TAILOR", isActive: true },
      include: { tailorProfile: true },
    });
    if (tailorUser && tailorUser.tailorProfile) {
      tailorId = tailorUser.tailorProfile.id;
      const tailorLogin = await request(app).post("/api/auth/login").send({
        email: tailorUser.email,
        password: "Password@123",
      });
      if (tailorLogin.status === 200) {
        tailorToken = tailorLogin.body.data.token;
      }
    }

    // If tailor token not available via password, ensure a dedicated test tailor
    if (!tailorToken) {
      const timestamp = Date.now();
      const tailorEmail = `master.tailor.${timestamp}@uniformhub.in`;
      const reg = await request(app).post("/api/auth/register").send({
        name: "Ramesh Master",
        email: tailorEmail,
        password: "Password@123",
        confirmPassword: "Password@123",
        phone: "+919876543111",
        role: "TAILOR",
        shopName: "Master Stitching Studio",
        specializations: "Uniforms, Blazers",
        skills: "Bespoke Suiting",
        address: "45 Commercial St",
        city: "Bengaluru",
        state: "Karnataka",
      });
      tailorToken = reg.body.data.token;
      const tProf = await prisma.tailorProfile.findFirst({
        where: { userId: reg.body.data.user.id },
      });
      tailorId = tProf!.id;
      // Approve tailor
      await request(app)
        .post(`/api/assignment/admin/tailor-applications/${tailorId}/approve`)
        .set("Authorization", `Bearer ${adminToken}`);
    }

    // 4. Franchise Partner
    const franLogin = await request(app).post("/api/auth/login").send({
      email: "franchise.delhi@uniformhub.in",
      password: "Franchise@123",
    });

    if (franLogin.status === 200) {
      franchiseToken = franLogin.body.data.token;
      const fProf = await prisma.franchiseProfile.findFirst({
        where: { userId: franLogin.body.data.user.id },
      });
      if (fProf) {
        franchiseId = fProf.id;
        await prisma.franchiseProfile.update({
          where: { id: fProf.id },
          data: { isVerified: true },
        });
      }
    }

    if (!franchiseToken || !franchiseId) {
      const timestamp = Date.now();
      const franEmail = `hub.franchise.${timestamp}@uniformhub.in`;
      const reg = await request(app).post("/api/auth/register").send({
        name: "Bengaluru Central Hub",
        email: franEmail,
        password: "Password@123",
        confirmPassword: "Password@123",
        phone: "+919876543222",
        role: "FRANCHISE_ADMIN",
      });
      franchiseToken = reg.body.data.token;
      const newFProf = await prisma.franchiseProfile.create({
        data: {
          userId: reg.body.data.user.id,
          businessName: "Uniform Hub South Bengaluru",
          ownerName: "Sunil Hegde",
          contactPhone: "+919876543222",
          gstNumber: "29AAAAA0000A1Z5",
          city: "Bengaluru",
          state: "Karnataka",
          address: "12 Residency Road",
          isVerified: true,
        },
      });
      franchiseId = newFProf.id;
    }
  });

  // STEP 1: Customer places an order
  it("STEP 1: Customer places order with snapshot delivery address and distinct sizes", async () => {
    // Fetch products
    const prodRes = await request(app).get("/api/products");
    expect(prodRes.status).toBe(200);
    expect(prodRes.body.data.length).toBeGreaterThan(0);
    const product = prodRes.body.data[0];
    const variant = product.variants[0];

    // Add to cart
    await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        productId: product.id,
        variantId: variant.id,
        quantity: 2,
      });

    // Checkout
    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        paymentMethod: "COD",
        newAddress: {
          name: "Dr. Ananya Sen",
          phone: "9876543999",
          addressLine1: "Villa 14, Palm Meadows",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560066",
        },
      });

    expect(checkoutRes.status).toBe(201);
    expect(checkoutRes.body.success).toBe(true);
    placedOrderId = checkoutRes.body.data.order.id;
    placedOrderNumber = checkoutRes.body.data.order.orderNumber;
    expect(placedOrderId).toBeDefined();
    expect(placedOrderNumber).toBeDefined();
  });

  // STEP 2: Order appears in Operational Admin
  it("STEP 2: Order appears in Operational Admin orders list", async () => {
    const adminOrdersRes = await request(app)
      .get("/api/assignment/admin/orders")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(adminOrdersRes.status).toBe(200);
    const found = adminOrdersRes.body.data.orders.find((o: any) => o.id === placedOrderId);
    expect(found).toBeDefined();
    expect(found.orderNumber).toBe(placedOrderNumber);
  });

  // STEP 3: Admin assigns order to a tailor
  it("STEP 3: Operational Admin assigns order to approved tailor", async () => {
    const assignRes = await request(app)
      .post("/api/assignment/admin/assign")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        orderId: placedOrderId,
        tailorId: tailorId,
        priority: "HIGH",
        notes: "Customer requested double seam reinforcement.",
      });

    expect(assignRes.status).toBe(200);
    expect(assignRes.body.success).toBe(true);
  });

  // STEP 4: Tailor sees order in Tailor Portal
  it("STEP 4: Tailor sees assigned order in Tailor Workbench and accepts", async () => {
    const tailorOrdersRes = await request(app)
      .get("/api/assignment/tailor/my-orders")
      .set("Authorization", `Bearer ${tailorToken}`);

    expect(tailorOrdersRes.status).toBe(200);
    const myOrder = tailorOrdersRes.body.data.orders.find((o: any) => o.orderId === placedOrderId);
    expect(myOrder).toBeDefined();
    expect(myOrder.assignmentStatus).toBe("ASSIGNED");

    // Accept assignment
    const acceptRes = await request(app)
      .post(`/api/assignment/tailor/${placedOrderId}/accept`)
      .set("Authorization", `Bearer ${tailorToken}`);
    expect(acceptRes.status).toBe(200);
  });

  // STEP 5: Tailor marks order as "Completed by Tailor"
  it("STEP 5: Tailor completes stitching work and marks order as 'Completed by Tailor'", async () => {
    const completeRes = await request(app)
      .post(`/api/dispatch/tailor/complete-order/${placedOrderId}`)
      .set("Authorization", `Bearer ${tailorToken}`)
      .send({
        completionNotes: "Uniform tailoring finished according to size specifications. Ironed and pressed.",
      });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.success).toBe(true);
    expect(completeRes.body.data.productionStatus).toBe("COMPLETED_BY_TAILOR");
    expect(completeRes.body.data.tailorCompletedAt).toBeDefined();
    expect(completeRes.body.data.tailorCompletionNotes).toContain("Uniform tailoring finished");
  });

  // STEP 6: Order appears in Operational Admin 'Ready for Dispatch' queue
  it("STEP 6: Order appears in Operational Admin 'Ready for Dispatch' queue", async () => {
    const adminDispatchRes = await request(app)
      .get("/api/dispatch/admin/orders?tab=READY_FOR_DISPATCH")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(adminDispatchRes.status).toBe(200);
    expect(adminDispatchRes.body.success).toBe(true);
    const found = adminDispatchRes.body.data.orders.find((o: any) => o.id === placedOrderId);
    expect(found).toBeDefined();
    expect(found.tailorCompletionNotes).toBeDefined();
    expect(found.isVerifiedByAdmin).toBe(false);
  });

  // STEP 6b: Test Return for Correction functionality
  it("STEP 6b: Admin can return order for correction -> returns to tailor workbench -> tailor re-submits", async () => {
    // Admin returns for correction
    const returnRes = await request(app)
      .post(`/api/dispatch/admin/return-correction/${placedOrderId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        reason: "Sleeve cuffs require additional button stitching per school uniform standards.",
      });

    expect(returnRes.status).toBe(200);
    expect(returnRes.body.data.productionStatus).toBe("RETURNED_FOR_CORRECTION");
    expect(returnRes.body.data.correctionReason).toContain("Sleeve cuffs require additional button stitching");

    // Tailor sees returned for correction
    const tailorOrdersRes = await request(app)
      .get("/api/assignment/tailor/my-orders")
      .set("Authorization", `Bearer ${tailorToken}`);
    const returnedOrder = tailorOrdersRes.body.data.orders.find((o: any) => o.orderId === placedOrderId);
    expect(returnedOrder).toBeDefined();
    expect(returnedOrder.productionStatus).toBe("RETURNED_FOR_CORRECTION");
    expect(returnedOrder.correctionReason).toContain("Sleeve cuffs");

    // Tailor re-completes order
    const reCompleteRes = await request(app)
      .post(`/api/dispatch/tailor/complete-order/${placedOrderId}`)
      .set("Authorization", `Bearer ${tailorToken}`)
      .send({
        completionNotes: "Cuff buttons reinforced with double stitching per admin instructions.",
      });
    expect(reCompleteRes.status).toBe(200);
    expect(reCompleteRes.body.data.productionStatus).toBe("COMPLETED_BY_TAILOR");
  });

  // STEP 7 & 8: Operational Admin verifies completed order
  it("STEP 7 & 8: Operational Admin verifies order -> moves to 'Awaiting Franchise Assignment'", async () => {
    const verifyRes = await request(app)
      .post(`/api/dispatch/admin/verify-order/${placedOrderId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        notes: "Inspection passed. Garment specifications and finishing confirmed.",
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.data.isVerifiedByAdmin).toBe(true);
    expect(verifyRes.body.data.productionStatus).toBe("AWAITING_FRANCHISE_ASSIGNMENT");
    expect(verifyRes.body.data.verifiedAt).toBeDefined();
  });

  // STEP 9: Admin assigns order to a franchise
  it("STEP 9: Admin fetches eligible franchises and assigns order to a regional franchise hub", async () => {
    // Fetch eligible franchises
    const franchisesRes = await request(app)
      .get("/api/dispatch/admin/eligible-franchises")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(franchisesRes.status).toBe(200);
    expect(franchisesRes.body.data.length).toBeGreaterThan(0);

    // Assign to franchise
    const assignRes = await request(app)
      .post("/api/dispatch/admin/assign-franchise")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        orderId: placedOrderId,
        franchiseId: franchiseId,
        notes: "Priority dispatch for upcoming school term opening.",
      });

    expect(assignRes.status).toBe(200);
    expect(assignRes.body.success).toBe(true);
    expect(assignRes.body.data.productionStatus).toBe("ASSIGNED_TO_FRANCHISE");
    expect(assignRes.body.data.franchiseId).toBe(franchiseId);
  });

  // STEP 10 & 11: Order appears in that franchise's portal under 'Orders Ready for Dispatch'
  it("STEP 10 & 11: Order appears in Franchise Portal under 'Orders Ready for Dispatch' with full delivery address and sizes", async () => {
    const franOrdersRes = await request(app)
      .get("/api/dispatch/franchise/orders?tab=READY_FOR_DISPATCH")
      .set("Authorization", `Bearer ${franchiseToken}`);

    expect(franOrdersRes.status).toBe(200);
    expect(franOrdersRes.body.success).toBe(true);
    const found = franOrdersRes.body.data.orders.find((o: any) => o.id === placedOrderId);
    expect(found).toBeDefined();

    // Verify complete snapshot address
    expect(found.shippingAddress).toBeDefined();
    const recipient = found.shippingAddress.recipientName || found.shippingAddress.name;
    expect(recipient).toContain("Dr. Ananya Sen");
    expect(found.shippingAddress.city).toBe("Bengaluru");
    expect(found.shippingAddress.postalCode || found.shippingAddress.pincode).toBe("560066");

    // Verify items and sizes
    expect(found.items.length).toBeGreaterThan(0);
    expect(found.items[0].size).toBeDefined();
    expect(found.items[0].quantity).toBe(2);
  });

  // STEP 12 & 13: Franchise prepares package and enters dispatch details
  it("STEP 12 & 13: Franchise prepares package and dispatches with courier, tracking ID, tracking URL -> moves to 'Dispatched Orders'", async () => {
    // 1. Prepare package
    const prepRes = await request(app)
      .post(`/api/dispatch/franchise/prepare-package/${placedOrderId}`)
      .set("Authorization", `Bearer ${franchiseToken}`)
      .send({ packageReference: "PKG-BLR-0042" });

    expect(prepRes.status).toBe(200);
    expect(prepRes.body.data.productionStatus).toBe("PACKAGE_PREPARED");

    // 2. Dispatch order
    const today = new Date().toISOString().slice(0, 10);
    const dispatchRes = await request(app)
      .post(`/api/dispatch/franchise/dispatch-order/${placedOrderId}`)
      .set("Authorization", `Bearer ${franchiseToken}`)
      .send({
        courierPartner: "Blue Dart Express",
        trackingNumber: "BD998877665IN",
        trackingUrl: "https://www.bluedart.com/tracking?track=BD998877665IN",
        dispatchDate: today,
        shippingNotes: "Waterproof express packaging with school emblem seal.",
      });

    expect(dispatchRes.status).toBe(200);
    expect(dispatchRes.body.success).toBe(true);
    expect(dispatchRes.body.data.productionStatus).toBe("DISPATCHED");
    expect(dispatchRes.body.data.trackingNumber).toBe("BD998877665IN");
    expect(dispatchRes.body.data.courierPartner).toBe("Blue Dart Express");
    expect(dispatchRes.body.data.trackingUrl).toBe("https://www.bluedart.com/tracking?track=BD998877665IN");

    // 3. Verify it is now in 'Dispatched Orders' in Franchise Portal
    const dispatchedListRes = await request(app)
      .get("/api/dispatch/franchise/orders?tab=DISPATCHED")
      .set("Authorization", `Bearer ${franchiseToken}`);

    expect(dispatchedListRes.status).toBe(200);
    const inDispatched = dispatchedListRes.body.data.orders.find((o: any) => o.id === placedOrderId);
    expect(inDispatched).toBeDefined();
    expect(inDispatched.trackingNumber).toBe("BD998877665IN");
  });

  // STEP 14: Customer Portal reflects live tracking details and synchronized 9-stage timeline
  it("STEP 14: Customer Tracking API reflects Courier, Tracking ID, clickable URL, and 9-stage timeline with timestamps", async () => {
    const trackRes = await request(app)
      .get(`/api/dispatch/track/${placedOrderNumber}`);

    expect(trackRes.status).toBe(200);
    expect(trackRes.body.success).toBe(true);
    const { order, trackingInfo, timeline } = trackRes.body.data;

    // Verify courier details
    expect(trackingInfo.courierPartner).toBe("Blue Dart Express");
    expect(trackingInfo.trackingNumber).toBe("BD998877665IN");
    expect(trackingInfo.trackingUrl).toBe("https://www.bluedart.com/tracking?track=BD998877665IN");
    expect(trackingInfo.dispatchedAt).toBeDefined();

    // Verify 9-stage status timeline
    expect(timeline.length).toBe(9);
    expect(timeline[0].key).toBe("ORDER_PLACED");
    expect(timeline[0].isCompleted).toBe(true);
    expect(timeline[0].timestamp).toBeDefined();

    const dispatchedStage = timeline.find((s: any) => s.key === "DISPATCHED");
    expect(dispatchedStage).toBeDefined();
    expect(dispatchedStage.isCompleted).toBe(true);
    expect(dispatchedStage.timestamp).toBeDefined();
  });

  // STEP 15: Operational Admin monitors dispatched order and confirms delivery
  it("STEP 15: Operational Admin monitors order through dispatch tabs and confirms delivery -> status becomes DELIVERED", async () => {
    // Check in Admin Dispatched tab
    const adminDispatchedRes = await request(app)
      .get("/api/dispatch/admin/orders?tab=DISPATCHED")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(adminDispatchedRes.status).toBe(200);
    const foundDispatched = adminDispatchedRes.body.data.orders.find((o: any) => o.id === placedOrderId);
    expect(foundDispatched).toBeDefined();
    expect(foundDispatched.trackingNumber).toBe("BD998877665IN");

    // Admin confirms delivery
    const deliveryRes = await request(app)
      .post(`/api/dispatch/admin/confirm-delivery/${placedOrderId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        deliveryNotes: "Courier delivered safely to Dr. Ananya Sen.",
      });

    expect(deliveryRes.status).toBe(200);
    expect(deliveryRes.body.success).toBe(true);
    expect(deliveryRes.body.data.productionStatus).toBe("DELIVERED");
    expect(deliveryRes.body.data.deliveredAt).toBeDefined();

    // Verify it is now in Delivered tab
    const adminDeliveredRes = await request(app)
      .get("/api/dispatch/admin/orders?tab=DELIVERED")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(adminDeliveredRes.status).toBe(200);
    const foundDelivered = adminDeliveredRes.body.data.orders.find((o: any) => o.id === placedOrderId);
    expect(foundDelivered).toBeDefined();
  });
});
