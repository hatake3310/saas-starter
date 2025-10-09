import { desc, and, eq, isNull } from 'drizzle-orm';
import { db } from './drizzle';
import { activityLogs, teamMembers, teams, users, articles } from './schema';
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
      content: articles.content,
      status: articles.status,
      authorId: articles.authorId,
      authorName: users.name,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
      publishedAt: articles.publishedAt,
    })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(eq(articles.teamId, team.id))
    .orderBy(desc(articles.updatedAt));
}

export async function getArticleById(articleId: number) {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const team = await getTeamForUser();
  if (!team) {
    return null;
  }

  const result = await db
    .select()
    .from(articles)
    .where(and(eq(articles.id, articleId), eq(articles.teamId, team.id)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function createArticle(data: {
  title: string;
  content: string;
  status?: string;
}) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const team = await getTeamForUser();
  if (!team) {
    throw new Error('User not in a team');
  }

  const result = await db
    .insert(articles)
    .values({
      title: data.title,
      content: data.content,
      status: data.status || 'draft',
      authorId: user.id,
      teamId: team.id,
      publishedAt: data.status === 'published' ? new Date() : null,
    })
    .returning();

  return result[0];
}

export async function updateArticle(
  articleId: number,
  data: {
    title?: string;
    content?: string;
    status?: string;
  }
) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const team = await getTeamForUser();
  if (!team) {
    throw new Error('User not in a team');
  }

  const updateData: any = {
    ...data,
    updatedAt: new Date(),
  };

  if (data.status === 'published') {
    const article = await getArticleById(articleId);
    if (article && !article.publishedAt) {
      updateData.publishedAt = new Date();
    }
  }

  const result = await db
    .update(articles)
    .set(updateData)
    .where(and(eq(articles.id, articleId), eq(articles.teamId, team.id)))
    .returning();

  return result.length > 0 ? result[0] : null;
}

export async function deleteArticle(articleId: number) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const team = await getTeamForUser();
  if (!team) {
    throw new Error('User not in a team');
  }

  await db
    .delete(articles)
    .where(and(eq(articles.id, articleId), eq(articles.teamId, team.id)));
}
