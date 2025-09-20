import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pinkblueberrysalon.com' },
    update: {},
    create: {
      email: 'admin@pinkblueberrysalon.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  })
  console.log('Created admin user:', admin.email)

  // Create staff users
  const staffPassword = await bcrypt.hash('staff123', 12)
  const staff1 = await prisma.user.upsert({
    where: { email: 'sarah@pinkblueberrysalon.com' },
    update: {},
    create: {
      email: 'sarah@pinkblueberrysalon.com',
      name: 'Sarah Johnson',
      password: staffPassword,
      role: 'STAFF',
    },
  })

  const staff2 = await prisma.user.upsert({
    where: { email: 'maria@pinkblueberrysalon.com' },
    update: {},
    create: {
      email: 'maria@pinkblueberrysalon.com',
      name: 'Maria Garcia',
      password: staffPassword,
      role: 'STAFF',
    },
  })
  console.log('Created staff users')

  // Create test customer
  const customerPassword = await bcrypt.hash('customer123', 12)
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      name: 'Jane Doe',
      password: customerPassword,
      role: 'CUSTOMER',
    },
  })
  console.log('Created test customer:', customer.email)

  // Create loyalty points for customer
  await prisma.loyaltyPoints.upsert({
    where: { userId: customer.id },
    update: {},
    create: {
      userId: customer.id,
      points: 150,
      tier: 'SILVER',
    },
  })

  // Create services
  const services = [
    {
      name: 'Luxury Hair Treatment',
      description: 'Deep conditioning treatment with premium products',
      price: 85,
      duration: 60,
      category: 'Hair Care',
    },
    {
      name: 'Signature Facial',
      description: 'Customized facial treatment for radiant skin',
      price: 120,
      duration: 75,
      category: 'Skincare',
    },
    {
      name: 'Gel Manicure & Pedicure',
      description: 'Long-lasting gel polish with nail art options',
      price: 95,
      duration: 90,
      category: 'Nails',
    },
    {
      name: 'Balayage Color',
      description: 'Hand-painted highlights for natural dimension',
      price: 180,
      duration: 180,
      category: 'Hair Color',
    },
    {
      name: 'Deep Tissue Massage',
      description: 'Therapeutic massage for tension relief',
      price: 110,
      duration: 60,
      category: 'Massage',
    },
    {
      name: 'Bridal Makeup',
      description: 'Professional makeup application for special events',
      price: 150,
      duration: 90,
      category: 'Makeup',
    },
  ]

  for (const service of services) {
    await prisma.service.upsert({
      where: {
        name_category: {
          name: service.name,
          category: service.category,
        },
      },
      update: {},
      create: service,
    })
  }
  console.log('Created services')

  // Create products
  const products = [
    {
      name: 'Luxury Hair Serum',
      description: 'Nourishing serum for silky smooth hair',
      price: 45,
      category: 'Hair Care',
      stock: 25,
    },
    {
      name: 'Vitamin C Face Cream',
      description: 'Brightening cream with vitamin C',
      price: 68,
      category: 'Skincare',
      stock: 30,
    },
    {
      name: 'Professional Nail Kit',
      description: 'Complete nail care set',
      price: 35,
      category: 'Nails',
      stock: 20,
    },
    {
      name: 'Organic Face Mask Set',
      description: 'Set of 5 organic face masks',
      price: 42,
      category: 'Skincare',
      stock: 15,
    },
    {
      name: 'Argan Oil Treatment',
      description: 'Pure argan oil for hair and skin',
      price: 58,
      category: 'Hair Care',
      stock: 18,
    },
    {
      name: 'Luxury Spa Robe',
      description: 'Plush spa-quality robe',
      price: 85,
      category: 'Accessories',
      stock: 10,
    },
    {
      name: 'Essential Oil Set',
      description: 'Collection of therapeutic essential oils',
      price: 75,
      category: 'Wellness',
      stock: 12,
    },
    {
      name: 'Professional Makeup Brushes',
      description: 'High-quality makeup brush set',
      price: 95,
      category: 'Makeup',
      stock: 8,
    },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: {
        name_category: {
          name: product.name,
          category: product.category,
        },
      },
      update: {},
      create: product,
    })
  }
  console.log('Created products')

  console.log('Database seed completed!')
  console.log('---')
  console.log('Test accounts:')
  console.log('Admin: admin@pinkblueberrysalon.com / admin123')
  console.log('Staff: sarah@pinkblueberrysalon.com / staff123')
  console.log('Customer: customer@example.com / customer123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })