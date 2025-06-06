import { useState } from 'react';
import { Folder, Plus, Edit, Trash2, ChevronRight, ChevronDown, FolderOpen, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import type { Category, CategoryWithCount } from '@/types/category';
import type { Task } from '@/types/task';
import { cn } from '@/lib/utils';

interface CategoryManagerProps {
  categories: Category[];
  tasks: Task[];
  onCategoryCreate: (category: Omit<Category, 'id' | 'createdAt' | 'order'>) => void;
  onCategoryUpdate: (categoryId: string, updates: Partial<Category>) => void;
  onCategoryDelete: (categoryId: string) => void;
  onClose: () => void;
}

const DEFAULT_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#64748b', '#374151', '#111827'
];

const CATEGORY_ICONS = [
  'folder', 'folder-open', 'briefcase', 'home', 'user',
  'users', 'settings', 'star', 'heart', 'bookmark',
  'tag', 'flag', 'target', 'zap', 'trending-up'
];

interface CategoryTreeNodeProps {
  category: CategoryWithCount;
  level: number;
  expandedCategories: Set<string>;
  onToggleExpand: (categoryId: string) => void;
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
  onAddChild: (parentId: string) => void;
}

function CategoryTreeNode({
  category,
  level,
  expandedCategories,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddChild
}: CategoryTreeNodeProps) {
  const hasChildren = category.childCategories && category.childCategories.length > 0;
  const isExpanded = expandedCategories.has(category.id);

  return (
    <div className="select-none">
      <div 
        className={cn(
          "flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 group cursor-pointer",
          level > 0 && "ml-6"
        )}
        style={{ paddingLeft: `${level * 24 + 8}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => onToggleExpand(category.id)}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </button>
        ) : (
          <div className="w-5 h-5" />
        )}
        
        <div 
          className="w-4 h-4 rounded" 
          style={{ backgroundColor: category.color }}
        />
        
        {isExpanded && hasChildren ? (
          <FolderOpen className="h-4 w-4 text-gray-600" />
        ) : (
          <Folder className="h-4 w-4 text-gray-600" />
        )}
        
        <span className="flex-1 text-sm font-medium">{category.name}</span>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {category.taskCount}
          </Badge>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(category)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddChild(category.id)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Subcategory
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(category.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {isExpanded && hasChildren && (
        <div>
          {category.childCategories?.map((child) => (
            <CategoryTreeNode
              key={child.id}
              category={child}
              level={level + 1}
              expandedCategories={expandedCategories}
              onToggleExpand={onToggleExpand}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryManager({
  categories,
  tasks,
  onCategoryCreate,
  onCategoryUpdate,
  onCategoryDelete,
  onClose
}: CategoryManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [parentCategoryId, setParentCategoryId] = useState<string>('');
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [categoryColor, setCategoryColor] = useState(DEFAULT_COLORS[0]);
  const [categoryIcon, setCategoryIcon] = useState('folder');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Build category tree with task counts
  const buildCategoryTree = (): CategoryWithCount[] => {
    const categoryMap = new Map<string, CategoryWithCount>();
    
    // First pass: convert categories and calculate task counts
    categories.forEach(category => {
      const tasksInCategory = tasks.filter(task => task.categoryId === category.id);
      const completedTasks = tasksInCategory.filter(task => task.completed);
      
      categoryMap.set(category.id, {
        ...category,
        taskCount: tasksInCategory.length,
        completedTaskCount: completedTasks.length,
        childCategories: []
      });
    });

    // Second pass: build tree structure
    const rootCategories: CategoryWithCount[] = [];
    
    categories.forEach(category => {
      const categoryWithCount = categoryMap.get(category.id)!;
      
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.childCategories = parent.childCategories || [];
          parent.childCategories.push(categoryWithCount);
        }
      } else {
        rootCategories.push(categoryWithCount);
      }
    });

    // Sort by order then by name
    const sortCategories = (cats: CategoryWithCount[]) => {
      cats.sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return a.name.localeCompare(b.name);
      });
      cats.forEach(cat => {
        if (cat.childCategories) {
          sortCategories(cat.childCategories);
        }
      });
    };

    sortCategories(rootCategories);
    return rootCategories;
  };

  const categoryTree = buildCategoryTree();

  const handleToggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCreateCategory = () => {
    if (!categoryName.trim()) {
      toast({
        title: "Missing required field",
        description: "Please enter a category name.",
        variant: "destructive"
      });
      return;
    }

    const maxOrder = Math.max(0, ...categories.map(c => c.order || 0));
    
    onCategoryCreate({
      name: categoryName.trim(),
      description: categoryDescription || undefined,
      color: categoryColor,
      icon: categoryIcon,
      parentId: parentCategoryId && parentCategoryId !== "none" ? parentCategoryId : undefined,
      order: maxOrder + 1,
      isExpanded: true
    });

    resetForm();
    setShowCreateDialog(false);
    
    toast({
      title: "Category created",
      description: "Your category has been created successfully."
    });
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryDescription(category.description || '');
    setCategoryColor(category.color);
    setCategoryIcon(category.icon || 'folder');
    setParentCategoryId(category.parentId || '');
    setShowCreateDialog(true);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !categoryName.trim()) {
      return;
    }

    const updates: Partial<Category> = {
      name: categoryName.trim(),
      description: categoryDescription || undefined,
      color: categoryColor,
      icon: categoryIcon,
      parentId: parentCategoryId && parentCategoryId !== "none" ? parentCategoryId : undefined,
      updatedAt: new Date()
    };

    onCategoryUpdate(editingCategory.id, updates);
    resetForm();
    setShowCreateDialog(false);
    setEditingCategory(null);
    
    toast({
      title: "Category updated",
      description: "Your category has been updated successfully."
    });
  };

  const handleAddChild = (parentId: string) => {
    setParentCategoryId(parentId);
    setShowCreateDialog(true);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const categoryWithTasks = tasks.some(task => task.categoryId === categoryId);
    const hasSubcategories = categories.some(cat => cat.parentId === categoryId);
    
    if (categoryWithTasks || hasSubcategories) {
      toast({
        title: "Cannot delete category",
        description: "This category contains tasks or subcategories. Please move them first.",
        variant: "destructive"
      });
      return;
    }

    onCategoryDelete(categoryId);
    toast({
      title: "Category deleted",
      description: "Your category has been deleted successfully."
    });
  };

  const resetForm = () => {
    setCategoryName('');
    setCategoryDescription('');
    setCategoryColor(DEFAULT_COLORS[0]);
    setCategoryIcon('folder');
    setParentCategoryId('');
  };

  const getAvailableParents = () => {
    if (!editingCategory) return categories.filter(c => !c.parentId);
    
    // Prevent circular references - exclude the category being edited and its descendants
    const getDescendants = (categoryId: string): string[] => {
      const descendants = [categoryId];
      categories
        .filter(c => c.parentId === categoryId)
        .forEach(child => {
          descendants.push(...getDescendants(child.id));
        });
      return descendants;
    };
    
    const excludeIds = getDescendants(editingCategory.id);
    return categories.filter(c => !excludeIds.includes(c.id) && !c.parentId);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Categories & Folders
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Category
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 overflow-y-auto max-h-[60vh]">
          {categoryTree.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No categories yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first category to organize your tasks
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Category
              </Button>
            </div>
          ) : (
            <div className="p-4 space-y-1">
              {categoryTree.map((category) => (
                <CategoryTreeNode
                  key={category.id}
                  category={category}
                  level={0}
                  expandedCategories={expandedCategories}
                  onToggleExpand={handleToggleExpand}
                  onEdit={handleEditCategory}
                  onDelete={handleDeleteCategory}
                  onAddChild={handleAddChild}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Category Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Category Name</label>
              <Input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g., Personal, Work, Projects"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Description (Optional)</label>
              <Textarea
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                placeholder="Brief description of this category"
                rows={2}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Parent Category (Optional)</label>
              <Select value={parentCategoryId || "none"} onValueChange={(value) => setParentCategoryId(value === "none" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="None (top level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (top level)</SelectItem>
                  {getAvailableParents().map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Color</label>
              <div className="grid grid-cols-10 gap-2">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-6 h-6 rounded border-2",
                      categoryColor === color ? "border-gray-400" : "border-gray-200"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setCategoryColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setEditingCategory(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}>
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}