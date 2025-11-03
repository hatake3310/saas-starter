'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Eye } from 'lucide-react';
import { ArticleStatus } from '@/lib/db/schema';
import { createArticleAction, updateArticleAction } from '../actions';
import { TagSelector } from './tag-selector';
import { CategorySelector } from './category-selector';

interface Category {
  id: number;
  name: string;
  slug: string;
  teamId: number;
  createdAt: Date;
}

interface Tag {
  id: number;
  name: string;
  slug: string;
  teamId: number;
  createdAt: Date;
}

interface Article {
  id: number;
  title: string;
  content: string;
  excerpt?: string | null;
  status: string;
  articleTags?: { tag: Tag }[];
  articleCategories?: { category: Category }[];
}

interface ArticleFormProps {
  mode: 'create' | 'edit';
  article?: Article;
  categories: Category[];
  tags: Tag[];
  teamId: number;
}

/**
 * Article form component
 * Handles both creation and editing of articles
 * @param props - Form configuration
 */
export function ArticleForm({
  mode,
  article,
  categories,
  tags,
  teamId,
}: ArticleFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(article?.title || '');
  const [content, setContent] = useState(article?.content || '');
  const [excerpt, setExcerpt] = useState(article?.excerpt || '');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    article?.articleTags?.map((at) => at.tag.id) || []
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(
    article?.articleCategories?.map((ac) => ac.category.id) || []
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (status: string) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();

      if (mode === 'edit' && article) {
        formData.append('articleId', article.id.toString());
      } else {
        formData.append('teamId', teamId.toString());
      }

      formData.append('title', title);
      formData.append('content', content);
      if (excerpt) formData.append('excerpt', excerpt);
      formData.append('status', status);

      selectedTagIds.forEach((tagId) => {
        formData.append('tagIds', tagId.toString());
      });

      selectedCategoryIds.forEach((categoryId) => {
        formData.append('categoryIds', categoryId.toString());
      });

      const action = mode === 'create' ? createArticleAction : updateArticleAction;
      const result = await action({}, formData);

      if (result && 'success' in result && result.success) {
        setSuccess(result.message || 'Article saved successfully');
        router.push('/dashboard/articles');
      } else if (result && 'error' in result && result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const characterCount = content.length;
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'New Article' : 'Edit Article'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="title" className="mb-2">
            Title
            <span className="text-destructive" aria-label="required">
              *
            </span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter article title"
            required
            maxLength={255}
            aria-required="true"
            aria-invalid={error ? 'true' : 'false'}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {title.length}/255 characters
          </p>
        </div>

        <div>
          <Label htmlFor="excerpt" className="mb-2">
            Excerpt
          </Label>
          <textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Brief description for SEO and previews"
            maxLength={500}
            className="w-full min-h-[80px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            aria-describedby="excerpt-help"
          />
          <p
            id="excerpt-help"
            className="text-xs text-muted-foreground mt-1"
          >
            {excerpt.length}/500 characters. Leave empty to auto-generate from
            content.
          </p>
        </div>

        <div>
          <Label htmlFor="content" className="mb-2">
            Content
            <span className="text-destructive" aria-label="required">
              *
            </span>
          </Label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your article content here..."
            required
            className="w-full min-h-[400px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            aria-required="true"
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby="content-stats"
          />
          <p
            id="content-stats"
            className="text-xs text-muted-foreground mt-1"
          >
            {characterCount} characters | {wordCount} words
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CategorySelector
            categories={categories}
            selectedIds={selectedCategoryIds}
            onChange={setSelectedCategoryIds}
          />

          <TagSelector
            tags={tags}
            selectedIds={selectedTagIds}
            onChange={setSelectedTagIds}
          />
        </div>

        {error && (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        )}

        {success && (
          <p className="text-green-600 text-sm" role="status">
            {success}
          </p>
        )}

        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit(ArticleStatus.DRAFT)}
            disabled={isSubmitting || !title || !content}
            aria-label="Save as draft"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span className="ml-2">Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" aria-hidden="true" />
                <span className="ml-2">Save Draft</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => handleSubmit(ArticleStatus.PUBLISHED)}
            disabled={isSubmitting || !title || !content}
            aria-label="Publish article"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span className="ml-2">Publishing...</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" aria-hidden="true" />
                <span className="ml-2">Publish</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

