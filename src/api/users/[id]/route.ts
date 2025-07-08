
import { NextRequest, NextResponse } from 'next/server';
import { mockManagedUsers, editManagedUser, deleteManagedUser } from '@/lib/data';
import { z } from 'zod';

const updateUserSchema = z.object({
  name: z.string().min(1, "User name cannot be empty."),
  contactNumber: z.string().min(1, "Contact number is required."),
  editedBy: z.string().min(1, "Actor name (editedBy) is required."),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = params.id;
  const user = mockManagedUsers.find(u => u.id === userId && u.role === 'staff');

  if (!user) {
    return NextResponse.json({ error: "Staff user not found" }, { status: 404 });
  }
  return NextResponse.json(user);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = params.id;
  const userToUpdate = mockManagedUsers.find(u => u.id === userId && u.role === 'staff');

  if (!userToUpdate) {
    return NextResponse.json({ error: "Staff user not found or user is not staff" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const { name, contactNumber, editedBy } = validation.data;
    const updatedUser = editManagedUser(userId, name, editedBy, contactNumber);

    if (!updatedUser) {
      return NextResponse.json({ error: "Failed to update user. New name might be invalid or user not found." }, { status: 400 });
    }

    return NextResponse.json(updatedUser);

  } catch (e) {
    console.error(`Error in PUT /api/users/${userId}:`, e);
    const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
    return NextResponse.json({ error: "Failed to update user.", details: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = params.id;
  const userToDelete = mockManagedUsers.find(u => u.id === userId && u.role === 'staff');

  if (!userToDelete) {
    return NextResponse.json({ error: "Staff user not found or user is not staff" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const deletedBy = searchParams.get('deletedBy');

  if (!deletedBy || deletedBy.trim() === "") {
    return NextResponse.json({ error: "Actor name (deletedBy) is required as a query parameter." }, { status: 400 });
  }
  
  const deleted = deleteManagedUser(userId, deletedBy);

  if (!deleted) {
    return NextResponse.json({ error: "Failed to delete user. User might not exist or cannot be deleted." }, { status: 400 });
  }
  
  return NextResponse.json({ message: `Staff user ${userId} deleted successfully.` }, { status: 200 });
}
