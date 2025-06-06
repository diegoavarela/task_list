import { useState } from 'react';
import { Check, ChevronDown, X, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Tag } from '@/types/tag';
import { TagBadge } from './TagManager';

interface TagSelectorProps {
  tags: Tag[];
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function TagSelector({ 
  tags, 
  selectedTagIds, 
  onTagsChange, 
  placeholder = "Select tags...",
  className 
}: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedTags = tags.filter(tag => selectedTagIds.includes(tag.id));
  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTagIds, tagId]);
    }
  };

  const removeTag = (tagId: string) => {
    onTagsChange(selectedTagIds.filter(id => id !== tagId));
  };

  return (
    <div className={cn("relative", className)}>
      <div
        className="flex min-h-[2.75rem] w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {selectedTags.length > 0 ? (
            selectedTags.map(tag => (
              <div
                key={tag.id}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs"
                style={{ 
                  backgroundColor: `${tag.color}15`,
                  color: tag.color,
                  border: `1px solid ${tag.color}30`
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Hash className="h-3 w-3" />
                <span>{tag.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(tag.id);
                  }}
                  className="hover:bg-black/10 rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 opacity-50 transition-transform",
          isOpen && "rotate-180"
        )} />
      </div>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute top-full left-0 right-0 mt-1 z-50 p-2 max-h-60 overflow-auto">
            <div className="space-y-2">
              <Input
                placeholder="Search tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8"
                autoFocus
              />
              
              {filteredTags.length === 0 ? (
                <div className="text-sm text-muted-foreground p-2 text-center">
                  {searchTerm ? 'No tags found' : 'No tags available'}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredTags.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      className="w-full flex items-center justify-between p-2 rounded-md hover:bg-accent text-left"
                      onClick={() => toggleTag(tag.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-sm">{tag.name}</span>
                        {tag.description && (
                          <span className="text-xs text-muted-foreground">
                            - {tag.description}
                          </span>
                        )}
                      </div>
                      {selectedTagIds.includes(tag.id) && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}