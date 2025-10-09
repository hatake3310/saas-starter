import { getArticlesForTeam, createArticle } from '@/lib/db/queries';
import { NextRequest } from 'next/server';

export async function GET() {
  try {
    const articles = await getArticlesForTeam();
    
    if (articles === null) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return Response.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    return Response.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, status } = body;

    if (!title || !content) {
      return Response.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const article = await createArticle({ title, content, status });
    return Response.json(article, { status: 201 });
  } catch (error: any) {
    console.error('Error creating article:', error);
    return Response.json(
      { error: error.message || 'Failed to create article' },
      { status: 500 }
    );
  }
}

