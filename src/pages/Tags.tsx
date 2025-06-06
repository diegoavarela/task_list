import { TagManager } from '@/components/tags/TagManager';
import type { Tag } from '@/types/tag';

interface TagsPageProps {
  tags: Tag[];
  onAddTag: (tag: Omit<Tag, 'id' | 'createdAt'>) => void;
  onUpdateTag: (tagId: string, updates: Partial<Tag>) => void;
  onDeleteTag: (tagId: string) => void;
}

export function TagsPage({ tags, onAddTag, onUpdateTag, onDeleteTag }: TagsPageProps) {
  return (
    <TagManager 
      tags={tags}
      onAddTag={onAddTag}
      onUpdateTag={onUpdateTag}
      onDeleteTag={onDeleteTag}
    />
  );
}