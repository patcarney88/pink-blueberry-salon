import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Product creation schema
const createProductSchema = z.object({
  tenantId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  sku: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  type: z.enum(['PHYSICAL', 'DIGITAL', 'SERVICE', 'SUBSCRIPTION', 'BUNDLE']).default('PHYSICAL'),
  brand: z.string().optional(),
  manufacturer: z.string().optional(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  profitMargin: z.number().min(0).max(100).optional(),
  trackInventory: z.boolean().default(true),
  stockQuantity: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  allowBackorder: z.boolean().default(false),
  weight: z.number().positive().optional(),
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive()
  }).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']).default('DRAFT'),
  isFeatured: z.boolean().default(false),
  isDigital: z.boolean().default(false),
  requiresShipping: z.boolean().default(true),
  images: z.array(z.string().url()).default([]),
  videos: z.array(z.string().url()).optional(),
  metadata: z.record(z.any()).default({})
});

// Product query schema
const productQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  limit: z.string().transform(val => Math.min(parseInt(val) || 10, 100)),
  search: z.string().optional(),
  category: z.string().uuid().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
  featured: z.string().transform(val => val === 'true').optional(),
  sortBy: z.enum(['name', 'price', 'created_at', 'updated_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  type: z.enum(['PHYSICAL', 'DIGITAL', 'SERVICE', 'SUBSCRIPTION', 'BUNDLE']).optional(),
  minPrice: z.string().transform(val => parseFloat(val)).optional(),
  maxPrice: z.string().transform(val => parseFloat(val)).optional(),
  inStock: z.string().transform(val => val === 'true').optional()
});

/**
 * GET /api/ecommerce/products
 * Retrieve products with filtering, pagination, and search
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const {
      page,
      limit,
      search,
      category,
      status,
      featured,
      sortBy,
      sortOrder,
      type,
      minPrice,
      maxPrice,
      inStock
    } = productQuerySchema.parse(params);

    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      tenant_id: tenantId,
      deleted_at: null
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category) where.category_id = category;
    if (status) where.status = status;
    if (featured !== undefined) where.is_featured = featured;
    if (type) where.type = type;
    if (inStock !== undefined && inStock) {
      where.stock_quantity = { gt: 0 };
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    // Build order clause
    const orderBy: any = {};
    orderBy[sortBy === 'created_at' ? 'created_at' : sortBy] = sortOrder;

    // Execute query with total count
    const [products, total] = await Promise.all([
      prisma.ecommerceProduct.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          variants: {
            where: { is_active: true },
            select: {
              id: true,
              sku: true,
              name: true,
              price: true,
              stock_quantity: true,
              option1_name: true,
              option1_value: true,
              option2_name: true,
              option2_value: true,
              option3_name: true,
              option3_value: true
            }
          },
          _count: {
            select: {
              reviews: true,
              view_history: true
            }
          }
        }
      }),
      prisma.ecommerceProduct.count({ where })
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    console.error('Products GET error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/ecommerce/products
 * Create a new product
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createProductSchema.parse(body);

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: validatedData.tenantId }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Check if SKU is unique within tenant
    const existingSku = await prisma.ecommerceProduct.findUnique({
      where: {
        tenant_id_sku: {
          tenant_id: validatedData.tenantId,
          sku: validatedData.sku
        }
      }
    });

    if (existingSku) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 409 });
    }

    // Check if slug is unique within tenant
    const existingSlug = await prisma.ecommerceProduct.findUnique({
      where: {
        tenant_id_slug: {
          tenant_id: validatedData.tenantId,
          slug: validatedData.slug
        }
      }
    });

    if (existingSlug) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }

    // Create product
    const product = await prisma.ecommerceProduct.create({
      data: {
        tenant_id: validatedData.tenantId,
        category_id: validatedData.categoryId,
        sku: validatedData.sku,
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        short_description: validatedData.shortDescription,
        type: validatedData.type,
        brand: validatedData.brand,
        manufacturer: validatedData.manufacturer,
        price: validatedData.price,
        compare_at_price: validatedData.compareAtPrice,
        cost_price: validatedData.costPrice,
        profit_margin: validatedData.profitMargin,
        track_inventory: validatedData.trackInventory,
        stock_quantity: validatedData.stockQuantity,
        low_stock_threshold: validatedData.lowStockThreshold,
        allow_backorder: validatedData.allowBackorder,
        weight: validatedData.weight,
        dimensions: validatedData.dimensions || {},
        seo_title: validatedData.seoTitle,
        seo_description: validatedData.seoDescription,
        seo_keywords: validatedData.seoKeywords,
        tags: validatedData.tags,
        status: validatedData.status,
        is_featured: validatedData.isFeatured,
        is_digital: validatedData.isDigital,
        requires_shipping: validatedData.requiresShipping,
        images: validatedData.images,
        videos: validatedData.videos || [],
        metadata: validatedData.metadata
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    return NextResponse.json(product, { status: 201 });

  } catch (error) {
    console.error('Products POST error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid product data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}