export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  parentId?: string; // For nested categories/folders
  order: number;
  isExpanded?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CategoryWithCount extends Category {
  taskCount: number;
  completedTaskCount: number;
  childCategories?: CategoryWithCount[];
}