import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting UNIFORM HUB Database Seed...");

  // 1. Platform Settings
  const settings = [
    { key: "platform_name", value: "UNIFORM HUB", description: "Official Platform Name" },
    { key: "platform_tagline", value: "Your School. Your Uniform. One Hub.", description: "Brand Tagline" },
    { key: "currency", value: "INR", description: "Default Platform Currency" },
    { key: "currency_symbol", value: "₹", description: "Display Currency Symbol" },
    { key: "platform_commission_percent", value: "10.0", description: "Platform Fee Percentage" },
    { key: "delivery_fee_standard", value: "70.0", description: "Standard Delivery Fee in INR" },
    { key: "free_delivery_threshold", value: "1499.0", description: "Minimum cart amount for Free Delivery" },
    { key: "tax_gst_percent", value: "5.0", description: "Apparel GST Rate" },
  ];

  for (const s of settings) {
    await prisma.platformSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s,
    });
  }

  // 2. Roles
  const roles = [
    { name: "SUPER_ADMIN", description: "Full system administration and platform governance" },
    { name: "ADMIN", description: "Operational administration, approvals, catalog review" },
    { name: "SCHOOL_ADMIN", description: "School representative managing uniform catalog and designs" },
    { name: "FRANCHISE_ADMIN", description: "Franchise retailer managing products, stock, and fulfillment" },
    { name: "TAILOR", description: "Alteration and custom tailoring service provider" },
    { name: "CUSTOMER", description: "Student/Parent shopping for school uniforms" },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r,
    });
  }

  // 3. Password hashing
  const defaultPasswordHash = await bcrypt.hash("UniformHub@2026", 10);
  const superAdminPasswordHash = await bcrypt.hash("SuperAdmin@123", 10);
  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);
  const schoolPasswordHash = await bcrypt.hash("School@123", 10);
  const franchisePasswordHash = await bcrypt.hash("Franchise@123", 10);
  const tailorPasswordHash = await bcrypt.hash("Tailor@123", 10);
  const customerPasswordHash = await bcrypt.hash("Customer@123", 10);

  // 4. Create Users
  // Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@uniformhub.in" },
    update: { passwordHash: superAdminPasswordHash, role: "SUPER_ADMIN" },
    create: {
      email: "superadmin@uniformhub.in",
      passwordHash: superAdminPasswordHash,
      name: "Chief Platform Architect",
      phone: "+919876543210",
      role: "SUPER_ADMIN",
    },
  });

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@uniformhub.in" },
    update: { passwordHash: adminPasswordHash, role: "ADMIN" },
    create: {
      email: "admin@uniformhub.in",
      passwordHash: adminPasswordHash,
      name: "Uniform Hub Operations Admin",
      phone: "+919876543211",
      role: "ADMIN",
    },
  });

  // School Admin
  const schoolUser = await prisma.user.upsert({
    where: { email: "dps.principal@uniformhub.in" },
    update: { passwordHash: schoolPasswordHash, role: "SCHOOL_ADMIN" },
    create: {
      email: "dps.principal@uniformhub.in",
      passwordHash: schoolPasswordHash,
      name: "Dr. A. Sharma (DPS Principal)",
      phone: "+919876543212",
      role: "SCHOOL_ADMIN",
    },
  });

  // Franchise Admin
  const franchiseUser = await prisma.user.upsert({
    where: { email: "franchise.delhi@uniformhub.in" },
    update: { passwordHash: franchisePasswordHash, role: "FRANCHISE_ADMIN" },
    create: {
      email: "franchise.delhi@uniformhub.in",
      passwordHash: franchisePasswordHash,
      name: "Vikas Aggarwal (National Uniforms NCR)",
      phone: "+919876543213",
      role: "FRANCHISE_ADMIN",
    },
  });

  // Tailor Partner 1
  const tailorUser = await prisma.user.upsert({
    where: { email: "master.tailor@uniformhub.in" },
    update: { passwordHash: tailorPasswordHash, role: "TAILOR" },
    create: {
      email: "master.tailor@uniformhub.in",
      passwordHash: tailorPasswordHash,
      name: "Master Tailor Ramesh",
      phone: "+919876543214",
      role: "TAILOR",
    },
  });

  // Tailor Partner 2
  const tailorUser2 = await prisma.user.upsert({
    where: { email: "suresh.tailor@uniformhub.in" },
    update: { passwordHash: tailorPasswordHash, role: "TAILOR" },
    create: {
      email: "suresh.tailor@uniformhub.in",
      passwordHash: tailorPasswordHash,
      name: "Suresh Kumar",
      phone: "+919876543216",
      role: "TAILOR",
    },
  });

  // Customer (Parent)
  const customerUser = await prisma.user.upsert({
    where: { email: "parent.rahul@uniformhub.in" },
    update: { passwordHash: customerPasswordHash, role: "CUSTOMER" },
    create: {
      email: "parent.rahul@uniformhub.in",
      passwordHash: customerPasswordHash,
      name: "Rahul Verma",
      phone: "+919876543215",
      role: "CUSTOMER",
    },
  });

  // 5. Customer Profile & Address
  await prisma.customerProfile.upsert({
    where: { userId: customerUser.id },
    update: { loyaltyPoints: 250 },
    create: {
      userId: customerUser.id,
      loyaltyPoints: 250,
    },
  });

  const customerAddress = await prisma.address.create({
    data: {
      userId: customerUser.id,
      name: "Rahul Verma",
      phone: "+919876543215",
      addressLine1: "Tower B, Flat 402, Green Glen Heights",
      addressLine2: "Outer Ring Road, Bellandur",
      city: "Bengaluru",
      district: "Bengaluru Urban",
      state: "Karnataka",
      pincode: "560103",
      isDefault: true,
    },
  });

  // 6. Schools
  const schoolsData = [
    {
      name: "Delhi Public School, R.K. Puram",
      slug: "delhi-public-school-rk-puram",
      code: "DPS-RKP-01",
      logo: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=200&q=80",
      address: "Sector XII, R.K. Puram",
      city: "New Delhi",
      district: "South West Delhi",
      state: "Delhi",
      pincode: "110022",
      contactEmail: "principal@dpsrkp.net",
      contactPhone: "+911149115500",
      description: "Premier CBSE affiliated institution known for academic excellence and proud uniform traditions.",
      isVerified: true,
      isActive: true,
    },
    {
      name: "St. Xavier's High School, Fort",
      slug: "st-xaviers-high-school-mumbai",
      code: "STX-MUM-02",
      logo: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=200&q=80",
      address: "5, Mahapalika Marg, Dhobi Talao, Fort",
      city: "Mumbai",
      district: "Mumbai City",
      state: "Maharashtra",
      pincode: "400001",
      contactEmail: "info@xaviershighschool.org",
      contactPhone: "+912222620661",
      description: "Heritage Jesuit educational institution established in 1869 with classic blue and white uniform.",
      isVerified: true,
      isActive: true,
    },
    {
      name: "Kendriya Vidyalaya, Hebbal",
      slug: "kendriya-vidyalaya-hebbal",
      code: "KV-BLR-03",
      logo: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=200&q=80",
      address: "Near CPRI, Sadashivanagar Post, Hebbal",
      city: "Bengaluru",
      district: "Bengaluru Urban",
      state: "Karnataka",
      pincode: "560080",
      contactEmail: "kvhebbal@kvsedu.gov.in",
      contactPhone: "+918023412461",
      description: "Autonomous school under Ministry of Education offering official all-India KV uniform sets.",
      isVerified: true,
      isActive: true,
    },
    {
      name: "DAV Public School, Chandrasekharpur",
      slug: "dav-public-school-chandrasekharpur",
      code: "DAV-BBI-04",
      logo: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=200&q=80",
      address: "Sailashree Vihar, Chandrasekharpur",
      city: "Bhubaneswar",
      district: "Khordha",
      state: "Odisha",
      pincode: "751021",
      contactEmail: "davcspur@gmail.com",
      contactPhone: "+916742740651",
      description: "Renowned DAV college managing committee institution with strict uniform code.",
      isVerified: true,
      isActive: true,
    },
    {
      name: "Ryan International School, Sector 40",
      slug: "ryan-international-school-gurugram",
      code: "RYAN-GGN-05",
      logo: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=200&q=80",
      address: "Opposite HUDA Market, Sector 40",
      city: "Gurugram",
      district: "Gurugram",
      state: "Haryana",
      pincode: "122001",
      contactEmail: "ryan.sec40@ryangroup.org",
      contactPhone: "+911244081041",
      description: "Holistic modern school with distinctive green, navy, and white sports and daily attire.",
      isVerified: true,
      isActive: true,
    },
  ];

  const createdSchools = [];
  for (const s of schoolsData) {
    const school = await prisma.school.upsert({
      where: { slug: s.slug },
      update: s,
      create: s,
    });
    createdSchools.push(school);
  }

  // Link school profile to DPS
  await prisma.schoolProfile.upsert({
    where: { userId: schoolUser.id },
    update: { schoolId: createdSchools[0].id, principalName: "Dr. A. Sharma", designation: "Principal" },
    create: {
      userId: schoolUser.id,
      schoolId: createdSchools[0].id,
      principalName: "Dr. A. Sharma",
      designation: "Principal",
    },
  });

  // 7. Franchise Profile
  const franchise = await prisma.franchiseProfile.upsert({
    where: { userId: franchiseUser.id },
    update: {
      businessName: "National Uniforms & Apparel NCR",
      ownerName: "Vikas Aggarwal",
      contactPhone: "+919876543213",
      address: "Shop 14-16, Central Market, Lajpat Nagar II",
      city: "New Delhi",
      state: "Delhi",
      gstNumber: "07AAACN1234F1Z8",
      serviceArea: "Delhi NCR, Noida, Gurugram",
      isVerified: true,
    },
    create: {
      userId: franchiseUser.id,
      businessName: "National Uniforms & Apparel NCR",
      ownerName: "Vikas Aggarwal",
      contactPhone: "+919876543213",
      address: "Shop 14-16, Central Market, Lajpat Nagar II",
      city: "New Delhi",
      state: "Delhi",
      gstNumber: "07AAACN1234F1Z8",
      serviceArea: "Delhi NCR, Noida, Gurugram",
      isVerified: true,
    },
  });

  // 8. Tailor Profiles
  await prisma.tailorProfile.upsert({
    where: { userId: tailorUser.id },
    update: {
      shopName: "Master Stitchers & Alterations Hub",
      tailorName: "Master Tailor Ramesh",
      phone: "+919876543214",
      address: "12, 1st Cross, Commercial Street",
      city: "Bengaluru",
      state: "Karnataka",
      skills: "Blazer Fitting, Waist Alteration, Sleeve Adjustments, Custom Trousers, Pattern Cutting",
      specializations: "Blazers, Shirts, Trousers",
      serviceArea: "Bengaluru Central, Koramangala, Indiranagar",
      approvalStatus: "APPROVED",
      isVerified: true,
      isAvailable: true,
      maxActiveOrders: 10,
    },
    create: {
      userId: tailorUser.id,
      shopName: "Master Stitchers & Alterations Hub",
      tailorName: "Master Tailor Ramesh",
      phone: "+919876543214",
      address: "12, 1st Cross, Commercial Street",
      city: "Bengaluru",
      state: "Karnataka",
      skills: "Blazer Fitting, Waist Alteration, Sleeve Adjustments, Custom Trousers, Pattern Cutting",
      specializations: "Blazers, Shirts, Trousers",
      serviceArea: "Bengaluru Central, Koramangala, Indiranagar",
      approvalStatus: "APPROVED",
      isVerified: true,
      isAvailable: true,
      maxActiveOrders: 10,
    },
  });

  await prisma.tailorProfile.upsert({
    where: { userId: tailorUser2.id },
    update: {
      shopName: "Royal Fit Uniform Tailors",
      tailorName: "Suresh Kumar",
      phone: "+919876543216",
      address: "44, 9th Main, Jayanagar 4th Block",
      city: "Bengaluru",
      state: "Karnataka",
      skills: "School Blazers, Pleated Skirts, Shirts & Trousers, Bespoke Uniforms",
      specializations: "Blazers, Shirts, Trousers, Skirts",
      serviceArea: "Bengaluru South, Jayanagar, BTM",
      approvalStatus: "APPROVED",
      isVerified: true,
      isAvailable: true,
      maxActiveOrders: 8,
    },
    create: {
      userId: tailorUser2.id,
      shopName: "Royal Fit Uniform Tailors",
      tailorName: "Suresh Kumar",
      phone: "+919876543216",
      address: "44, 9th Main, Jayanagar 4th Block",
      city: "Bengaluru",
      state: "Karnataka",
      skills: "School Blazers, Pleated Skirts, Shirts & Trousers, Bespoke Uniforms",
      specializations: "Blazers, Shirts, Trousers, Skirts",
      serviceArea: "Bengaluru South, Jayanagar, BTM",
      approvalStatus: "APPROVED",
      isVerified: true,
      isAvailable: true,
      maxActiveOrders: 8,
    },
  });

  // 9. Product Categories
  const categoriesData = [
    { name: "School Uniforms", slug: "school-uniforms", icon: "GraduationCap", sortOrder: 1 },
    { name: "College Uniforms", slug: "college-uniforms", icon: "BookOpen", sortOrder: 2 },
    { name: "Sports Uniforms", slug: "sports-uniforms", icon: "Activity", sortOrder: 3 },
    { name: "Shirts", slug: "shirts", icon: "Shirt", sortOrder: 4 },
    { name: "Trousers", slug: "trousers", icon: "Scissors", sortOrder: 5 },
    { name: "Skirts", slug: "skirts", icon: "Layers", sortOrder: 6 },
    { name: "T-shirts", slug: "t-shirts", icon: "Sparkles", sortOrder: 7 },
    { name: "Track Suits", slug: "track-suits", icon: "Flame", sortOrder: 8 },
    { name: "Blazers", slug: "blazers", icon: "Award", sortOrder: 9 },
    { name: "Sweaters", slug: "sweaters", icon: "CloudRain", sortOrder: 10 },
    { name: "Shoes", slug: "shoes", icon: "Footprints", sortOrder: 11 },
    { name: "Socks", slug: "socks", icon: "Box", sortOrder: 12 },
    { name: "Belts", slug: "belts", icon: "Circle", sortOrder: 13 },
    { name: "Ties", slug: "ties", icon: "Bookmark", sortOrder: 14 },
    { name: "School Bags", slug: "school-bags", icon: "Briefcase", sortOrder: 15 },
    { name: "Uniform Accessories", slug: "uniform-accessories", icon: "CheckCircle", sortOrder: 16 },
  ];

  const catMap = new Map<string, string>();
  for (const cat of categoriesData) {
    const c = await prisma.productCategory.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    catMap.set(cat.slug, c.id);
  }

  // 10. Products with Variants & Images
  const dpsSchool = createdSchools[0];
  const stXaviers = createdSchools[1];
  const kvSchool = createdSchools[2];

  const sampleProducts = [
    {
      name: "DPS Official Oxford Classic White Shirt",
      slug: "dps-official-oxford-classic-white-shirt",
      description: "Authorized Delhi Public School white uniform shirt tailored from high-durability 65/35 poly-cotton poplin blend with embroidered chest pocket logo.",
      categoryId: catMap.get("shirts")!,
      schoolId: dpsSchool.id,
      franchiseId: franchise.id,
      gender: "UNISEX",
      fabricDetails: "65% Polyester, 35% Combed Cotton. Wrinkle resistant, breathable finish.",
      careInstructions: "Machine wash warm, do not bleach, tumble dry medium, iron on cotton setting.",
      status: "APPROVED",
      isFeatured: true,
      allowTailoring: true,
      imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80",
      variants: [
        { sku: "DPS-SHT-28", size: "28", mrp: 550, sellingPrice: 475, stock: 45 },
        { sku: "DPS-SHT-30", size: "30", mrp: 550, sellingPrice: 475, stock: 50 },
        { sku: "DPS-SHT-32", size: "32", mrp: 590, sellingPrice: 499, stock: 60 },
        { sku: "DPS-SHT-34", size: "34", mrp: 620, sellingPrice: 525, stock: 40 },
        { sku: "DPS-SHT-36", size: "36", mrp: 650, sellingPrice: 550, stock: 35 },
      ],
    },
    {
      name: "DPS Pleated Navy Blue Uniform Skirt",
      slug: "dps-pleated-navy-blue-uniform-skirt",
      description: "Official box-pleated school skirt for DPS girl students. Engineered with adjustable inner elastic waistband and side zipper pocket.",
      categoryId: catMap.get("skirts")!,
      schoolId: dpsSchool.id,
      franchiseId: franchise.id,
      gender: "GIRLS",
      fabricDetails: "70% Terry-Rayon, 30% Polyester. Color-fast anti-pilling fabric.",
      careInstructions: "Gentle wash, line dry in shade, medium iron on pleats.",
      status: "APPROVED",
      isFeatured: true,
      allowTailoring: true,
      imageUrl: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=600&q=80",
      variants: [
        { sku: "DPS-SKT-24", size: "24", mrp: 650, sellingPrice: 560, stock: 30 },
        { sku: "DPS-SKT-26", size: "26", mrp: 650, sellingPrice: 560, stock: 35 },
        { sku: "DPS-SKT-28", size: "28", mrp: 699, sellingPrice: 599, stock: 40 },
        { sku: "DPS-SKT-30", size: "30", mrp: 720, sellingPrice: 620, stock: 25 },
      ],
    },
    {
      name: "DPS Formal Navy Blue School Trousers",
      slug: "dps-formal-navy-blue-school-trousers",
      description: "Tailored fit flat-front navy trousers with reinforced knees, deep pockets, and sturdy bar-tack stitching at stress points.",
      categoryId: catMap.get("trousers")!,
      schoolId: dpsSchool.id,
      franchiseId: franchise.id,
      gender: "BOYS",
      fabricDetails: "Poly-Viscose Suiting. Non-fading, soft drape, snag-resistant.",
      careInstructions: "Wash with similar dark colors, avoid direct sun exposure.",
      status: "APPROVED",
      isFeatured: true,
      allowTailoring: true,
      imageUrl: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80",
      variants: [
        { sku: "DPS-TRS-26", size: "26", mrp: 750, sellingPrice: 649, stock: 25 },
        { sku: "DPS-TRS-28", size: "28", mrp: 799, sellingPrice: 699, stock: 35 },
        { sku: "DPS-TRS-30", size: "30", mrp: 850, sellingPrice: 749, stock: 40 },
        { sku: "DPS-TRS-32", size: "32", mrp: 899, sellingPrice: 799, stock: 30 },
      ],
    },
    {
      name: "DPS Winter Navy Blazer with Crest Monogram",
      slug: "dps-winter-navy-blazer-crest",
      description: "Premium single-breasted winter uniform blazer lined with gold-embossed school coat of arms buttoning and heavy-duty chest badge.",
      categoryId: catMap.get("blazers")!,
      schoolId: dpsSchool.id,
      franchiseId: franchise.id,
      gender: "UNISEX",
      fabricDetails: "High-grade Woolen Blend with satin lining interior.",
      careInstructions: "Dry clean only recommended.",
      status: "APPROVED",
      isFeatured: true,
      allowTailoring: true,
      imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80",
      variants: [
        { sku: "DPS-BLZ-30", size: "30", mrp: 1850, sellingPrice: 1599, stock: 20 },
        { sku: "DPS-BLZ-32", size: "32", mrp: 1950, sellingPrice: 1699, stock: 25 },
        { sku: "DPS-BLZ-34", size: "34", mrp: 2100, sellingPrice: 1799, stock: 22 },
        { sku: "DPS-BLZ-36", size: "36", mrp: 2250, sellingPrice: 1899, stock: 15 },
      ],
    },
    {
      name: "St. Xavier's Classic Sky Blue Poplin Shirt",
      slug: "st-xaviers-sky-blue-poplin-shirt",
      description: "Traditional light blue uniform shirt with crisp collar, tailored sleeves, and St. Xavier's emblem crest.",
      categoryId: catMap.get("shirts")!,
      schoolId: stXaviers.id,
      franchiseId: franchise.id,
      gender: "UNISEX",
      fabricDetails: "100% Cotton poplin weave with skin-friendly finish.",
      careInstructions: "Gentle machine wash, medium starch for crisp look.",
      status: "APPROVED",
      isFeatured: false,
      allowTailoring: true,
      imageUrl: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=600&q=80",
      variants: [
        { sku: "STX-SHT-28", size: "28", mrp: 520, sellingPrice: 450, stock: 35 },
        { sku: "STX-SHT-30", size: "30", mrp: 550, sellingPrice: 480, stock: 40 },
        { sku: "STX-SHT-32", size: "32", mrp: 580, sellingPrice: 510, stock: 30 },
      ],
    },
    {
      name: "Kendriya Vidyalaya Checkered Tunic & Pinafore",
      slug: "kendriya-vidyalaya-checkered-tunic",
      description: "Official Kendriya Vidyalaya checkered tunic pinafore designed for all KV branches pan-India with front buttons and side buckle.",
      categoryId: catMap.get("school-uniforms")!,
      schoolId: kvSchool.id,
      franchiseId: franchise.id,
      gender: "GIRLS",
      fabricDetails: "Cotton polyester blend specially approved for KVS guidelines.",
      careInstructions: "Color safe detergent, wash inside out.",
      status: "APPROVED",
      isFeatured: true,
      allowTailoring: true,
      imageUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80",
      variants: [
        { sku: "KV-TNC-26", size: "26", mrp: 699, sellingPrice: 599, stock: 50 },
        { sku: "KV-TNC-28", size: "28", mrp: 749, sellingPrice: 649, stock: 60 },
        { sku: "KV-TNC-30", size: "30", mrp: 799, sellingPrice: 699, stock: 45 },
      ],
    },
    {
      name: "Ergonomic Multi-Pocket School Backpack (32L)",
      slug: "ergonomic-multi-pocket-school-backpack",
      description: "Universal high-capacity waterproof school backpack with cushioned shoulder straps, reflective safety strips, and laptop sleeve.",
      categoryId: catMap.get("school-bags")!,
      schoolId: null, // General uniform marketplace product
      franchiseId: franchise.id,
      gender: "UNISEX",
      fabricDetails: "Water-resistant 900D Oxford nylon with heavy-duty SBS zippers.",
      careInstructions: "Wipe with damp cloth.",
      status: "APPROVED",
      isFeatured: true,
      allowTailoring: false,
      imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
      variants: [
        { sku: "BAG-32L-NVY", size: "Free Size", color: "Navy Blue", mrp: 1499, sellingPrice: 999, stock: 80 },
        { sku: "BAG-32L-BLK", size: "Free Size", color: "Matte Black", mrp: 1499, sellingPrice: 999, stock: 65 },
      ],
    },
    {
      name: "All-Day Comfort School Uniform Black Shoes",
      slug: "all-day-comfort-school-uniform-black-shoes",
      description: "Non-marking TPR sole school uniform dress shoes with memory foam insole and genuine breathable synthetic upper.",
      categoryId: catMap.get("shoes")!,
      schoolId: null, // General marketplace item
      franchiseId: franchise.id,
      gender: "UNISEX",
      fabricDetails: "Polished faux leather, shock-absorbing cushioned heel.",
      careInstructions: "Clean with soft cloth and black shoe cream.",
      status: "APPROVED",
      isFeatured: true,
      allowTailoring: false,
      imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=80",
      variants: [
        { sku: "SHOE-BLK-04", size: "UK 4", color: "Black", mrp: 999, sellingPrice: 799, stock: 30 },
        { sku: "SHOE-BLK-05", size: "UK 5", color: "Black", mrp: 999, sellingPrice: 799, stock: 40 },
        { sku: "SHOE-BLK-06", size: "UK 6", color: "Black", mrp: 1099, sellingPrice: 849, stock: 50 },
        { sku: "SHOE-BLK-07", size: "UK 7", color: "Black", mrp: 1099, sellingPrice: 849, stock: 35 },
      ],
    },
    {
      name: "Official School Uniform House Sports T-Shirt",
      slug: "official-school-uniform-house-sports-t-shirt",
      description: "Breathable moisture-wicking quick-dry polyester jersey designed for inter-house sports competitions and Friday sports periods.",
      categoryId: catMap.get("t-shirts")!,
      schoolId: dpsSchool.id,
      franchiseId: franchise.id,
      gender: "UNISEX",
      fabricDetails: "100% Micro-polyester dry-fit honeycomb fabric.",
      careInstructions: "Machine wash cold, avoid ironing on printed logo.",
      status: "APPROVED",
      isFeatured: false,
      allowTailoring: false,
      imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
      variants: [
        { sku: "DPS-SPT-RED-S", size: "S", color: "Ruby Red", mrp: 450, sellingPrice: 380, stock: 30 },
        { sku: "DPS-SPT-BLU-M", size: "M", color: "Sapphire Blue", mrp: 450, sellingPrice: 380, stock: 30 },
        { sku: "DPS-SPT-GRN-L", size: "L", color: "Emerald Green", mrp: 450, sellingPrice: 380, stock: 30 },
        { sku: "DPS-SPT-YEL-M", size: "M", color: "Topaz Yellow", mrp: 450, sellingPrice: 380, stock: 30 },
      ],
    },
    {
      name: "Premium Elastic School Belt with Metal Crest Buckle",
      slug: "premium-elastic-school-belt-metal-buckle",
      description: "Durable woven nylon webbing belt with chrome-finish engraved metal buckle, suitable for daily school use.",
      categoryId: catMap.get("belts")!,
      schoolId: dpsSchool.id,
      franchiseId: franchise.id,
      gender: "UNISEX",
      fabricDetails: "High-tension polyester-cotton webbing, nickel-free alloy buckle.",
      careInstructions: "Spot clean with damp cloth.",
      status: "APPROVED",
      isFeatured: false,
      allowTailoring: false,
      imageUrl: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=600&q=80",
      variants: [
        { sku: "BLT-REG-NVY", size: "Adjustable 24-34 inch", color: "Navy/Maroon Stripe", mrp: 220, sellingPrice: 175, stock: 100 },
      ],
    },
  ];

  for (const item of sampleProducts) {
    const { variants, imageUrl, ...prodData } = item;
    const product = await prisma.product.upsert({
      where: { slug: prodData.slug },
      update: prodData,
      create: prodData,
    });

    // Images
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: imageUrl,
        altText: `${product.name} Front View`,
        sortOrder: 0,
        isPrimary: true,
        schoolId: product.schoolId,
      },
    });

    // Variants
    for (const v of variants) {
      await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: {
          mrp: v.mrp,
          sellingPrice: v.sellingPrice,
          stock: v.stock,
          size: v.size,
          color: v.color || null,
        },
        create: {
          productId: product.id,
          sku: v.sku,
          size: v.size,
          color: v.color || null,
          mrp: v.mrp,
          sellingPrice: v.sellingPrice,
          stock: v.stock,
          isAvailable: true,
        },
      });
    }

    // Link school product if schoolId exists
    if (product.schoolId) {
      await prisma.schoolProduct.upsert({
        where: {
          schoolId_productId: {
            schoolId: product.schoolId,
            productId: product.id,
          },
        },
        update: {},
        create: {
          schoolId: product.schoolId,
          productId: product.id,
          isMandatory: true,
          gradeLevel: "Classes 1 - 12",
        },
      });
    }
  }

  // 11. Custom Measurements
  const studentMeasurement = await prisma.customMeasurement.create({
    data: {
      userId: customerUser.id,
      studentName: "Aarav Verma",
      gender: "BOYS",
      chest: 28.5,
      waist: 26.0,
      shoulder: 13.5,
      sleeveLength: 18.0,
      shirtLength: 22.0,
      trouserLength: 32.0,
      hip: 29.0,
      notes: "Slightly slim fit, leave 1 inch margin at cuffs.",
    },
  });

  // 12. Sample Order & Tailoring Job
  const firstProduct = await prisma.product.findFirst({
    where: { slug: "dps-official-oxford-classic-white-shirt" },
    include: { variants: true, images: true },
  });

  const trouserProduct = await prisma.product.findFirst({
    where: { slug: "dps-formal-navy-blue-school-trousers" },
    include: { variants: true, images: true },
  });

  if (firstProduct && trouserProduct) {
    const v1 = firstProduct.variants[0];
    const v2 = trouserProduct.variants[0];

    const subtotal = v1.sellingPrice * 2 + v2.sellingPrice;
    const discount = 50.0;
    const deliveryFee = 0.0; // free delivery promo
    const taxAmount = Math.round(subtotal * 0.05);
    const totalAmount = subtotal - discount + deliveryFee + taxAmount;

    const sampleOrder = await prisma.order.upsert({
      where: { orderNumber: "UH-2026-90412" },
      update: {},
      create: {
        orderNumber: "UH-2026-90412",
        userId: customerUser.id,
        customerName: customerUser.name,
        customerEmail: customerUser.email,
        customerPhone: customerUser.phone || "+919876543215",
        shippingAddressJson: JSON.stringify(customerAddress),
        subtotal,
        discount,
        deliveryFee,
        taxAmount,
        totalAmount,
        status: "CONFIRMED",
        paymentMethod: "TEST_GATEWAY",
        paymentStatus: "PAID",
        paymentReference: "PAY_SIM_TXN_991823",
        trackingNumber: "UH-EXP-889123",
        courierPartner: "Blue Dart Express",
        notes: "Deliver before 5 PM on weekdays.",
        items: {
          create: [
            {
              productId: firstProduct.id,
              productName: firstProduct.name,
              variantId: v1.id,
              variantSku: v1.sku,
              size: v1.size,
              color: v1.color || "White",
              price: v1.sellingPrice,
              quantity: 2,
              subtotal: v1.sellingPrice * 2,
              productImageUrl: firstProduct.images[0]?.url,
              customMeasurementId: studentMeasurement.id,
            },
            {
              productId: trouserProduct.id,
              productName: trouserProduct.name,
              variantId: v2.id,
              variantSku: v2.sku,
              size: v2.size,
              color: v2.color || "Navy",
              price: v2.sellingPrice,
              quantity: 1,
              subtotal: v2.sellingPrice,
              productImageUrl: trouserProduct.images[0]?.url,
            },
          ],
        },
      },
      include: { items: true },
    });

    // Create or update Payment Record
    await prisma.payment.upsert({
      where: { transactionRef: "PAY_SIM_TXN_991823" },
      update: {
        orderId: sampleOrder.id,
        amount: totalAmount,
        status: "SUCCESS",
      },
      create: {
        orderId: sampleOrder.id,
        amount: totalAmount,
        currency: "INR",
        provider: "TEST_GATEWAY",
        transactionRef: "PAY_SIM_TXN_991823",
        status: "SUCCESS",
        signature: "sim_sig_88291040182",
      },
    });

    // Create Tailoring Job for the custom measured item
    const customItem = sampleOrder.items.find((i) => i.customMeasurementId);
    if (customItem) {
      const tailorProfile = await prisma.tailorProfile.findUnique({
        where: { userId: tailorUser.id },
      });

      await prisma.tailoringJob.upsert({
        where: { jobCode: "JOB-DPS-001" },
        update: {
          tailorId: tailorProfile?.id,
          status: "IN_PROGRESS",
          tailorNotes: "Sleeve adjustment +1 inch verified. Cutting begun.",
        },
        create: {
          jobCode: "JOB-DPS-001",
          orderId: sampleOrder.id,
          orderItemId: customItem.id,
          tailorId: tailorProfile?.id,
          status: "IN_PROGRESS",
          customerMeasurementId: studentMeasurement.id,
          tailorNotes: "Sleeve adjustment +1 inch verified. Cutting begun.",
        },
      });

      // Also create sample OrderAssignment for this order
      if (tailorProfile) {
        const existingAssignment = await prisma.orderAssignment.findFirst({
          where: { orderId: sampleOrder.id },
        });

        if (!existingAssignment) {
          await prisma.orderAssignment.create({
            data: {
              orderId: sampleOrder.id,
              tailorId: tailorProfile.id,
              assignedById: admin.id,
              assignmentMethod: "MANUAL",
              status: "ACCEPTED",
              expectedCompletionDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
              notes: "Initial seed assignment to Master Tailor Ramesh.",
              acceptedAt: new Date(),
            },
          });

          await prisma.assignmentHistory.create({
            data: {
              orderId: sampleOrder.id,
              newTailorId: tailorProfile.id,
              changedById: admin.id,
              action: "MANUALLY_ASSIGNED",
              reason: "Seeded initial demonstration assignment",
            },
          });

          await prisma.productionStatusHistory.create({
            data: {
              orderId: sampleOrder.id,
              previousStatus: "ASSIGNED",
              newStatus: "IN_PROGRESS",
              changedById: tailorUser.id,
              notes: "Tailor started cutting and assembling fabric",
            },
          });

          await prisma.order.update({
            where: { id: sampleOrder.id },
            data: {
              productionStatus: "IN_PROGRESS",
              priority: "NORMAL",
              expectedCompletionDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            },
          });

          await prisma.tailorProfile.update({
            where: { id: tailorProfile.id },
            data: { activeOrderCount: 1 },
          });
        }
      }
    }
  }

  // 13. Discount Coupons
  const coupons = [
    { code: "FIRST10", discountPercent: 10.0, minOrderAmount: 499.0, maxDiscount: 200.0, isActive: true },
    { code: "UNIFORM100", discountAmount: 100.0, minOrderAmount: 999.0, isActive: true },
    { code: "FREESHIP", discountAmount: 70.0, minOrderAmount: 799.0, isActive: true },
  ];

  for (const cp of coupons) {
    await prisma.coupon.upsert({
      where: { code: cp.code },
      update: cp,
      create: cp,
    });
  }

  // 14. Sample School Catalog Request
  const existingReq = await prisma.schoolCatalogRequest.findFirst({
    where: { schoolName: "The Heritage School, Vasant Kunj" },
  });
  if (!existingReq) {
    await prisma.schoolCatalogRequest.create({
      data: {
        schoolName: "The Heritage School, Vasant Kunj",
        city: "New Delhi",
        state: "Delhi",
        requesterName: "Meenakshi Sundaram",
        requesterRole: "PTA Representative",
        requesterEmail: "pta.heritage@gmail.com",
        requesterPhone: "+919811223344",
        uniformDescription: "Beige and brown checked shirts with dark chocolate brown formal trousers for senior students.",
        status: "PENDING",
      },
    });
  }

  // 15. Initial Audit Log
  await prisma.auditLog.create({
    data: {
      userId: superAdmin.id,
      userName: superAdmin.name,
      action: "PLATFORM_INITIALIZED",
      entityType: "System",
      entityId: "system-init",
      details: JSON.stringify({ message: "Uniform Hub initialized with official schools, catalogs and roles." }),
    },
  });

  console.log("✅ UNIFORM HUB Database Seed Completed Successfully!");
  console.log("====================================================");
  console.log("DEFAULT DEMO LOGINS:");
  console.log("1. Super Admin: superadmin@uniformhub.in / SuperAdmin@123");
  console.log("2. Admin:       admin@uniformhub.in / Admin@123");
  console.log("3. School:      dps.principal@uniformhub.in / School@123");
  console.log("4. Franchise:   franchise.delhi@uniformhub.in / Franchise@123");
  console.log("5. Tailor:      master.tailor@uniformhub.in / Tailor@123");
  console.log("6. Customer:    parent.rahul@uniformhub.in / Customer@123");
  console.log("====================================================");
}

main()
  .catch((e) => {
    console.error("❌ Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
