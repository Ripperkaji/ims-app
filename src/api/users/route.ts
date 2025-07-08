
import { NextRequest, NextResponse } from 'next/server';
import { mockManagedUsers, addManagedUser } from '@/lib/data';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(1, "User name cannot be empty."),
  contactNumber: z.string().min(1, "Contact number is required."),
  // Role is fixed to 'staff' for API creation.
  defaultPassword: z.string().min(1, "Default password cannot be empty."),
  addedBy: z.string().min(1, "Actor name (addedBy) is required."),
});

export async function GET(request: NextRequest) {
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

    const { name, contactNumber, defaultPassword, addedBy } = validation.data;

    const newUser = addManagedUser(name, 'staff', defaultPassword, addedBy, contactNumber);

    if (!newUser) {
      return NextResponse.json({ error: "Failed to create staff user. Name might be invalid or already exist." }, { status: 409 });
    }

    return NextResponse.json(newUser, { status: 201 });

  } catch (e) {
    console.error("Error in POST /api/users:", e);
    const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
    return NextResponse.json({ error: "Failed to create user.", details: errorMessage }, { status: 500 });
  }
}
