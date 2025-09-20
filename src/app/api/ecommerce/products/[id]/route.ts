import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Product update schema
const updateProductSchema = z.object({
  categoryId: z.string().uuid().optional(),
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  type: z.enum(['PHYSICAL', 'DIGITAL', 'SERVICE', 'SUBSCRIPTION', 'BUNDLE']).optional(),
  brand: z.string().optional(),
  manufacturer: z.string().optional(),
  price: z.number().positive().optional(),
  compareAtPrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  profitMargin: z.number().min(0).max(100).optional(),
  trackInventory: z.boolean().optional(),
  stockQuantity: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  allowBackorder: z.boolean().optional(),
  weight: z.number().positive().optional(),
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive()
  }).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
  isFeatured: z.boolean().optional(),
  isDigital: z.boolean().optional(),
  requiresShipping: z.boolean().optional(),
  images: z.array(z.string().url()).optional(),
  videos: z.array(z.string().url()).optional(),
  metadata: z.record(z.any()).optional()
});

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/ecommerce/products/[id]
 * Get a single product by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const product = await prisma.ecommerceProduct.findFirst({
      where: {
        id,
        tenant_id: tenantId,
        deleted_at: null
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            parent: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        },
        variants: {
          where: { is_active: true },
          orderBy: { position: 'asc' }
        },
        reviews: {
          where: { is_approved: true },
          include: {
            customer: {
              select: {
                id: true,
                first_name: true,
                last_name: true
              }
            }
          },
          orderBy: { created_at: 'desc' },
          take: 5
        },
        _count: {
          select: {
            reviews: {
              where: { is_approved: true }
            },
            view_history: {
              where: {
                created_at: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                }
              }
            }
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Track product view
    const userAgent = request.headers.get('user-agent') || '';
    const sessionId = request.headers.get('x-session-id');
    const customerId = request.headers.get('x-customer-id');

    // Fire and forget view tracking
    prisma.productView.create({
      data: {
        product_id: product.id,
        customer_id: customerId || undefined,
        session_id: sessionId || undefined,
        user_agent: userAgent,
        page_url: request.url,
        referrer_url: request.headers.get('referer') || undefined,
        ip_address: request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') ||
                   'unknown'
      }
    }).catch(error => console.error('Failed to track product view:', error));

    // Update view count
    prisma.ecommerceProduct.update({
      where: { id: product.id },
      data: {
        view_count: {
          increment: 1
        }
      }
    }).catch(error => console.error('Failed to update view count:', error));

    return NextResponse.json(product);

  } catch (error) {
    console.error('Product GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/ecommerce/products/[id]
 * Update a product
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // Check if product exists and belongs to tenant
    const existingProduct = await prisma.ecommerceProduct.findFirst({
      where: {
        id,
        tenant_id: tenantId,
        deleted_at: null
      }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check slug uniqueness if being updated
    if (validatedData.slug && validatedData.slug !== existingProduct.slug) {
      const existingSlug = await prisma.ecommerceProduct.findFirst({
        where: {
          tenant_id: tenantId,
          slug: validatedData.slug,
          id: { not: id },
          deleted_at: null
        }
      });

      if (existingSlug) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
      }
    }

    // Update product
    const updatedProduct = await prisma.ecommerceProduct.update({
      where: { id },
      data: {
        category_id: validatedData.categoryId,
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
        dimensions: validatedData.dimensions || undefined,
        seo_title: validatedData.seoTitle,
        seo_description: validatedData.seoDescription,
        seo_keywords: validatedData.seoKeywords,
        tags: validatedData.tags,
        status: validatedData.status,
        is_featured: validatedData.isFeatured,
        is_digital: validatedData.isDigital,
        requires_shipping: validatedData.requiresShipping,
        images: validatedData.images,
        videos: validatedData.videos,
        metadata: validatedData.metadata
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        variants: {
          where: { is_active: true }
        }
      }
    });

    return NextResponse.json(updatedProduct);

  } catch (error) {
    console.error('Product PUT error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid product data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/ecommerce/products/[id]
 * Soft delete a product
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // Check if product exists and belongs to tenant
    const existingProduct = await prisma.ecommerceProduct.findFirst({
      where: {
        id,
        tenant_id: tenantId,
        deleted_at: null
      }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if product is in any active carts or orders
    const [activeCartItems, activeOrderItems] = await Promise.all([
      prisma.cartItem.count({
        where: {
          product_id: id,
          cart: {
            status: 'ACTIVE'
          }
        }
      }),
      prisma.ecommerceOrderItem.count({
        where: {
          product_id: id,
          order: {
            status: {
              in: ['PENDING', 'CONFIRMED', 'PROCESSING']
            }
          }
        }
      })
    ]);

    if (activeCartItems > 0 || activeOrderItems > 0) {
      return NextResponse.json({
        error: 'Cannot delete product that is in active carts or orders. Set status to INACTIVE instead.'
      }, { status: 409 });
    }

    // Soft delete the product
    await prisma.ecommerceProduct.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        status: 'ARCHIVED'
      }
    });

    return NextResponse.json({ message: 'Product deleted successfully' });

  } catch (error) {
    console.error('Product DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}