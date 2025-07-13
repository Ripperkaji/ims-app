
import { NextRequest, NextResponse } from 'next/server';
import { updateCashInHand } from '@/lib/data';
import { z } from 'zod';

const updateCapitalSchema = z.object({
  amount: z.number().min(0, "Capital amount cannot be negative."),
  actorName: z.string().min(1, "Actor name is required."),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = updateCapitalSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { amount, actorName } = validation.data;
    
    // The updateCashInHand function in data.ts will handle the logic and logging
    const result = updateCashInHand(amount, actorName);

    return NextResponse.json(result, { status: 200 });

  } catch (e) {
    console.error(`Error in POST /api/capital:`, e);
    const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
    return NextResponse.json({ error: "Failed to update capital.", details: errorMessage }, { status: 500 });
  }
}
