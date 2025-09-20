import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Variant creation schema
const createVariantSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  option1Name: z.string().optional(),
  option1Value: z.string().optional(),
  option2Name: z.string().optional(),
  option2Value: z.string().optional(),
  option3Name: z.string().optional(),
  option3Value: z.string().optional(),
  price: z.number().positive().optional(),
  compareAtPrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  stockQuantity: z.number().int().min(0).default(0),
  weight: z.number().positive().optional(),
  image: z.string().url().optional(),
  isActive: z.boolean().default(true),
  position: z.number().int().min(0).default(0)
});

// Variant update schema
const updateVariantSchema = createVariantSchema.partial();

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/ecommerce/products/[id]/variants
 * Get all variants for a product
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // Verify product exists and belongs to tenant
    const product = await prisma.ecommerceProduct.findFirst({
      where: {
        id,
        tenant_id: tenantId,
        deleted_at: null
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const variants = await prisma.productVariant.findMany({
      where: {
        product_id: id
      },
      orderBy: [
        { position: 'asc' },
        { created_at: 'asc' }
      ]
    });

    return NextResponse.json(variants);

  } catch (error) {
    console.error('Product variants GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/ecommerce/products/[id]/variants
 * Create a new variant for a product
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    const validatedData = createVariantSchema.parse(body);
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // Verify product exists and belongs to tenant
    const product = await prisma.ecommerceProduct.findFirst({
      where: {
        id,
        tenant_id: tenantId,
        deleted_at: null
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if variant SKU is unique within the product
    const existingVariant = await prisma.productVariant.findFirst({
      where: {
        product_id: id,
        sku: validatedData.sku
      }
    });

    if (existingVariant) {
      return NextResponse.json({ error: 'Variant SKU already exists for this product' }, { status: 409 });
    }

    // Create variant
    const variant = await prisma.productVariant.create({
      data: {
        product_id: id,
        sku: validatedData.sku,
        name: validatedData.name,
        option1_name: validatedData.option1Name,
        option1_value: validatedData.option1Value,
        option2_name: validatedData.option2Name,
        option2_value: validatedData.option2Value,
        option3_name: validatedData.option3Name,
        option3_value: validatedData.option3Value,
        price: validatedData.price,
        compare_at_price: validatedData.compareAtPrice,
        cost_price: validatedData.costPrice,
        stock_quantity: validatedData.stockQuantity,
        weight: validatedData.weight,
        image: validatedData.image,
        is_active: validatedData.isActive,
        position: validatedData.position
      }
    });

    return NextResponse.json(variant, { status: 201 });

  } catch (error) {
    console.error('Product variants POST error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid variant data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/ecommerce/products/[id]/variants
 * Bulk update variants for a product
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // Verify product exists and belongs to tenant
    const product = await prisma.ecommerceProduct.findFirst({
      where: {
        id,
        tenant_id: tenantId,
        deleted_at: null
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Validate variants array
    if (!Array.isArray(body.variants)) {
      return NextResponse.json({ error: 'Variants must be an array' }, { status: 400 });
    }

    const results = [];
    const errors = [];

    // Process each variant
    for (const [index, variantData] of body.variants.entries()) {
      try {
        if (variantData.id) {
          // Update existing variant
          const validatedData = updateVariantSchema.parse(variantData);

          const updatedVariant = await prisma.productVariant.update({
            where: {
              id: variantData.id,
              product_id: id
            },
            data: {
              sku: validatedData.sku,
              name: validatedData.name,
              option1_name: validatedData.option1Name,
              option1_value: validatedData.option1Value,
              option2_name: validatedData.option2Name,
              option2_value: validatedData.option2Value,
              option3_name: validatedData.option3Name,
              option3_value: validatedData.option3Value,
              price: validatedData.price,
              compare_at_price: validatedData.compareAtPrice,
              cost_price: validatedData.costPrice,
              stock_quantity: validatedData.stockQuantity,
              weight: validatedData.weight,
              image: validatedData.image,
              is_active: validatedData.isActive,
              position: validatedData.position
            }
          });

          results.push({ index, action: 'updated', variant: updatedVariant });
        } else {
          // Create new variant
          const validatedData = createVariantSchema.parse(variantData);

          const newVariant = await prisma.productVariant.create({
            data: {
              product_id: id,
              sku: validatedData.sku,
              name: validatedData.name,
              option1_name: validatedData.option1Name,
              option1_value: validatedData.option1Value,
              option2_name: validatedData.option2Name,
              option2_value: validatedData.option2Value,
              option3_name: validatedData.option3Name,
              option3_value: validatedData.option3Value,
              price: validatedData.price,
              compare_at_price: validatedData.compareAtPrice,
              cost_price: validatedData.costPrice,
              stock_quantity: validatedData.stockQuantity,
              weight: validatedData.weight,
              image: validatedData.image,
              is_active: validatedData.isActive,
              position: validatedData.position
            }
          });

          results.push({ index, action: 'created', variant: newVariant });
        }
      } catch (variantError) {
        errors.push({
          index,
          error: variantError instanceof z.ZodError ? variantError.errors : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: results,
      errors: errors,
      summary: {
        processed: body.variants.length,
        successful: results.length,
        failed: errors.length
      }
    });

  } catch (error) {
    console.error('Product variants PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}