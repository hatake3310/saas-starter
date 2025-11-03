'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Check } from 'lucide-react';
import { createCategoryAction } from '../actions';

interface Category {
  id: number;
  name: string;
  slug: string;
  teamId: number;
  createdAt: Date;
}

interface CategorySelectorProps {
  categories: Category[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

/**
 * Category selector component
 * Allows selecting existing categories and creating new ones
 * @param props - Category selector configuration
 */
export function CategorySelector({
  categories,
  selectedIds,
  onChange,
}: CategorySelectorProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleToggleCategory = (categoryId: number) => {
    if (selectedIds.includes(categoryId)) {
      onChange(selectedIds.filter((id) => id !== categoryId));
    } else {
      onChange([...selectedIds, categoryId]);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      const formData = new FormData();
      formData.append('name', newCategoryName);

      const result = await createCategoryAction({}, formData);

      if (result && 'success' in result && result.success && 'category' in result && result.category) {
        setNewCategoryName('');
        setIsAddingNew(false);
        // Add new category to selection
        onChange([...selectedIds, result.category.id]);
      } else if (result && 'error' in result && result.error) {
        setCreateError(result.error);
      }
    } catch (err) {
      setCreateError('Failed to create category');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      <Label className="mb-2">Categories</Label>
      <div className="space-y-2 mb-2">
        {categories.map((category) => {
          const isSelected = selectedIds.includes(category.id);
          return (
            <label
              key={category.id}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggleCategory(category.id)}
                className="sr-only"
                aria-label={`Category: ${category.name}`}
              />
              <div
                className={`flex items-center justify-center w-5 h-5 border-2 rounded transition-colors ${
                  isSelected
                    ? 'bg-primary border-primary'
                    : 'border-muted-foreground hover:border-primary'
                }`}
                aria-hidden="true"
              >
                {isSelected && (
                  <Check className="h-3 w-3 text-primary-foreground" />
                )}
              </div>
              <span className="text-sm">{category.name}</span>
            </label>
          );
        })}
      </div>

      {isAddingNew ? (
        <div className="space-y-2">
          <Input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="New category name"
            maxLength={100}
            aria-label="New category name"
          />
          {createError && (
            <p className="text-destructive text-sm" role="alert">
              {createError}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleCreateCategory}
              disabled={isCreating || !newCategoryName.trim()}
            >
              Create
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setIsAddingNew(false);
                setNewCategoryName('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setIsAddingNew(true)}
          aria-label="Add new category"
        >
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          <span className="ml-2">New Category</span>
        </Button>
      )}
    </div>
  );
}

