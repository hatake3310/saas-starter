'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { deleteArticleAction } from '../actions';

interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  status: string;
  authorId: number;
  authorName: string | null;
  teamId: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ArticleListProps {
  articles: Article[];
}

/**
 * Formats a date for display
 * @param date - Date to format
 * @returns Formatted date string
 */
function formatDate(date: Date | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Returns status badge styling
 * @param status - Article status
 * @returns Status badge component
 */
function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; className: string }> = {
    draft: {
      label: 'Draft',
      className: 'bg-secondary text-secondary-foreground',
    },
    published: {
      label: 'Published',
      className: 'bg-green-200 text-green-800',
    },
    unpublished: {
      label: 'Unpublished',
      className: 'bg-yellow-200 text-yellow-800',
    },
  };

  const statusInfo = statusMap[status] || statusMap.draft;

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}
      role="status"
      aria-label={`Status: ${statusInfo.label}`}
    >
      {statusInfo.label}
    </span>
  );
}

/**
 * Article list item component
 * Displays individual article with actions
 */
function ArticleListItem({ article }: { article: Article }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this article?')) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const formData = new FormData();
      formData.append('articleId', article.id.toString());

      const result = await deleteArticleAction({}, formData);

      if (result && 'error' in result && result.error) {
        setDeleteError(result.error);
      }
    } catch (err) {
      setDeleteError('Failed to delete article');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold">{article.title}</h3>
            {getStatusBadge(article.status)}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {article.excerpt ||
              article.content.substring(0, 150) +
                (article.content.length > 150 ? '...' : '')}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Author: {article.authorName || 'Unknown'}</span>
            <span>Updated: {formatDate(article.updatedAt)}</span>
            {article.publishedAt && (
              <span>Published: {formatDate(article.publishedAt)}</span>
            )}
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          <Link href={`/dashboard/articles/${article.id}`}>
            <Button
              variant="outline"
              size="sm"
              aria-label={`View article: ${article.title}`}
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <Link href={`/dashboard/articles/${article.id}/edit`}>
            <Button
              variant="outline"
              size="sm"
              aria-label={`Edit article: ${article.title}`}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label={`Delete article: ${article.title}`}
            className="text-destructive hover:text-destructive"
          >
            <Trash2
              className={`h-4 w-4 ${isDeleting ? 'text-muted-foreground' : ''}`}
              aria-hidden="true"
            />
          </Button>
        </div>
      </div>
      {deleteError && (
        <p className="text-destructive text-sm mt-2" role="alert">
          {deleteError}
        </p>
      )}
    </div>
  );
}

/**
 * Article list component
 * Displays all articles with interactive controls
 */
export function ArticleList({ articles }: ArticleListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Articles</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4" role="list">
          {articles.map((article) => (
            <div key={article.id} role="listitem">
              <ArticleListItem article={article} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

