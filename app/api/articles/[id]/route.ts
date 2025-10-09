import {
  getArticleById,
  updateArticle,
  deleteArticle,
} from '@/lib/db/queries';
import { NextRequest } from 'next/server';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const articleId = parseInt(id, 10);

    if (isNaN(articleId)) {
      return Response.json({ error: 'Invalid article ID' }, { status: 400 });
    }

    const article = await getArticleById(articleId);

    if (!article) {
      return Response.json({ error: 'Article not found' }, { status: 404 });
    }

    return Response.json(article);
  } catch (error) {
    console.error('Error fetching article:', error);
    return Response.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const articleId = parseInt(id, 10);

    if (isNaN(articleId)) {
      return Response.json({ error: 'Invalid article ID' }, { status: 400 });
    }

    const body = await request.json();
    const { title, content, status } = body;

    const article = await updateArticle(articleId, { title, content, status });

    if (!article) {
      return Response.json({ error: 'Article not found' }, { status: 404 });
    }

    return Response.json(article);
  } catch (error: any) {
    console.error('Error updating article:', error);
    return Response.json(
      { error: error.message || 'Failed to update article' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const articleId = parseInt(id, 10);

    if (isNaN(articleId)) {
      return Response.json({ error: 'Invalid article ID' }, { status: 400 });
    }

    await deleteArticle(articleId);

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting article:', error);
    return Response.json(
      { error: error.message || 'Failed to delete article' },
      { status: 500 }
    );
  }
}

