import { Suspense } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import {
  getArticleById,
  getUser,
  getCategoriesForTeam,
  getTagsForTeam,
} from '@/lib/db/queries';
import { ArticleForm } from '../../components/article-form';

type PageProps = {
  params: Promise<{ id: string }>;
};

/**
 * Edit article page - Server Component
 * Provides form for editing existing articles
 */
export default async function EditArticlePage({ params }: PageProps) {
  const { id } = await params;
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <Link href="/dashboard/articles">
          <Button variant="outline" size="sm" aria-label="Back to articles">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span className="ml-2">Back to Articles</span>
          </Button>
        </Link>
      </div>

      <Suspense
        fallback={
          <Card>
            <CardContent className="py-12">
              <p className="text-center">Loading article...</p>
            </CardContent>
          </Card>
        }
      >
        <EditArticleContent articleId={parseInt(id, 10)} />
      </Suspense>
    </section>
  );
}

/**
 * Edit article content - async Server Component
 * Fetches article, categories, and tags for editing
 */
async function EditArticleContent({ articleId }: { articleId: number }) {
  const [article, categories, tags] = await Promise.all([
    getArticleById(articleId),
    getCategoriesForTeam(),
    getTagsForTeam(),
  ]);

  if (!article) {
    notFound();
  }

  return (
    <ArticleForm
      mode="edit"
      article={article}
      categories={categories || []}
      tags={tags || []}
      teamId={article.teamId}
    />
  );
}


