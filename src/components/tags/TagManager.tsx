import { useState } from 'react';
import { Plus, Trash2, Edit2, X, Check, Tag as TagIcon, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Tag } from '@/types/tag';
import { format } from 'date-fns';

interface TagManagerProps {
  tags: Tag[];
  onAddTag: (tag: Omit<Tag, 'id' | 'createdAt'>) => void;
  onUpdateTag: (tagId: string, updates: Partial<Tag>) => void;
  onDeleteTag: (tagId: string) => void;
}

const TAG_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', 
  '#3b82f6', '#8b5cf6', '#ec4899', '#64748b', '#0f172a'
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

function ColorPicker({ value, onChange, className = '' }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        className={cn(
          "w-8 h-8 rounded-lg border-2 border-border transition-all hover:scale-105 focus:ring-2 focus:ring-ring focus:ring-offset-2",
          className
        )}
        style={{ backgroundColor: value }}
        onClick={() => setIsOpen(!isOpen)}
      />
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 p-3 bg-card rounded-lg shadow-lg border z-50">
            <div className="grid grid-cols-5 gap-2">
              {TAG_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    "w-8 h-8 rounded-lg border-2 transition-all hover:scale-110",
                    value === color ? 'border-foreground ring-2 ring-ring' : 'border-border hover:border-foreground/50'
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    onChange(color);
                    setIsOpen(false);
                  }}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface TagBadgeProps {
  tag: Tag;
  size?: 'sm' | 'md';
  interactive?: boolean;
  onEdit?: (tag: Tag) => void;
  onDelete?: (tagId: string) => void;
}

function TagBadge({ tag, size = 'md', interactive = false, onEdit, onDelete }: TagBadgeProps) {
  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium transition-all",
        size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        interactive && 'hover:scale-105 cursor-pointer group'
      )}
      style={{ 
        backgroundColor: `${tag.color}15`,
        color: tag.color,
        border: `1px solid ${tag.color}30`
      }}
    >
      <Hash className={cn(size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />
      <span>{tag.name}</span>
      {interactive && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(tag);
              }}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(tag.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function TagManager({ tags, onAddTag, onUpdateTag, onDeleteTag }: TagManagerProps) {
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [newTagDescription, setNewTagDescription] = useState('');
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAddTag = () => {
    if (newTagName.trim()) {
      onAddTag({
        name: newTagName.trim(),
        color: newTagColor,
        description: newTagDescription.trim() || undefined
      });
      setNewTagName('');
      setNewTagDescription('');
      setNewTagColor(TAG_COLORS[0]);
      toast({
        title: "Tag created",
        description: "Your tag has been created successfully.",
      });
    }
  };

  const handleEditTag = () => {
    if (editingTag && editingTag.name.trim()) {
      onUpdateTag(editingTag.id, {
        name: editingTag.name.trim(),
        color: editingTag.color,
        description: editingTag.description?.trim() || undefined
      });
      setEditingTag(null);
      toast({
        title: "Tag updated",
        description: "Your tag has been updated successfully.",
      });
    }
  };

  const handleDeleteTag = (tagId: string) => {
    setTagToDelete(tagId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTag = () => {
    if (tagToDelete) {
      onDeleteTag(tagToDelete);
      setDeleteDialogOpen(false);
      setTagToDelete(null);
      toast({
        title: "Tag deleted",
        description: "Your tag has been deleted successfully.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Tag */}
      <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <TagIcon className="h-5 w-5 text-primary" />
            Create New Tag
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="Tag name..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newTagName.trim()) {
                    handleAddTag();
                  }
                }}
                className="flex-1"
                autoFocus
              />
              <ColorPicker
                value={newTagColor}
                onChange={setNewTagColor}
              />
              <Button 
                onClick={handleAddTag}
                disabled={!newTagName.trim()}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Tag
              </Button>
            </div>
            <Input
              placeholder="Description (optional)..."
              value={newTagDescription}
              onChange={(e) => setNewTagDescription(e.target.value)}
              className="text-sm"
            />
            {newTagName.trim() && (
              <div className="pt-2">
                <span className="text-sm text-muted-foreground mb-2 block">Preview:</span>
                <TagBadge tag={{ 
                  id: 'preview', 
                  name: newTagName.trim(), 
                  color: newTagColor, 
                  createdAt: new Date() 
                }} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tags List */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            Tags ({tags.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <div className="empty-state py-8">
              <TagIcon className="empty-state-icon" />
              <h3 className="empty-state-title">No tags yet</h3>
              <p className="empty-state-description">
                Create your first tag to organize your tasks better.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tags.map((tag) => (
                <div 
                  key={tag.id} 
                  className="group flex items-center justify-between p-4 rounded-lg border bg-card transition-all duration-200 hover:shadow-sm hover:border-border"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-4 h-4 rounded-full ring-2 ring-offset-2 ring-offset-background transition-all"
                      style={{ backgroundColor: tag.color, ringColor: `${tag.color}40` }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-medium">{tag.name}</h4>
                        <TagBadge tag={tag} size="sm" />
                      </div>
                      {tag.description && (
                        <p className="text-sm text-muted-foreground">{tag.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Created {format(new Date(tag.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingTag(tag)}
                            className="h-8 w-8"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit tag</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTag(tag.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete tag</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Tag Dialog */}
      <Dialog open={!!editingTag} onOpenChange={() => setEditingTag(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex gap-3">
              <Input
                value={editingTag?.name || ''}
                onChange={(e) => setEditingTag(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="Tag name"
                className="flex-1"
              />
              <ColorPicker
                value={editingTag?.color || TAG_COLORS[0]}
                onChange={(color) => setEditingTag(prev => prev ? { ...prev, color } : null)}
              />
            </div>
            <Input
              value={editingTag?.description || ''}
              onChange={(e) => setEditingTag(prev => prev ? { ...prev, description: e.target.value } : null)}
              placeholder="Description (optional)"
            />
            {editingTag && (
              <div className="pt-2">
                <span className="text-sm text-muted-foreground mb-2 block">Preview:</span>
                <TagBadge tag={editingTag} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditingTag(null)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditTag}
              disabled={!editingTag?.name.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this tag? This will remove it from all associated tasks.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteTag}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Export TagBadge for use in other components
export { TagBadge };