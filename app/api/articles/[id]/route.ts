import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  updateArticle as dbUpdateArticle,
  deleteArticle as dbDeleteArticle,
  getArticleByIdInternal,
  getTeamMembership,
} from '@/lib/db/queries';
import { ArticleStatus } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { sanitizeInput } from '@/lib/utils/sanitize';

const updateArticleSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  content: z.string().min(10).optional(),
  excerpt: z.string().max(500).optional(),
  status: z
    .enum([
      ArticleStatus.DRAFT,
      ArticleStatus.PUBLISHED,
      ArticleStatus.UNPUBLISHED,
    ])
    .optional(),
  tagIds: z.array(z.number()).optional(),
  categoryIds: z.array(z.number()).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const articleId = Number(params.id);

    const article = await getArticleByIdInternal(articleId);
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const membership = await getTeamMembership(userId, article.teamId);
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const json = await request.json();
    const data = updateArticleSchema.parse(json);

    const sanitizedData = {
      title: data.title ? sanitizeInput(data.title) : undefined,
      content: data.content ? sanitizeInput(data.content) : undefined,
      excerpt: data.excerpt ? sanitizeInput(data.excerpt) : undefined,
      status: data.status,
      tagIds: data.tagIds,
      categoryIds: data.categoryIds,
    };

    await dbUpdateArticle(articleId, sanitizedData);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Failed to update article';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const articleId = Number(params.id);
    const article = await getArticleByIdInternal(articleId);

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    if (article.status === ArticleStatus.PUBLISHED) {
      return NextResponse.json(article);
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const membership = await getTeamMembership(userId, article.teamId);
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(article);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch article';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const articleId = Number(params.id);

    const article = await getArticleByIdInternal(articleId);
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const membership = await getTeamMembership(userId, article.teamId);
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbDeleteArticle(articleId);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete article';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
