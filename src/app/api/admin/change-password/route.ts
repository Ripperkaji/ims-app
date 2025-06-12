
import { NextRequest, NextResponse } from 'next/server';
import { addLogEntry } from '@/lib/data';
import { z } from 'zod';

const MOCK_ADMIN_DEFAULT_PASSWORD = "12345";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(1, "New password is required."),
  actorName: z.string().min(1, "Actor name (admin username) is required."),
});

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = changePasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { currentPassword, newPassword, actorName } = validation.data;

    if (currentPassword !== MOCK_ADMIN_DEFAULT_PASSWORD) {
      return NextResponse.json({ error: "Current password incorrect." }, { status: 400 });
    }

    if (newPassword === MOCK_ADMIN_DEFAULT_PASSWORD) {
      return NextResponse.json({ error: "New password cannot be the same as the old password." }, { status: 400 });
    }

    // In a real application, you would hash the newPassword and update it in the database.
    // For this mock API, we just log the action.
    addLogEntry(actorName, "Admin Password Changed (Simulated via API)", `Admin ${actorName} 'changed' password via API.`);

    return NextResponse.json({ message: "Password changed successfully (simulated)." }, { status: 200 });

  } catch (e) {
    console.error("Error in PUT /api/admin/change-password:", e);
    const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
    return NextResponse.json({ error: "Failed to change password.", details: errorMessage }, { status: 500 });
  }
}
