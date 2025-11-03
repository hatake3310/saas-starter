import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createCategory as dbCreateCategory } from '@/lib/db/queries';
import { auth } from '@/lib/auth';
import { sanitizeInput } from '@/lib/utils/sanitize';

const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await request.json();
    const data = createCategorySchema.parse(json);
    const sanitizedName = sanitizeInput(data.name);
    const category = await dbCreateCategory(sanitizedName);

    return NextResponse.json({ success: true, category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    const message =
      error instanceof Error ? error.message : 'Failed to create category';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
