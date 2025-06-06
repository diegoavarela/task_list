import { useState } from 'react';
import { Folder, ChevronRight, ChevronDown, FolderOpen, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Category } from '@/types/category';
import type { Task } from '@/types/task';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
  categories: Category[];
  tasks: Task[];
  selectedCategoryId: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  className?: string;
}

interface CategoryTreeNodeProps {
  category: Category;
  tasks: Task[];
  level: number;
  selectedCategoryId: string | null;
  expandedCategories: Set<string>;
  onCategorySelect: (categoryId: string | null) => void;
  onToggleExpand: (categoryId: string) => void;
}

function CategoryTreeNode({
  category,
  tasks,
  level,
  selectedCategoryId,
  expandedCategories,
  onCategorySelect,
  onToggleExpand
}: CategoryTreeNodeProps) {
  const taskCount = tasks.filter(task => task.categoryId === category.id).length;
  // For now, we'll handle child categories in the tree building logic
  const hasChildren = false; // Will be set properly when we build the tree
  const isExpanded = expandedCategories.has(category.id);
  const isSelected = selectedCategoryId === category.id;

  return (
    <div>
      <button
        onClick={() => onCategorySelect(category.id)}
        className={cn(
          "flex items-center gap-2 w-full p-2 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
          isSelected && "bg-primary/10 border border-primary/20",
          level > 0 && "ml-4"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(category.id);
            }}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 text-gray-500" />
            ) : (
              <ChevronRight className="h-3 w-3 text-gray-500" />
            )}
          </button>
        ) : (
          <div className="w-4 h-4" />
        )}
        
        <div 
          className="w-3 h-3 rounded-sm flex-shrink-0" 
          style={{ backgroundColor: category.color }}
        />
        
        {isExpanded && hasChildren ? (
          <FolderOpen className="h-3 w-3 text-gray-600 flex-shrink-0" />
        ) : (
          <Folder className="h-3 w-3 text-gray-600 flex-shrink-0" />
        )}
        
        <span className="flex-1 text-sm truncate">{category.name}</span>
        
        {taskCount > 0 && (
          <Badge variant="outline" className="text-xs h-5 px-1.5">
            {taskCount}
          </Badge>
        )}
      </button>
    </div>
  );
}

export function CategoryFilter({
  categories,
  tasks,
  selectedCategoryId,
  onCategorySelect,
  className
}: CategoryFilterProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Build category tree
  const buildCategoryTree = (): Category[] => {
    const categoryMap = new Map<string, Category & { children: Category[] }>();
    
    // First pass: create map with children arrays
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Second pass: build tree structure
    const rootCategories: Category[] = [];
    
    categories.forEach(category => {
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });

    // Sort by order then by name
    const sortCategories = (cats: Category[]) => {
      cats.sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return a.name.localeCompare(b.name);
      });
    };

    sortCategories(rootCategories);
    return rootCategories;
  };

  const categoryTree = buildCategoryTree();
  const uncategorizedTaskCount = tasks.filter(task => !task.categoryId).length;

  const handleToggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getSelectedCategoryName = () => {
    if (!selectedCategoryId) return null;
    const category = categories.find(c => c.id === selectedCategoryId);
    return category?.name || null;
  };

  const selectedCategoryName = getSelectedCategoryName();

  return (
    <div className={cn("space-y-2", className)}>
      {/* Selected category indicator */}
      {selectedCategoryName && (
        <div className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-lg">
          <Folder className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary flex-1">
            {selectedCategoryName}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCategorySelect(null)}
            className="h-6 w-6 p-0 text-primary hover:text-primary"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* All tasks option */}
      <button
        onClick={() => onCategorySelect(null)}
        className={cn(
          "flex items-center gap-2 w-full p-2 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
          !selectedCategoryId && "bg-primary/10 border border-primary/20"
        )}
      >
        <Folder className="h-3 w-3 text-gray-600" />
        <span className="flex-1 text-sm">All Tasks</span>
        <Badge variant="outline" className="text-xs h-5 px-1.5">
          {tasks.length}
        </Badge>
      </button>

      {/* Uncategorized tasks */}
      {uncategorizedTaskCount > 0 && (
        <button
          onClick={() => onCategorySelect('uncategorized')}
          className={cn(
            "flex items-center gap-2 w-full p-2 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
            selectedCategoryId === 'uncategorized' && "bg-primary/10 border border-primary/20"
          )}
        >
          <div className="w-3 h-3 border border-dashed border-gray-400 rounded-sm" />
          <Folder className="h-3 w-3 text-gray-400" />
          <span className="flex-1 text-sm text-gray-600">Uncategorized</span>
          <Badge variant="outline" className="text-xs h-5 px-1.5">
            {uncategorizedTaskCount}
          </Badge>
        </button>
      )}

      {/* Category tree */}
      <div className="space-y-1">
        {categoryTree.map((category) => (
          <CategoryTreeNode
            key={category.id}
            category={category}
            tasks={tasks}
            level={0}
            selectedCategoryId={selectedCategoryId}
            expandedCategories={expandedCategories}
            onCategorySelect={onCategorySelect}
            onToggleExpand={handleToggleExpand}
          />
        ))}
      </div>
    </div>
  );
}