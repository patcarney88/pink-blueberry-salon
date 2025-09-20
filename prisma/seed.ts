/**
 * Pink Blueberry Salon - Database Seed
 * Development and demo data for testing
 */

import { PrismaClient, UserRole, StaffStatus, ServicePricingType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Cleaning existing data...');
    await cleanDatabase();
  }

  // Create demo tenant
  console.log('🏢 Creating demo tenant...');
  const tenant = await createTenant();

  // Create permissions
  console.log('🔐 Creating permissions...');
  const permissions = await createPermissions();

  // Create roles
  console.log('👥 Creating roles...');
  const roles = await createRoles(tenant.id, permissions);

  // Create users
  console.log('👤 Creating users...');
  const users = await createUsers(tenant.id, roles);

  // Create salon and branches
  console.log('💇 Creating salon and branches...');
  const { salon, branches } = await createSalonAndBranches(tenant.id);

  // Create service categories and services
  console.log('✂️ Creating services...');
  const { categories, services } = await createServices(tenant.id);

  // Create customers
  console.log('🙋 Creating customers...');
  const customers = await createCustomers(tenant.id, users);

  // Create staff
  console.log('💼 Creating staff...');
  const staff = await createStaff(users, branches, services);

  // Create schedules
  console.log('📅 Creating schedules...');
  await createSchedules(staff, branches);

  // Create sample appointments
  console.log('📝 Creating appointments...');
  await createAppointments(branches, customers, staff, services);

  // Create products and inventory
  console.log('📦 Creating products and inventory...');
  const products = await createProducts(tenant.id);
  await createInventory(branches, products);

  // Create promotions and loyalty program
  console.log('🎁 Creating promotions and loyalty program...');
  await createPromotionsAndLoyalty(tenant.id, customers);

  // Create sample reviews
  console.log('⭐ Creating reviews...');
  await createReviews(branches, customers);

  console.log('✅ Database seed completed!');
  console.log('\n📝 Demo Credentials:');
  console.log('   Super Admin: admin@pinkblueberry.com / Admin123!');
  console.log('   Manager: manager@pinkblueberry.com / Manager123!');
  console.log('   Staff: staff@pinkblueberry.com / Staff123!');
  console.log('   Customer: customer@pinkblueberry.com / Customer123!');
}

async function cleanDatabase() {
  // Delete in reverse order of dependencies
  const tables = [
    'audit_logs',
    'notifications',
    'loyalty_transactions',
    'loyalty_points',
    'loyalty_programs',
    'promotion_usage',
    'promotion_services',
    'promotions',
    'campaigns',
    'reviews',
    'refunds',
    'invoices',
    'payments',
    'order_items',
    'orders',
    'inventory_movements',
    'inventory',
    'products',
    'appointment_add_ons',
    'appointment_services',
    'appointments',
    'time_off_requests',
    'time_slots',
    'schedules',
    'staff_services',
    'staff',
    'customers',
    'service_add_ons',
    'services',
    'service_categories',
    'working_hours',
    'branches',
    'salons',
    'user_permissions',
    'role_permissions',
    'user_roles',
    'permissions',
    'roles',
    'users',
    'tenants',
  ];

  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
  }
}

async function createTenant() {
  return prisma.tenant.create({
    data: {
      name: 'Pink Blueberry Demo',
      slug: 'pink-blueberry-demo',
      domain: 'demo.pinkblueberry.com',
      subscription_plan: 'enterprise',
      max_branches: 10,
      max_users: 100,
      settings: {
        features: {
          appointments: true,
          inventory: true,
          loyalty: true,
          marketing: true,
          analytics: true,
        },
        branding: {
          primaryColor: '#FF69B4',
          secondaryColor: '#4169E1',
        },
      },
    },
  });
}

async function createPermissions() {
  const resources = [
    'appointment',
    'customer',
    'staff',
    'service',
    'product',
    'inventory',
    'payment',
    'report',
    'settings',
    'user',
    'role',
  ];

  const permissions = [];

  for (const resource of resources) {
    for (const action of ['READ', 'WRITE', 'DELETE', 'MANAGE']) {
      const permission = await prisma.permission.create({
        data: {
          resource,
          action: action as any,
          description: `${action} access for ${resource}`,
        },
      });
      permissions.push(permission);
    }
  }

  return permissions;
}

async function createRoles(tenantId: string, permissions: any[]) {
  const roles: Record<string, any> = {};

  // Super Admin - all permissions
  roles.superAdmin = await prisma.role.create({
    data: {
      tenant_id: tenantId,
      name: 'Super Admin',
      description: 'Full system access',
      is_system: true,
      permissions: {
        create: permissions.map((p) => ({
          permission_id: p.id,
        })),
      },
    },
  });

  // Manager - most permissions except system settings
  const managerPermissions = permissions.filter(
    (p) => !['user', 'role'].includes(p.resource) || p.action === 'READ'
  );
  roles.manager = await prisma.role.create({
    data: {
      tenant_id: tenantId,
      name: 'Manager',
      description: 'Branch management access',
      permissions: {
        create: managerPermissions.map((p) => ({
          permission_id: p.id,
        })),
      },
    },
  });

  // Staff - limited permissions
  const staffPermissions = permissions.filter(
    (p) =>
      ['appointment', 'customer', 'service'].includes(p.resource) &&
      ['READ', 'WRITE'].includes(p.action)
  );
  roles.staff = await prisma.role.create({
    data: {
      tenant_id: tenantId,
      name: 'Staff',
      description: 'Staff member access',
      permissions: {
        create: staffPermissions.map((p) => ({
          permission_id: p.id,
        })),
      },
    },
  });

  // Customer - minimal permissions
  const customerPermissions = permissions.filter(
    (p) => ['appointment', 'service'].includes(p.resource) && p.action === 'READ'
  );
  roles.customer = await prisma.role.create({
    data: {
      tenant_id: tenantId,
      name: 'Customer',
      description: 'Customer access',
      permissions: {
        create: customerPermissions.map((p) => ({
          permission_id: p.id,
        })),
      },
    },
  });

  return roles;
}

async function createUsers(tenantId: string, roles: any) {
  const users: Record<string, any> = {};

  // Super Admin
  users.admin = await prisma.user.create({
    data: {
      tenant_id: tenantId,
      email: 'admin@pinkblueberry.com',
      password_hash: await bcrypt.hash('Admin123!', 12),
      first_name: 'Admin',
      last_name: 'User',
      phone: '+1234567890',
      email_verified: true,
      user_roles: {
        create: {
          role_id: roles.superAdmin.id,
        },
      },
    },
  });

  // Manager
  users.manager = await prisma.user.create({
    data: {
      tenant_id: tenantId,
      email: 'manager@pinkblueberry.com',
      password_hash: await bcrypt.hash('Manager123!', 12),
      first_name: 'Sarah',
      last_name: 'Johnson',
      phone: '+1234567891',
      email_verified: true,
      user_roles: {
        create: {
          role_id: roles.manager.id,
        },
      },
    },
  });

  // Staff members
  const staffMembers = [
    { first_name: 'Emma', last_name: 'Wilson', email: 'staff@pinkblueberry.com' },
    { first_name: 'Olivia', last_name: 'Brown', email: 'olivia@pinkblueberry.com' },
    { first_name: 'Sophia', last_name: 'Davis', email: 'sophia@pinkblueberry.com' },
    { first_name: 'Isabella', last_name: 'Miller', email: 'isabella@pinkblueberry.com' },
  ];

  for (const member of staffMembers) {
    const user = await prisma.user.create({
      data: {
        tenant_id: tenantId,
        email: member.email,
        password_hash: await bcrypt.hash('Staff123!', 12),
        first_name: member.first_name,
        last_name: member.last_name,
        phone: '+1234567892',
        email_verified: true,
        user_roles: {
          create: {
            role_id: roles.staff.id,
          },
        },
      },
    });
    users[member.email] = user;
  }

  // Customer
  users.customer = await prisma.user.create({
    data: {
      tenant_id: tenantId,
      email: 'customer@pinkblueberry.com',
      password_hash: await bcrypt.hash('Customer123!', 12),
      first_name: 'Jane',
      last_name: 'Smith',
      phone: '+1234567893',
      email_verified: true,
      user_roles: {
        create: {
          role_id: roles.customer.id,
        },
      },
    },
  });

  return users;
}

async function createSalonAndBranches(tenantId: string) {
  const salon = await prisma.salon.create({
    data: {
      tenant_id: tenantId,
      name: 'Pink Blueberry Salon',
      description: 'Premium beauty and wellness services',
      email: 'info@pinkblueberry.com',
      phone: '+1234567890',
      website: 'https://pinkblueberry.com',
      currency: 'USD',
      timezone: 'America/New_York',
      settings: {
        bookingRules: {
          requireDeposit: false,
          cancellationHours: 24,
          maxAdvanceBooking: 90,
        },
      },
    },
  });

  const branches = [];

  // Main Branch
  const mainBranch = await prisma.branch.create({
    data: {
      salon_id: salon.id,
      name: 'Pink Blueberry - Downtown',
      slug: 'downtown',
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      postal_code: '10001',
      latitude: 40.7128,
      longitude: -74.0060,
      phone: '+1234567890',
      email: 'downtown@pinkblueberry.com',
      opening_time: '09:00',
      closing_time: '20:00',
      time_slot_duration: 30,
      working_hours: {
        create: [
          { day_of_week: 'MONDAY', opening_time: '09:00', closing_time: '20:00' },
          { day_of_week: 'TUESDAY', opening_time: '09:00', closing_time: '20:00' },
          { day_of_week: 'WEDNESDAY', opening_time: '09:00', closing_time: '20:00' },
          { day_of_week: 'THURSDAY', opening_time: '09:00', closing_time: '20:00' },
          { day_of_week: 'FRIDAY', opening_time: '09:00', closing_time: '21:00' },
          { day_of_week: 'SATURDAY', opening_time: '10:00', closing_time: '21:00' },
          { day_of_week: 'SUNDAY', opening_time: '11:00', closing_time: '18:00' },
        ],
      },
    },
  });
  branches.push(mainBranch);

  // Second Branch
  const uptownBranch = await prisma.branch.create({
    data: {
      salon_id: salon.id,
      name: 'Pink Blueberry - Uptown',
      slug: 'uptown',
      address: '456 Park Avenue',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      postal_code: '10021',
      latitude: 40.7689,
      longitude: -73.9642,
      phone: '+1234567891',
      email: 'uptown@pinkblueberry.com',
      opening_time: '10:00',
      closing_time: '19:00',
      time_slot_duration: 30,
      working_hours: {
        create: [
          { day_of_week: 'MONDAY', opening_time: '10:00', closing_time: '19:00' },
          { day_of_week: 'TUESDAY', opening_time: '10:00', closing_time: '19:00' },
          { day_of_week: 'WEDNESDAY', opening_time: '10:00', closing_time: '19:00' },
          { day_of_week: 'THURSDAY', opening_time: '10:00', closing_time: '19:00' },
          { day_of_week: 'FRIDAY', opening_time: '10:00', closing_time: '20:00' },
          { day_of_week: 'SATURDAY', opening_time: '10:00', closing_time: '20:00' },
          { day_of_week: 'SUNDAY', is_closed: true, opening_time: '00:00', closing_time: '00:00' },
        ],
      },
    },
  });
  branches.push(uptownBranch);

  return { salon, branches };
}

async function createServices(tenantId: string) {
  const categories: Record<string, any> = {};

  // Hair Services
  categories.hair = await prisma.serviceCategory.create({
    data: {
      tenant_id: tenantId,
      name: 'Hair Services',
      slug: 'hair-services',
      description: 'Professional hair care and styling',
      display_order: 1,
    },
  });

  // Nail Services
  categories.nails = await prisma.serviceCategory.create({
    data: {
      tenant_id: tenantId,
      name: 'Nail Services',
      slug: 'nail-services',
      description: 'Manicure and pedicure services',
      display_order: 2,
    },
  });

  // Spa Services
  categories.spa = await prisma.serviceCategory.create({
    data: {
      tenant_id: tenantId,
      name: 'Spa Services',
      slug: 'spa-services',
      description: 'Relaxing spa treatments',
      display_order: 3,
    },
  });

  // Makeup Services
  categories.makeup = await prisma.serviceCategory.create({
    data: {
      tenant_id: tenantId,
      name: 'Makeup Services',
      slug: 'makeup-services',
      description: 'Professional makeup application',
      display_order: 4,
    },
  });

  const services: any[] = [];

  // Hair Services
  const hairServices = [
    { name: 'Haircut & Style', duration: 60, price: 75, description: 'Professional haircut and styling' },
    { name: 'Hair Color', duration: 120, price: 150, description: 'Full hair coloring service' },
    { name: 'Highlights', duration: 180, price: 200, description: 'Professional highlights' },
    { name: 'Hair Treatment', duration: 45, price: 80, description: 'Deep conditioning treatment' },
    { name: 'Blowout', duration: 45, price: 60, description: 'Professional blowout styling' },
  ];

  for (const service of hairServices) {
    const created = await prisma.service.create({
      data: {
        tenant_id: tenantId,
        category_id: categories.hair.id,
        name: service.name,
        slug: service.name.toLowerCase().replace(/ /g, '-'),
        description: service.description,
        duration: service.duration,
        price: service.price,
        pricing_type: ServicePricingType.FIXED,
        buffer_time: 15,
        service_add_ons: {
          create: [
            { name: 'Express Service', price: 20, duration: -15 },
            { name: 'Extra Length', price: 25, duration: 15 },
          ],
        },
      },
    });
    services.push(created);
  }

  // Nail Services
  const nailServices = [
    { name: 'Classic Manicure', duration: 30, price: 35, description: 'Traditional manicure' },
    { name: 'Gel Manicure', duration: 45, price: 55, description: 'Long-lasting gel polish' },
    { name: 'Classic Pedicure', duration: 45, price: 45, description: 'Traditional pedicure' },
    { name: 'Spa Pedicure', duration: 60, price: 65, description: 'Luxury spa pedicure' },
    { name: 'Nail Art', duration: 30, price: 25, description: 'Custom nail art design' },
  ];

  for (const service of nailServices) {
    const created = await prisma.service.create({
      data: {
        tenant_id: tenantId,
        category_id: categories.nails.id,
        name: service.name,
        slug: service.name.toLowerCase().replace(/ /g, '-'),
        description: service.description,
        duration: service.duration,
        price: service.price,
        pricing_type: ServicePricingType.FIXED,
        buffer_time: 10,
      },
    });
    services.push(created);
  }

  // Spa Services
  const spaServices = [
    { name: 'Swedish Massage', duration: 60, price: 120, description: 'Relaxing full body massage' },
    { name: 'Deep Tissue Massage', duration: 60, price: 140, description: 'Therapeutic deep tissue work' },
    { name: 'Facial Treatment', duration: 75, price: 110, description: 'Customized facial treatment' },
    { name: 'Body Wrap', duration: 90, price: 150, description: 'Detoxifying body wrap' },
  ];

  for (const service of spaServices) {
    const created = await prisma.service.create({
      data: {
        tenant_id: tenantId,
        category_id: categories.spa.id,
        name: service.name,
        slug: service.name.toLowerCase().replace(/ /g, '-'),
        description: service.description,
        duration: service.duration,
        price: service.price,
        pricing_type: ServicePricingType.FIXED,
        buffer_time: 15,
        requires_deposit: true,
        deposit_amount: 50,
      },
    });
    services.push(created);
  }

  // Makeup Services
  const makeupServices = [
    { name: 'Makeup Application', duration: 60, price: 85, description: 'Professional makeup application' },
    { name: 'Bridal Makeup', duration: 90, price: 200, description: 'Special occasion bridal makeup' },
    { name: 'Makeup Lesson', duration: 90, price: 150, description: 'Personal makeup tutorial' },
  ];

  for (const service of makeupServices) {
    const created = await prisma.service.create({
      data: {
        tenant_id: tenantId,
        category_id: categories.makeup.id,
        name: service.name,
        slug: service.name.toLowerCase().replace(/ /g, '-'),
        description: service.description,
        duration: service.duration,
        price: service.price,
        pricing_type: ServicePricingType.FIXED,
        buffer_time: 15,
      },
    });
    services.push(created);
  }

  return { categories, services };
}

async function createCustomers(tenantId: string, users: any) {
  const customers = [];

  // Create customer for existing user
  const customer1 = await prisma.customer.create({
    data: {
      tenant_id: tenantId,
      user_id: users.customer.id,
      email: users.customer.email,
      first_name: users.customer.first_name,
      last_name: users.customer.last_name,
      phone: users.customer.phone,
      date_of_birth: new Date('1990-05-15'),
      gender: 'Female',
      address: '789 Customer Lane',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      postal_code: '10002',
      accepts_marketing: true,
      referral_code: 'JANE2024',
      is_vip: true,
      tags: ['regular', 'vip', 'referrer'],
    },
  });
  customers.push(customer1);

  // Create additional customers without user accounts
  const additionalCustomers = [
    {
      first_name: 'Alice',
      last_name: 'Anderson',
      email: 'alice@example.com',
      phone: '+1234567894',
      tags: ['new'],
    },
    {
      first_name: 'Bob',
      last_name: 'Brown',
      email: 'bob@example.com',
      phone: '+1234567895',
      tags: ['regular'],
    },
    {
      first_name: 'Carol',
      last_name: 'Clark',
      email: 'carol@example.com',
      phone: '+1234567896',
      tags: ['occasional'],
    },
    {
      first_name: 'David',
      last_name: 'Davis',
      email: 'david@example.com',
      phone: '+1234567897',
      tags: ['vip'],
    },
  ];

  for (const customerData of additionalCustomers) {
    const customer = await prisma.customer.create({
      data: {
        tenant_id: tenantId,
        ...customerData,
        accepts_marketing: Math.random() > 0.3,
        referral_code: `${customerData.first_name.toUpperCase()}2024`,
      },
    });
    customers.push(customer);
  }

  return customers;
}

async function createStaff(users: any, branches: any[], services: any[]) {
  const staff = [];

  // Create staff for existing users
  const staffData = [
    {
      user: users['staff@pinkblueberry.com'],
      branch: branches[0],
      title: 'Senior Stylist',
      specializations: ['Hair Color', 'Styling'],
      commission_rate: 40,
      color_code: '#FF69B4',
    },
    {
      user: users['olivia@pinkblueberry.com'],
      branch: branches[0],
      title: 'Nail Technician',
      specializations: ['Manicure', 'Pedicure', 'Nail Art'],
      commission_rate: 35,
      color_code: '#9370DB',
    },
    {
      user: users['sophia@pinkblueberry.com'],
      branch: branches[0],
      title: 'Massage Therapist',
      specializations: ['Swedish', 'Deep Tissue'],
      commission_rate: 45,
      color_code: '#4169E1',
    },
    {
      user: users['isabella@pinkblueberry.com'],
      branch: branches[1],
      title: 'Makeup Artist',
      specializations: ['Bridal', 'Special Events'],
      commission_rate: 40,
      color_code: '#FF1493',
    },
  ];

  for (const data of staffData) {
    const staffMember = await prisma.staff.create({
      data: {
        user_id: data.user.id,
        branch_id: data.branch.id,
        employee_id: `EMP${Math.floor(Math.random() * 10000)}`,
        title: data.title,
        bio: `Professional ${data.title} with years of experience`,
        specializations: data.specializations,
        commission_rate: data.commission_rate,
        status: StaffStatus.ACTIVE,
        hire_date: new Date('2022-01-01'),
        color_code: data.color_code,
        booking_enabled: true,
        online_booking: true,
      },
    });

    // Assign services to staff
    const relevantServices = services.filter((s: any) =>
      data.specializations.some((spec: string) =>
        s.name.toLowerCase().includes(spec.toLowerCase())
      )
    );

    for (const service of relevantServices.slice(0, 5)) {
      await prisma.staffService.create({
        data: {
          staff_id: staffMember.id,
          service_id: service.id,
          is_available: true,
        },
      });
    }

    staff.push(staffMember);
  }

  return staff;
}

async function createSchedules(staff: any[], branches: any[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const staffMember of staff) {
    // Create schedules for the next 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Skip Sundays for some staff
      if (dayOfWeek === 0 && Math.random() > 0.5) continue;

      await prisma.schedule.create({
        data: {
          staff_id: staffMember.id,
          branch_id: staffMember.branch_id,
          date: date,
          start_time: isWeekend ? '10:00' : '09:00',
          end_time: isWeekend ? '18:00' : '19:00',
          break_start: '13:00',
          break_end: '14:00',
          is_available: true,
        },
      });
    }
  }
}

async function createAppointments(branches: any[], customers: any[], staff: any[], services: any[]) {
  const today = new Date();
  const appointments = [];

  for (let i = 0; i < 20; i++) {
    const branch = branches[Math.floor(Math.random() * branches.length)];
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const staffMember = staff.filter((s: any) => s.branch_id === branch.id)[
      Math.floor(Math.random() * staff.filter((s: any) => s.branch_id === branch.id).length)
    ];

    if (!staffMember) continue;

    const service = services[Math.floor(Math.random() * services.length)];
    const appointmentDate = new Date(today);
    appointmentDate.setDate(today.getDate() + Math.floor(Math.random() * 14)); // Next 2 weeks

    const hour = 9 + Math.floor(Math.random() * 8); // 9 AM to 5 PM
    const startTime = new Date(appointmentDate);
    startTime.setHours(hour, Math.random() > 0.5 ? 0 : 30, 0, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(startTime.getMinutes() + service.duration);

    const totalPrice = Number(service.price);
    const taxAmount = totalPrice * 0.08; // 8% tax
    const finalPrice = totalPrice + taxAmount;

    const appointment = await prisma.appointment.create({
      data: {
        branch_id: branch.id,
        customer_id: customer.id,
        staff_id: staffMember.id,
        appointment_date: appointmentDate,
        start_time: startTime,
        end_time: endTime,
        status: i < 10 ? 'COMPLETED' : i < 15 ? 'CONFIRMED' : 'PENDING',
        total_duration: service.duration,
        total_price: totalPrice,
        tax_amount: taxAmount,
        final_price: finalPrice,
        confirmation_code: `APT${Date.now()}${i}`,
        source: Math.random() > 0.5 ? 'ONLINE' : 'PHONE',
        services: {
          create: {
            service_id: service.id,
            price: service.price,
            duration: service.duration,
          },
        },
      },
    });

    appointments.push(appointment);
  }

  return appointments;
}

async function createProducts(tenantId: string) {
  const products = [];

  const productData = [
    // Hair Products
    { name: 'Professional Shampoo', category: 'Hair Care', cost: 12, retail: 25, min_stock: 10 },
    { name: 'Deep Conditioner', category: 'Hair Care', cost: 15, retail: 32, min_stock: 8 },
    { name: 'Hair Serum', category: 'Hair Care', cost: 18, retail: 45, min_stock: 5 },
    { name: 'Styling Gel', category: 'Hair Styling', cost: 8, retail: 18, min_stock: 12 },
    { name: 'Hair Spray', category: 'Hair Styling', cost: 10, retail: 22, min_stock: 10 },

    // Nail Products
    { name: 'Nail Polish - Red', category: 'Nail Care', cost: 5, retail: 12, min_stock: 20 },
    { name: 'Nail Polish - Pink', category: 'Nail Care', cost: 5, retail: 12, min_stock: 20 },
    { name: 'Base Coat', category: 'Nail Care', cost: 4, retail: 10, min_stock: 15 },
    { name: 'Top Coat', category: 'Nail Care', cost: 4, retail: 10, min_stock: 15 },
    { name: 'Cuticle Oil', category: 'Nail Care', cost: 6, retail: 15, min_stock: 10 },

    // Spa Products
    { name: 'Massage Oil', category: 'Spa', cost: 20, retail: 45, min_stock: 5 },
    { name: 'Face Mask', category: 'Spa', cost: 8, retail: 20, min_stock: 10 },
    { name: 'Body Scrub', category: 'Spa', cost: 12, retail: 28, min_stock: 8 },
    { name: 'Aromatherapy Candle', category: 'Spa', cost: 10, retail: 25, min_stock: 6 },

    // Makeup Products
    { name: 'Foundation', category: 'Makeup', cost: 25, retail: 55, min_stock: 5 },
    { name: 'Lipstick', category: 'Makeup', cost: 12, retail: 28, min_stock: 10 },
    { name: 'Mascara', category: 'Makeup', cost: 15, retail: 35, min_stock: 8 },
    { name: 'Eyeshadow Palette', category: 'Makeup', cost: 30, retail: 65, min_stock: 4 },
  ];

  for (const data of productData) {
    const product = await prisma.product.create({
      data: {
        tenant_id: tenantId,
        sku: `SKU${Date.now()}${Math.floor(Math.random() * 1000)}`,
        name: data.name,
        category: data.category,
        brand: 'Pink Blueberry Professional',
        cost_price: data.cost,
        retail_price: data.retail,
        min_stock_level: data.min_stock,
        reorder_point: data.min_stock * 2,
        reorder_quantity: data.min_stock * 3,
        is_active: true,
        is_sellable: true,
        track_inventory: true,
      },
    });
    products.push(product);
  }

  return products;
}

async function createInventory(branches: any[], products: any[]) {
  for (const branch of branches) {
    for (const product of products) {
      const initialQuantity = Math.floor(Math.random() * 50) + 10;

      await prisma.inventory.create({
        data: {
          branch_id: branch.id,
          product_id: product.id,
          quantity_on_hand: initialQuantity,
          quantity_available: initialQuantity,
          last_restock_date: new Date(),
        },
      });
    }
  }
}

async function createPromotionsAndLoyalty(tenantId: string, customers: any[]) {
  // Create loyalty program
  const loyaltyProgram = await prisma.loyaltyProgram.create({
    data: {
      tenant_id: tenantId,
      name: 'Pink Blueberry Rewards',
      description: 'Earn points on every visit and redeem for free services',
      points_per_dollar: 1,
      points_value: 0.01, // 1 point = $0.01
      tier_benefits: {
        bronze: { min_points: 0, multiplier: 1, perks: ['Birthday discount'] },
        silver: { min_points: 500, multiplier: 1.5, perks: ['Birthday discount', 'Priority booking'] },
        gold: { min_points: 1000, multiplier: 2, perks: ['Birthday discount', 'Priority booking', 'Free upgrades'] },
      },
      is_active: true,
    },
  });

  // Assign loyalty points to customers
  for (const customer of customers) {
    const points = Math.floor(Math.random() * 1500);
    await prisma.loyaltyPoints.create({
      data: {
        customer_id: customer.id,
        program_id: loyaltyProgram.id,
        current_points: points,
        lifetime_points: points,
        tier: points >= 1000 ? 'GOLD' : points >= 500 ? 'SILVER' : 'BRONZE',
      },
    });
  }

  // Create promotions
  const promotions = [
    {
      code: 'WELCOME20',
      name: 'Welcome Offer',
      description: 'Get 20% off your first visit',
      type: 'PERCENTAGE' as any,
      value: 20,
      valid_from: new Date(),
      valid_to: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      usage_limit: 100,
      per_customer_limit: 1,
    },
    {
      code: 'SUMMER15',
      name: 'Summer Special',
      description: '15% off all services',
      type: 'PERCENTAGE' as any,
      value: 15,
      valid_from: new Date(),
      valid_to: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      usage_limit: 200,
    },
    {
      code: 'HAIRCARE50',
      name: 'Hair Care Bundle',
      description: '$50 off hair color + treatment combo',
      type: 'FIXED_AMOUNT' as any,
      value: 50,
      min_purchase: 200,
      valid_from: new Date(),
      valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  ];

  for (const promo of promotions) {
    await prisma.promotion.create({ data: promo });
  }
}

async function createReviews(branches: any[], customers: any[]) {
  const reviewTexts = [
    { rating: 5, title: 'Amazing experience!', comment: 'The staff was professional and the service was excellent.' },
    { rating: 5, title: 'Best salon in town', comment: 'I love coming here. Always leave feeling beautiful!' },
    { rating: 4, title: 'Great service', comment: 'Good service but a bit pricey. Overall satisfied.' },
    { rating: 5, title: 'Highly recommend', comment: 'Professional staff and clean environment. Will definitely return.' },
    { rating: 4, title: 'Good experience', comment: 'Nice ambiance and friendly staff. Slightly long wait time.' },
  ];

  for (const branch of branches) {
    for (let i = 0; i < 5; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const review = reviewTexts[i % reviewTexts.length];

      await prisma.review.create({
        data: {
          branch_id: branch.id,
          customer_id: customer.id,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          is_verified: true,
          is_featured: review.rating === 5 && Math.random() > 0.5,
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });