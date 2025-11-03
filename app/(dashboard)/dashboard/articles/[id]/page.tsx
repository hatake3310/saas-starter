import { Suspense } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft, Pencil } from 'lucide-react';
import { getArticleById, getUser } from '@/lib/db/queries';

type PageProps = {
  params: Promise<{ id: string }>;
};

/**
 * Article detail page - Server Component
 * Displays full article with metadata
 */
export default async function ArticleDetailPage({ params }: PageProps) {
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
        <ArticleContent articleId={parseInt(id, 10)} />
      </Suspense>
    </section>
  );
}

/**
 * Article content component - async Server Component
 * Fetches and displays article details
 */
async function ArticleContent({ articleId }: { articleId: number }) {
  const article = await getArticleById(articleId);

  if (!article) {
    notFound();
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      draft: { label: 'Draft', className: 'bg-gray-200 text-gray-700' },
      published: {
        label: 'Published',
        className: 'bg-green-200 text-green-700',
      },
      unpublished: {
        label: 'Unpublished',
        className: 'bg-yellow-200 text-yellow-700',
      },
    };

    const statusInfo = statusMap[status] || statusMap.draft;

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.className}`}
        role="status"
        aria-label={`Status: ${statusInfo.label}`}
      >
        {statusInfo.label}
      </span>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <CardTitle className="text-2xl">{article.title}</CardTitle>
              {getStatusBadge(article.status)}
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Author: {article.author?.name || 'Unknown'}</p>
              <p>Created: {formatDate(article.createdAt)}</p>
              <p>Updated: {formatDate(article.updatedAt)}</p>
              {article.publishedAt && (
                <p>Published: {formatDate(article.publishedAt)}</p>
              )}
            </div>
            {article.excerpt && (
              <p className="mt-3 text-muted-foreground italic">
                {article.excerpt}
              </p>
            )}
          </div>
          <Link href={`/dashboard/articles/${article.id}/edit`}>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              aria-label="Edit article"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              <span className="ml-2">Edit</span>
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {(article.articleCategories && article.articleCategories.length > 0) ||
        (article.articleTags && article.articleTags.length > 0) ? (
          <div className="mb-6 space-y-3">
            {article.articleCategories &&
              article.articleCategories.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Categories:</h3>
                  <div className="flex flex-wrap gap-2">
                    {article.articleCategories.map(({ category }) => (
                      <span
                        key={category.id}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {article.articleTags && article.articleTags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {article.articleTags.map(({ tag }) => (
                    <span
                      key={tag.id}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        <article className="prose max-w-none">
          <div className="whitespace-pre-wrap">{article.content}</div>
        </article>
      </CardContent>
    </Card>
  );
}


