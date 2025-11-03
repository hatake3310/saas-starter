import { desc, and, eq, isNull, or } from 'drizzle-orm';
import { db } from './drizzle';
import {
  activityLogs,
  teamMembers,
  teams,
  users,
  articles,
  categories,
  tags,
  articleTags,
  articleCategories,
  ArticleStatus,
} from './schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';

export async function getUser() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'number'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  return user[0];
}

export async function getTeamByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateTeamSubscription(
  teamId: number,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
) {
  await db
    .update(teams)
    .set({
      ...subscriptionData,
      updatedAt: new Date()
    })
    .where(eq(teams.id, teamId));
}

export async function getUserWithTeam(userId: number) {
  const result = await db
    .select({
      user: users,
      teamId: teamMembers.teamId
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

export async function getTeamForUser() {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const result = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
    with: {
      team: {
        with: {
          teamMembers: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });

  return result?.team || null;
}

export async function getTeamMembership(userId: number, teamId: number) {
  return await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)),
  });
}

/**
 * Generates a URL-safe slug from a title
 * @param title - The article title
 * @returns URL-safe slug
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Checks if user can edit an article
 * User must be the author or a team owner
 * @param articleId - The article ID to check
 * @returns Promise<boolean>
 */
export async function canUserEditArticle(articleId: number): Promise<boolean> {
  const user = await getUser();
  if (!user) return false;

  const article = await db.query.articles.findFirst({
    where: eq(articles.id, articleId),
  });

  if (!article) return false;

  const teamMember = await db.query.teamMembers.findFirst({
    where: and(
      eq(teamMembers.userId, user.id),
      eq(teamMembers.teamId, article.teamId)
    ),
  });

  return (
    teamMember !== undefined &&
    (article.authorId === user.id || teamMember.role === 'owner')
  );
}

/**
 * Get all articles for the current user's team
 * Includes author information and tag/category counts
 * @returns Promise<Article[]>
 */
export async function getArticlesForTeam() {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const team = await getTeamForUser();
  if (!team) {
    return null;
  }

  return await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      content: articles.content,
      excerpt: articles.excerpt,
      status: articles.status,
      authorId: articles.authorId,
      authorName: users.name,
      teamId: articles.teamId,
      publishedAt: articles.publishedAt,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
    })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(eq(articles.teamId, team.id))
    .orderBy(desc(articles.updatedAt));
}

/**
 * Get a single article by ID with full details
 * Includes author info, tags, and categories
 * @param articleId - The article ID
 * @returns Promise<Article | null>
 */
export async function getArticleById(articleId: number) {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const team = await getTeamForUser();
  if (!team) {
    return null;
  }

  const article = await db.query.articles.findFirst({
    where: and(eq(articles.id, articleId), eq(articles.teamId, team.id)),
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
      articleTags: {
        with: {
          tag: true,
        },
      },
      articleCategories: {
        with: {
          category: true,
        },
      },
    },
  });

  return article || null;
}

export async function getArticleByIdInternal(articleId: number) {
  return await db.query.articles.findFirst({
    where: eq(articles.id, articleId),
  });
}

/**
 * Get a single article by slug (for public access)
 * Only returns published articles
 * @param slug - The article slug
 * @returns Promise<Article | null>
 */
export async function getArticleBySlug(slug: string) {
  const article = await db.query.articles.findFirst({
    where: and(
      eq(articles.slug, slug),
      eq(articles.status, ArticleStatus.PUBLISHED)
    ),
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
      articleTags: {
        with: {
          tag: true,
        },
      },
      articleCategories: {
        with: {
          category: true,
        },
      },
    },
  });

  return article || null;
}

/**
 * Create a new article
 * @param data - Article data
 * @returns Promise<Article>
 */
export async function createArticle(data: {
  title: string;
  content: string;
  excerpt?: string;
  status?: string;
  tagIds?: number[];
  categoryIds?: number[];
}) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const team = await getTeamForUser();
  if (!team) {
    throw new Error('User not in a team');
  }

  const slug = generateSlug(data.title);
  const status = data.status || ArticleStatus.DRAFT;

  const result = await db
    .insert(articles)
    .values({
      title: data.title,
      slug,
      content: data.content,
      excerpt: data.excerpt || data.content.substring(0, 500),
      status,
      authorId: user.id,
      teamId: team.id,
      publishedAt: status === ArticleStatus.PUBLISHED ? new Date() : null,
    })
    .returning();

  const article = result[0];

  // Add tags
  if (data.tagIds && data.tagIds.length > 0) {
    await db.insert(articleTags).values(
      data.tagIds.map((tagId) => ({
        articleId: article.id,
        tagId,
      }))
    );
  }

  // Add categories
  if (data.categoryIds && data.categoryIds.length > 0) {
    await db.insert(articleCategories).values(
      data.categoryIds.map((categoryId) => ({
        articleId: article.id,
        categoryId,
      }))
    );
  }

  return article;
}

/**
 * Update an existing article
 * @param articleId - The article ID
 * @param data - Updated article data
 * @returns Promise<Article | null>
 */
export async function updateArticle(
  articleId: number,
  data: {
    title?: string;
    content?: string;
    excerpt?: string;
    status?: string;
    tagIds?: number[];
    categoryIds?: number[];
  }
) {
  const canEdit = await canUserEditArticle(articleId);
  if (!canEdit) {
    throw new Error('Unauthorized to edit this article');
  }

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.title) {
    updateData.title = data.title;
    updateData.slug = generateSlug(data.title);
  }
  if (data.content !== undefined) updateData.content = data.content;
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
  if (data.status) {
    updateData.status = data.status;
    if (data.status === ArticleStatus.PUBLISHED) {
      const article = await getArticleById(articleId);
      if (article && !article.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }
  }

  const result = await db
    .update(articles)
    .set(updateData)
    .where(eq(articles.id, articleId))
    .returning();

  // Update tags if provided
  if (data.tagIds !== undefined) {
    await db.delete(articleTags).where(eq(articleTags.articleId, articleId));
    if (data.tagIds.length > 0) {
      await db.insert(articleTags).values(
        data.tagIds.map((tagId) => ({
          articleId,
          tagId,
        }))
      );
    }
  }

  // Update categories if provided
  if (data.categoryIds !== undefined) {
    await db
      .delete(articleCategories)
      .where(eq(articleCategories.articleId, articleId));
    if (data.categoryIds.length > 0) {
      await db.insert(articleCategories).values(
        data.categoryIds.map((categoryId) => ({
          articleId,
          categoryId,
        }))
      );
    }
  }

  return result.length > 0 ? result[0] : null;
}

/**
 * Delete an article
 * @param articleId - The article ID
 */
export async function deleteArticle(articleId: number) {
  const canEdit = await canUserEditArticle(articleId);
  if (!canEdit) {
    throw new Error('Unauthorized to delete this article');
  }

  await db.delete(articles).where(eq(articles.id, articleId));
}

/**
 * Get all categories for the current user's team
 * @returns Promise<Category[]>
 */
export async function getCategoriesForTeam() {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const team = await getTeamForUser();
  if (!team) {
    return null;
  }

  return await db
    .select()
    .from(categories)
    .where(eq(categories.teamId, team.id))
    .orderBy(categories.name);
}

/**
 * Get all tags for the current user's team
 * @returns Promise<Tag[]>
 */
export async function getTagsForTeam() {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const team = await getTeamForUser();
  if (!team) {
    return null;
  }

  return await db
    .select()
    .from(tags)
    .where(eq(tags.teamId, team.id))
    .orderBy(tags.name);
}

/**
 * Create a new category
 * @param name - Category name
 * @returns Promise<Category>
 */
export async function createCategory(name: string) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const team = await getTeamForUser();
  if (!team) {
    throw new Error('User not in a team');
  }

  const slug = generateSlug(name);

  const result = await db
    .insert(categories)
    .values({
      name,
      slug,
      teamId: team.id,
    })
    .returning();

  return result[0];
}

/**
 * Create a new tag
 * @param name - Tag name
 * @returns Promise<Tag>
 */
export async function createTag(name: string) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const team = await getTeamForUser();
  if (!team) {
    throw new Error('User not in a team');
  }

  const slug = generateSlug(name);

  const result = await db
    .insert(tags)
    .values({
      name,
      slug,
      teamId: team.id,
    })
    .returning();

  return result[0];
}
