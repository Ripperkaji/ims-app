
import { NextRequest, NextResponse } from 'next/server';
import { mockManagedUsers, addManagedUser } from '@/lib/data';
import type { ManagedUser, UserRole } from '@/types';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(1, "User name cannot be empty."),
  // Role is fixed to 'staff' for API creation for now, admins are not managed via this API.
  defaultPassword: z.string().min(1, "Default password cannot be empty."),
  addedBy: z.string().min(1, "Actor name (addedBy) is required."),
});

export async function GET(request: NextRequest) {
  // For now, returns all users. Could be filtered to 'staff' if admin users were also in mockManagedUsers.
  const staffUsers = mockManagedUsers.filter(u => u.role === 'staff')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json(staffUsers);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, defaultPassword, addedBy } = validation.data;

    // The addManagedUser function already handles logging and ensuring only staff are added.
    const newUser = addManagedUser(name, 'staff', defaultPassword, addedBy);

    if (!newUser) {
      // This case might occur if addManagedUser internally prevents admin creation
      // or has other validation, though current mock allows it.
      // More robust error handling could be added based on addManagedUser's return.
      return NextResponse.json({ error: "Failed to create staff user. Name might be invalid or role restricted." }, { status: 400 });
    }

    return NextResponse.json(newUser, { status: 201 });

  } catch (e) {
    console.error("Error in POST /api/users:", e);
    const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
    return NextResponse.json({ error: "Failed to create user.", details: errorMessage }, { status: 500 });
  }
}
