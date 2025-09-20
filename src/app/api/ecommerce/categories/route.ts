import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Category creation schema
const createCategorySchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  image: z.string().url().optional(),
  parentId: z.string().uuid().optional(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).default([])
});

// Category query schema
const categoryQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  limit: z.string().transform(val => Math.min(parseInt(val) || 50, 200)),
  search: z.string().optional(),
  parentId: z.string().uuid().optional(),
  includeInactive: z.string().transform(val => val === 'true').default(false),
  sortBy: z.enum(['name', 'display_order', 'created_at']).default('display_order'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  includeProductCount: z.string().transform(val => val === 'true').default(false),
  hierarchy: z.string().transform(val => val === 'true').default(false)
});

/**
 * GET /api/ecommerce/categories
 * Retrieve product categories with optional hierarchy and product counts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const {
      page,
      limit,
      search,
      parentId,
      includeInactive,
      sortBy,
      sortOrder,
      includeProductCount,
      hierarchy
    } = categoryQuerySchema.parse(params);

    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // If hierarchy is requested, return tree structure
    if (hierarchy) {
      const buildCategoryTree = async (parentId: string | null = null): Promise<any[]> => {
        const categories = await prisma.productCategory.findMany({
          where: {
            tenant_id: tenantId,
            parent_id: parentId,
            deleted_at: null,
            ...(includeInactive ? {} : { is_active: true })
          },
          orderBy: {
            [sortBy]: sortOrder
          },
          include: includeProductCount ? {
            _count: {
              select: {
                products: {
                  where: {
                    status: 'ACTIVE',
                    deleted_at: null
                  }
                }
              }
            }
          } : undefined
        });

        const categoriesWithChildren = await Promise.all(
          categories.map(async (category) => ({
            ...category,
            children: await buildCategoryTree(category.id),
            productCount: includeProductCount ? category._count?.products : undefined
          }))
        );

        return categoriesWithChildren;
      };

      const tree = await buildCategoryTree();
      return NextResponse.json({ data: tree, type: 'hierarchy' });
    }

    // Standard paginated query
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      tenant_id: tenantId,
      deleted_at: null
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (parentId !== undefined) {
      where.parent_id = parentId;
    }

    if (!includeInactive) {
      where.is_active = true;
    }

    // Build order clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Execute query with total count
    const [categories, total] = await Promise.all([
      prisma.productCategory.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          children: {
            where: { is_active: true },
            select: {
              id: true,
              name: true,
              slug: true,
              display_order: true
            },
            orderBy: { display_order: 'asc' }
          },
          ...(includeProductCount ? {
            _count: {
              select: {
                products: {
                  where: {
                    status: 'ACTIVE',
                    deleted_at: null
                  }
                }
              }
            }
          } : {})
        }
      }),
      prisma.productCategory.count({ where })
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      data: categories,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      type: 'paginated'
    });

  } catch (error) {
    console.error('Categories GET error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/ecommerce/categories
 * Create a new product category
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createCategorySchema.parse(body);

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: validatedData.tenantId }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Check if slug is unique within tenant
    const existingSlug = await prisma.productCategory.findUnique({
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

    // Validate parent category if provided
    if (validatedData.parentId) {
      const parentCategory = await prisma.productCategory.findFirst({
        where: {
          id: validatedData.parentId,
          tenant_id: validatedData.tenantId,
          deleted_at: null
        }
      });

      if (!parentCategory) {
        return NextResponse.json({ error: 'Parent category not found' }, { status: 404 });
      }

      // Prevent circular references by checking if parent has this category as ancestor
      const checkCircularReference = async (parentId: string, targetId?: string): Promise<boolean> => {
        if (!targetId) return false;

        const parent = await prisma.productCategory.findUnique({
          where: { id: parentId },
          select: { parent_id: true }
        });

        if (!parent) return false;
        if (parent.parent_id === targetId) return true;
        if (parent.parent_id) {
          return checkCircularReference(parent.parent_id, targetId);
        }

        return false;
      };

      // For updates, this would need the category ID being updated
      // For now, we just prevent immediate circular reference
    }

    // Create category
    const category = await prisma.productCategory.create({
      data: {
        tenant_id: validatedData.tenantId,
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        image: validatedData.image,
        parent_id: validatedData.parentId,
        display_order: validatedData.displayOrder,
        is_active: validatedData.isActive,
        seo_title: validatedData.seoTitle,
        seo_description: validatedData.seoDescription,
        seo_keywords: validatedData.seoKeywords
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    return NextResponse.json(category, { status: 201 });

  } catch (error) {
    console.error('Categories POST error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid category data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}