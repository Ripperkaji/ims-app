
import { NextRequest, NextResponse } from 'next/server';
import { mockProducts, mockSales, addLogEntry } from '@/lib/data';
import { calculateCurrentStock } from '@/lib/productUtils';
import type { Product, ProductType } from '@/types';
import { z } from 'zod';

const productUpdateSchema = z.object({
  name: z.string().min(1, "Product name cannot be empty.").optional(),
  category: z.custom<ProductType>((val) => typeof val === 'string' && val.length > 0, "Category is required.").optional(),
  sellingPrice: z.number().positive("Selling price must be positive.").optional(),
  costPrice: z.number().positive("Cost price must be positive.").optional(),
}).partial().refine(data => {
    if (data.costPrice !== undefined && data.sellingPrice !== undefined) {
        return data.costPrice <= data.sellingPrice;
    }
    // If one is defined and the other isn't, we need the existing value to check
    // This logic will be handled in the PUT handler after fetching the product
    return true; 
}, {
  message: "Cost price cannot be greater than selling price.",
  path: ["costPrice"], // Or path: ["sellingPrice"]
});


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const productId = params.id;
  const product = mockProducts.find(p => p.id === productId);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  
  const productWithStock = {
      ...product,
      currentStock: calculateCurrentStock(product, mockSales)
  }

  return NextResponse.json(productWithStock);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const productId = params.id;
  const productIndex = mockProducts.findIndex(p => p.id === productId);

  if (productIndex === -1) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const validation = productUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const updates = validation.data;
    const originalProduct = mockProducts[productIndex];
    
    // Refinement for costPrice vs sellingPrice if one is updated and the other is not
    let finalCostPrice = updates.costPrice !== undefined ? updates.costPrice : originalProduct.currentCostPrice;
    let finalSellingPrice = updates.sellingPrice !== undefined ? updates.sellingPrice : originalProduct.currentSellingPrice;

    if (finalCostPrice > finalSellingPrice) {
        return NextResponse.json({ error: "Cost price cannot be greater than selling price." }, { status: 400 });
    }

    if (updates.name && updates.name.toLowerCase() !== originalProduct.name.toLowerCase()) {
      const existingProductWithNewName = mockProducts.find(p => p.name.toLowerCase() === updates.name?.toLowerCase() && p.id !== productId);
      if (existingProductWithNewName) {
        return NextResponse.json({ error: `Another product already exists with the name '${updates.name}'. Please choose a different name.` }, { status: 409 });
      }
    }
    
    const updatedProduct = { ...originalProduct };
    let changesMade = false;
    let logDetails = `Details for product '${originalProduct.name}' (ID: ${productId.substring(0,8)}...) updated via API.`;

    if (updates.name !== undefined && updates.name !== originalProduct.name) {
        updatedProduct.name = updates.name;
        logDetails += ` Name: ${originalProduct.name} -> ${updates.name}.`;
        changesMade = true;
    }
    if (updates.category !== undefined && updates.category !== originalProduct.category) {
        updatedProduct.category = updates.category;
        logDetails += ` Category: ${originalProduct.category} -> ${updates.category}.`;
        changesMade = true;
    }
    if (updates.sellingPrice !== undefined && updates.sellingPrice !== originalProduct.currentSellingPrice) {
        updatedProduct.currentSellingPrice = updates.sellingPrice;
        logDetails += ` MRP: ${originalProduct.currentSellingPrice.toFixed(2)} -> ${updates.sellingPrice.toFixed(2)}.`;
        changesMade = true;
    }
    if (updates.costPrice !== undefined && updates.costPrice !== originalProduct.currentCostPrice) {
        updatedProduct.currentCostPrice = updates.costPrice;
        logDetails += ` Cost: ${originalProduct.currentCostPrice.toFixed(2)} -> ${updates.costPrice.toFixed(2)}.`;
        changesMade = true;
    }
    
    if (!changesMade) {
        return NextResponse.json({ message: "No changes provided or values are the same.", product: { ...updatedProduct, currentStock: calculateCurrentStock(updatedProduct, mockSales)} }, { status: 200 });
    }

    mockProducts[productIndex] = updatedProduct;
    addLogEntry("API System", "Product Details Updated", logDetails);

    const productWithStock = {
        ...updatedProduct,
        currentStock: calculateCurrentStock(updatedProduct, mockSales)
    }

    return NextResponse.json(productWithStock);

  } catch (e) {
    console.error(`Error in PUT /api/products/${productId}:`, e);
    const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
    return NextResponse.json({ error: "Failed to update product.", details: errorMessage }, { status: 500 });
  }
}
