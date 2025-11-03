'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, X } from 'lucide-react';
import { createTagAction } from '../actions';

interface Tag {
  id: number;
  name: string;
  slug: string;
  teamId: number;
  createdAt: Date;
}

interface TagSelectorProps {
  tags: Tag[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

/**
 * Tag selector component
 * Allows selecting existing tags and creating new ones
 * @param props - Tag selector configuration
 */
export function TagSelector({ tags, selectedIds, onChange }: TagSelectorProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleToggleTag = (tagId: number) => {
    if (selectedIds.includes(tagId)) {
      onChange(selectedIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedIds, tagId]);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      const formData = new FormData();
      formData.append('name', newTagName);

      const result = await createTagAction({}, formData);

      if (result && 'success' in result && result.success && 'tag' in result && result.tag) {
        setNewTagName('');
        setIsAddingNew(false);
        // Add new tag to selection
        onChange([...selectedIds, result.tag.id]);
      } else if (result && 'error' in result && result.error) {
        setCreateError(result.error);
      }
    } catch (err) {
      setCreateError('Failed to create tag');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      <Label className="mb-2">Tags</Label>
      <div
        className="flex flex-wrap gap-2 mb-2"
        role="group"
        aria-label="Select tags"
      >
        {tags.map((tag) => {
          const isSelected = selectedIds.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleToggleTag(tag.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
              aria-pressed={isSelected}
              aria-label={`Tag: ${tag.name}`}
            >
              {tag.name}
              {isSelected && (
                <X className="inline-block ml-1 h-3 w-3" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>

      {isAddingNew ? (
        <div className="space-y-2">
          <Input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="New tag name"
            maxLength={50}
            aria-label="New tag name"
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
              onClick={handleCreateTag}
              disabled={isCreating || !newTagName.trim()}
            >
              Create
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setIsAddingNew(false);
                setNewTagName('');
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
          aria-label="Add new tag"
        >
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          <span className="ml-2">New Tag</span>
        </Button>
      )}
    </div>
  );
}

