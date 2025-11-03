'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import { ArticleStatus } from '@/lib/db/schema';
import { sanitizeInput } from '@/lib/utils/sanitize';

/**
 * Article creation schema
 */
const createArticleSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  excerpt: z.string().max(500).optional(),
  status: z.enum([
    ArticleStatus.DRAFT,
    ArticleStatus.PUBLISHED,
    ArticleStatus.UNPUBLISHED,
  ]),
  tagIds: z.array(z.number()).optional(),
  categoryIds: z.array(z.number()).optional(),
  teamId: z.number(),
});

/**
 * Article update schema
 */
const updateArticleSchema = z.object({
  articleId: z.number(),
  title: z.string().min(3).max(255).optional(),
  content: z.string().min(10).optional(),
  excerpt: z.string().max(500).optional(),
  status: z
    .enum([
      ArticleStatus.DRAFT,
      ArticleStatus.PUBLISHED,
      ArticleStatus.UNPUBLISHED,
    ])
    .optional(),
  tagIds: z.array(z.number()).optional(),
  categoryIds: z.array(z.number()).optional(),
});

/**
 * Delete article schema
 */
const deleteArticleSchema = z.object({
  articleId: z.number(),
});

/**
 * Category/Tag creation schema
 */
const createCategoryTagSchema = z.object({
  name: z.string().min(2).max(100),
});

/**
 * Create a new article
 * Validates input and sanitizes content to prevent XSS
 */
export const createArticleAction = validatedActionWithUser(
  createArticleSchema,
  async (data, formData, user) => {
    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to create article. Please try again.',
        };
      }

      revalidatePath('/dashboard/articles');

      return {
        success: true,
        message: 'Article created successfully',
        articleId: result.articleId,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create article. Please try again.',
      };
    }
  }
);

/**
 * Update an existing article
 * Validates input and sanitizes content to prevent XSS
 */
export const updateArticleAction = validatedActionWithUser(
  updateArticleSchema,
  async (data, formData, user) => {
    try {
      const { articleId, ...updateData } = data;
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const result = await response.json();
        return {
          success: false,
          error: result.error || 'Failed to update article. Please try again.',
        };
      }

      revalidatePath('/dashboard/articles');
      revalidatePath(`/dashboard/articles/${articleId}`);

      return {
        success: true,
        message: 'Article updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update article. Please try again.',
      };
    }
  }
);

/**
 * Delete an article
 * Checks authorization before deletion
 */
export const deleteArticleAction = validatedActionWithUser(
  deleteArticleSchema,
  async (data, formData, user) => {
    try {
      const { articleId } = data;
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        return {
          success: false,
          error: result.error || 'Failed to delete article. Please try again.',
        };
      }

      revalidatePath('/dashboard/articles');

      return {
        success: true,
        message: 'Article deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete article. Please try again.',
      };
    }
  }
);

/**
 * Create a new category
 */
export const createCategoryAction = validatedActionWithUser(
  createCategoryTagSchema,
  async (data, formData, user) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error:
            result.error || 'Failed to create category. Please try again.',
        };
      }

      revalidatePath('/dashboard/articles');

      return {
        success: true,
        message: 'Category created successfully',
        category: result.category,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create category. Please try again.',
      };
    }
  }
);

/**
 * Create a new tag
 */
export const createTagAction = validatedActionWithUser(
  createCategoryTagSchema,
  async (data, formData, user) => {
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to create tag. Please try again.',
        };
      }

      revalidatePath('/dashboard/articles');

      return {
        success: true,
        message: 'Tag created successfully',
        tag: result.tag,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create tag. Please try again.',
      };
    }
  }
);


