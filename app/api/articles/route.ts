import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createArticle as dbCreateArticle,
  updateArticle as dbUpdateArticle,
  getTeamMembership,
} from '@/lib/db/queries';
import { ArticleStatus } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { sanitizeInput } from '@/lib/utils/sanitize';

const createArticleSchema = z.object({
  title: z.string().min(3).max(255),
  content: z.string().min(10),
  excerpt: z.string().max(500).optional(),
  status: z.enum([
    ArticleStatus.DRAFT,
    ArticleStatus.PUBLISHED,
    ArticleStatus.UNPUBLISHED,
  ]),
  tagIds: z.array(z.number()).optional(),
  categoryIds: z.array(z.number()).optional(),
  teamId: z.number(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const json = await request.json();
    const data = createArticleSchema.parse(json);

    const membership = await getTeamMembership(userId, data.teamId);
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sanitizedData = {
      title: sanitizeInput(data.title),
      content: sanitizeInput(data.content),
      excerpt: data.excerpt ? sanitizeInput(data.excerpt) : undefined,
      status: data.status,
      tagIds: data.tagIds,
      categoryIds: data.categoryIds,
      teamId: data.teamId,
      authorId: userId,
    };

    const article = await dbCreateArticle(sanitizedData);

    return NextResponse.json({ success: true, articleId: article.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Failed to create article';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
