import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pinkblueberrysalon.com' },
    update: {},
    create: {
      email: 'admin@pinkblueberrysalon.com',
      name: 'Admin User',
      hashedPassword: adminPassword,
      role: 'ADMIN',
      phone: '(407) 574-9525',
    },
  })
  console.log('👤 Created admin user:', admin.email)

  // Create staff users
  const staffPassword = await bcrypt.hash('staff123', 12)
  const staff1 = await prisma.user.upsert({
    where: { email: 'sarah@pinkblueberrysalon.com' },
    update: {},
    create: {
      email: 'sarah@pinkblueberrysalon.com',
      name: 'Sarah Johnson',
      hashedPassword: staffPassword,
      role: 'STAFF',
      phone: '(407) 574-9526',
    },
  })

  const staff2 = await prisma.user.upsert({
    where: { email: 'maria@pinkblueberrysalon.com' },
    update: {},
    create: {
      email: 'maria@pinkblueberrysalon.com',
      name: 'Maria Garcia',
      hashedPassword: staffPassword,
      role: 'STAFF',
      phone: '(407) 574-9527',
    },
  })
  console.log('👩‍💼 Created staff users')

  // Create test customer
  const customerPassword = await bcrypt.hash('customer123', 12)
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      name: 'Jane Doe',
      hashedPassword: customerPassword,
      role: 'CUSTOMER',
      phone: '(407) 555-0123',
    },
  })
  console.log('👨‍💼 Created test customer:', customer.email)

  // Create services
  const services = [
    {
      name: 'Luxury Hair Treatment',
      description: 'Deep conditioning treatment with premium products',
      price: 85.00,
      duration: 60,
      category: 'Hair Care',
    },
    {
      name: 'Signature Facial',
      description: 'Customized facial treatment for radiant skin',
      price: 120.00,
      duration: 75,
      category: 'Skincare',
    },
    {
      name: 'Gel Manicure & Pedicure',
      description: 'Long-lasting gel polish with nail art options',
      price: 95.00,
      duration: 90,
      category: 'Nails',
    },
    {
      name: 'Balayage Color',
      description: 'Hand-painted highlights for natural dimension',
      price: 180.00,
      duration: 180,
      category: 'Hair Color',
    },
    {
      name: 'Deep Tissue Massage',
      description: 'Therapeutic massage for tension relief',
      price: 110.00,
      duration: 60,
      category: 'Massage',
    },
    {
      name: 'Bridal Makeup',
      description: 'Professional makeup application for special events',
      price: 150.00,
      duration: 90,
      category: 'Makeup',
    },
  ]

  for (const service of services) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: service,
      create: service,
    })
  }
  console.log('💄 Created services')

  // Create products
  const products = [
    {
      name: 'Luxury Hair Serum',
      description: 'Nourishing serum for silky smooth hair',
      price: 45.00,
      category: 'Hair Care',
      stock: 25,
      imageUrl: '/products/hair-serum.jpg',
    },
    {
      name: 'Vitamin C Face Cream',
      description: 'Brightening cream with vitamin C',
      price: 68.00,
      category: 'Skincare',
      stock: 30,
      imageUrl: '/products/vitamin-c-cream.jpg',
    },
    {
      name: 'Professional Nail Kit',
      description: 'Complete nail care set',
      price: 35.00,
      category: 'Nails',
      stock: 20,
      imageUrl: '/products/nail-kit.jpg',
    },
    {
      name: 'Organic Face Mask Set',
      description: 'Set of 5 organic face masks',
      price: 42.00,
      category: 'Skincare',
      stock: 15,
      imageUrl: '/products/face-mask-set.jpg',
    },
    {
      name: 'Argan Oil Treatment',
      description: 'Pure argan oil for hair and skin',
      price: 58.00,
      category: 'Hair Care',
      stock: 18,
      imageUrl: '/products/argan-oil.jpg',
    },
    {
      name: 'Luxury Spa Robe',
      description: 'Plush spa-quality robe',
      price: 85.00,
      category: 'Accessories',
      stock: 10,
      imageUrl: '/products/spa-robe.jpg',
    },
    {
      name: 'Essential Oil Set',
      description: 'Collection of therapeutic essential oils',
      price: 75.00,
      category: 'Wellness',
      stock: 12,
      imageUrl: '/products/essential-oils.jpg',
    },
    {
      name: 'Professional Makeup Brushes',
      description: 'High-quality makeup brush set',
      price: 95.00,
      category: 'Makeup',
      stock: 8,
      imageUrl: '/products/makeup-brushes.jpg',
    },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { name: product.name },
      update: product,
      create: product,
    })
  }
  console.log('🛍️ Created products')

  // Create sample appointments
  const appointmentDate = new Date()
  appointmentDate.setDate(appointmentDate.getDate() + 1) // Tomorrow

  await prisma.appointment.create({
    data: {
      customerId: customer.id,
      serviceId: (await prisma.service.findFirst({ where: { name: 'Signature Facial' } }))!.id,
      staffId: staff1.id,
      date: appointmentDate,
      status: 'CONFIRMED',
      notes: 'First-time customer'
    }
  })
  console.log('📅 Created sample appointment')

  // Create sample order
  const order = await prisma.order.create({
    data: {
      userId: customer.id,
      total: 113.00,
      status: 'PROCESSING',
      items: {
        create: [
          {
            productId: (await prisma.product.findFirst({ where: { name: 'Luxury Hair Serum' } }))!.id,
            quantity: 1,
            price: 45.00
          },
          {
            productId: (await prisma.product.findFirst({ where: { name: 'Vitamin C Face Cream' } }))!.id,
            quantity: 1,
            price: 68.00
          }
        ]
      }
    }
  })
  console.log('🛒 Created sample order:', order.id)

  console.log('✅ Database seeding completed successfully!')
  console.log('---')
  console.log('🔐 Test accounts:')
  console.log('👤 Admin: admin@pinkblueberrysalon.com / admin123')
  console.log('👩‍💼 Staff: sarah@pinkblueberrysalon.com / staff123')
  console.log('👩‍💼 Staff: maria@pinkblueberrysalon.com / staff123')
  console.log('👨‍💼 Customer: customer@example.com / customer123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })