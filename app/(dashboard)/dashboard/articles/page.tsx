import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { getArticlesForTeam } from '@/lib/db/queries';
import { ArticleList } from './components/article-list';
import { ArticleListSkeleton } from './components/article-list-skeleton';

/**
 * Articles page - Server Component
 * Lists all articles for the current team
 * @returns JSX.Element
 */
export default async function ArticlesPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg lg:text-2xl font-medium">Article Management</h1>
        <Link href="/dashboard/articles/new">
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            aria-label="Create new article"
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            <span className="ml-2">New Article</span>
          </Button>
        </Link>
      </div>

      <Suspense fallback={<ArticleListSkeleton />}>
        <ArticleListContent />
      </Suspense>
    </section>
  );
}

/**
 * Article list content - async Server Component
 * Fetches and displays articles
 */
async function ArticleListContent() {
  const articles = await getArticlesForTeam();

  if (!articles) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Access</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You need to be part of a team to manage articles.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (articles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Articles Yet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Get started by creating your first article.
            </p>
            <Link href="/dashboard/articles/new">
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                aria-label="Create first article"
              >
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                <span className="ml-2">Create Article</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <ArticleList articles={articles} />;
}


