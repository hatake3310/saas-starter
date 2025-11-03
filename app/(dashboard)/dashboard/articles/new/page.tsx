import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getUser, getCategoriesForTeam, getTagsForTeam, getTeamForUser } from '@/lib/db/queries';
import { ArticleForm } from '../components/article-form';
import { Card, CardContent } from '@/components/ui/card';

/**
 * New article page - Server Component
 * Provides form for creating new articles
 */
export default async function NewArticlePage() {
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-6">
        Create New Article
      </h1>
      <Suspense
        fallback={
          <Card>
            <CardContent className="py-12">
              <p className="text-center">Loading form...</p>
            </CardContent>
          </Card>
        }
      >
        <ArticleFormContent />
      </Suspense>
    </section>
  );
}

/**
 * Article form content - async Server Component
 * Fetches categories and tags before rendering form
 */
async function ArticleFormContent() {
  const [categories, tags, team] = await Promise.all([
    getCategoriesForTeam(),
    getTagsForTeam(),
    getTeamForUser(),
  ]);

  if (!team) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center">
            You must be part of a team to create an article.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ArticleForm
      mode="create"
      categories={categories || []}
      tags={tags || []}
      teamId={team.id}
    />
  );
}


