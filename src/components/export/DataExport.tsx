import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Calendar, Settings, CheckSquare, Building2, Folder, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import type { Task } from '@/types/task';
import type { Company } from '@/types/company';
import type { Tag } from '@/types/tag';
import type { Category } from '@/types/category';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DataExportProps {
  tasks: Task[];
  companies: Company[];
  tags: Tag[];
  categories: Category[];
  onClose: () => void;
}

type ExportFormat = 'csv' | 'pdf';
type ExportType = 'tasks' | 'companies' | 'categories' | 'tags' | 'analytics' | 'custom';

interface ExportOptions {
  format: ExportFormat;
  type: ExportType;
  includeCompleted: boolean;
  includeArchived: boolean;
  dateRange: {
    start?: Date;
    end?: Date;
  };
  selectedCompanies: string[];
  selectedCategories: string[];
  selectedTags: string[];
  customFields: {
    tasks: string[];
    companies: string[];
    categories: string[];
    tags: string[];
  };
}

const TASK_FIELDS = [
  { id: 'name', label: 'Task Name', default: true },
  { id: 'company', label: 'Company', default: true },
  { id: 'category', label: 'Category', default: true },
  { id: 'priority', label: 'Priority', default: true },
  { id: 'status', label: 'Status', default: true },
  { id: 'completed', label: 'Completed', default: true },
  { id: 'createdAt', label: 'Created Date', default: true },
  { id: 'dueDate', label: 'Due Date', default: true },
  { id: 'dueTime', label: 'Due Time', default: false },
  { id: 'completedAt', label: 'Completed Date', default: false },
  { id: 'tags', label: 'Tags', default: true },
  { id: 'notes', label: 'Notes', default: false },
  { id: 'subtasks', label: 'Subtasks Count', default: false },
  { id: 'dependencies', label: 'Dependencies', default: false },
  { id: 'isRecurring', label: 'Is Recurring', default: false },
];

const COMPANY_FIELDS = [
  { id: 'name', label: 'Company Name', default: true },
  { id: 'color', label: 'Color', default: true },
  { id: 'createdAt', label: 'Created Date', default: true },
  { id: 'taskCount', label: 'Task Count', default: true },
];

const CATEGORY_FIELDS = [
  { id: 'name', label: 'Category Name', default: true },
  { id: 'color', label: 'Color', default: true },
  { id: 'description', label: 'Description', default: true },
  { id: 'parentId', label: 'Parent Category', default: true },
  { id: 'createdAt', label: 'Created Date', default: true },
  { id: 'taskCount', label: 'Task Count', default: true },
];

const TAG_FIELDS = [
  { id: 'name', label: 'Tag Name', default: true },
  { id: 'color', label: 'Color', default: true },
  { id: 'createdAt', label: 'Created Date', default: true },
  { id: 'taskCount', label: 'Task Count', default: true },
];

export function DataExport({ tasks, companies, tags, categories, onClose }: DataExportProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    type: 'tasks',
    includeCompleted: true,
    includeArchived: false,
    dateRange: {},
    selectedCompanies: [],
    selectedCategories: [],
    selectedTags: [],
    customFields: {
      tasks: TASK_FIELDS.filter(f => f.default).map(f => f.id),
      companies: COMPANY_FIELDS.filter(f => f.default).map(f => f.id),
      categories: CATEGORY_FIELDS.filter(f => f.default).map(f => f.id),
      tags: TAG_FIELDS.filter(f => f.default).map(f => f.id),
    }
  });

  const { toast } = useToast();

  const getCompanyName = (companyId: string) => {
    return companies.find(c => c.id === companyId)?.name || 'Unknown Company';
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Uncategorized';
  };

  const getTagNames = (tagIds: string[]) => {
    return tagIds.map(tagId => tags.find(t => t.id === tagId)?.name || 'Unknown Tag').join(', ');
  };

  const filterTasks = () => {
    let filtered = tasks;

    // Filter by completion status
    if (!exportOptions.includeCompleted) {
      filtered = filtered.filter(task => !task.completed);
    }

    // Filter by archived status
    if (!exportOptions.includeArchived) {
      filtered = filtered.filter(task => !task.isArchived);
    }

    // Filter by date range
    if (exportOptions.dateRange.start || exportOptions.dateRange.end) {
      filtered = filtered.filter(task => {
        const taskDate = new Date(task.createdAt);
        if (exportOptions.dateRange.start && taskDate < exportOptions.dateRange.start) return false;
        if (exportOptions.dateRange.end && taskDate > exportOptions.dateRange.end) return false;
        return true;
      });
    }

    // Filter by companies
    if (exportOptions.selectedCompanies.length > 0) {
      filtered = filtered.filter(task => exportOptions.selectedCompanies.includes(task.companyId));
    }

    // Filter by categories
    if (exportOptions.selectedCategories.length > 0) {
      filtered = filtered.filter(task => 
        task.categoryId && exportOptions.selectedCategories.includes(task.categoryId)
      );
    }

    // Filter by tags
    if (exportOptions.selectedTags.length > 0) {
      filtered = filtered.filter(task => 
        task.tagIds && task.tagIds.some(tagId => exportOptions.selectedTags.includes(tagId))
      );
    }

    return filtered;
  };

  const generateCSV = (data: any[], headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        row.map((cell: any) => {
          // Escape quotes and wrap in quotes if contains comma
          const cellStr = String(cell || '');
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  };

  const generateTasksCSV = () => {
    const filteredTasks = filterTasks();
    const fields = exportOptions.customFields.tasks;
    
    const headers = fields.map(fieldId => {
      const field = TASK_FIELDS.find(f => f.id === fieldId);
      return field?.label || fieldId;
    });

    const data = filteredTasks.map(task => {
      return fields.map(fieldId => {
        switch (fieldId) {
          case 'name': return task.name;
          case 'company': return getCompanyName(task.companyId);
          case 'category': return task.categoryId ? getCategoryName(task.categoryId) : 'Uncategorized';
          case 'priority': return task.priority;
          case 'status': return task.status;
          case 'completed': return task.completed ? 'Yes' : 'No';
          case 'createdAt': return format(new Date(task.createdAt), 'yyyy-MM-dd HH:mm:ss');
          case 'dueDate': return task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '';
          case 'dueTime': return task.dueTime || '';
          case 'completedAt': return task.completedAt ? format(new Date(task.completedAt), 'yyyy-MM-dd HH:mm:ss') : '';
          case 'tags': return task.tagIds ? getTagNames(task.tagIds) : '';
          case 'notes': return task.notes || '';
          case 'subtasks': return task.subtasks?.length || 0;
          case 'dependencies': return task.dependencies?.length || 0;
          case 'isRecurring': return task.isRecurring ? 'Yes' : 'No';
          default: return '';
        }
      });
    });

    return generateCSV(data, headers);
  };

  const generateCompaniesCSV = () => {
    const fields = exportOptions.customFields.companies;
    
    const headers = fields.map(fieldId => {
      const field = COMPANY_FIELDS.find(f => f.id === fieldId);
      return field?.label || fieldId;
    });

    const data = companies.map(company => {
      const taskCount = tasks.filter(task => task.companyId === company.id).length;
      
      return fields.map(fieldId => {
        switch (fieldId) {
          case 'name': return company.name;
          case 'color': return company.color;
          case 'createdAt': return format(new Date(company.createdAt), 'yyyy-MM-dd HH:mm:ss');
          case 'taskCount': return taskCount;
          default: return '';
        }
      });
    });

    return generateCSV(data, headers);
  };

  const generateCategoriesCSV = () => {
    const fields = exportOptions.customFields.categories;
    
    const headers = fields.map(fieldId => {
      const field = CATEGORY_FIELDS.find(f => f.id === fieldId);
      return field?.label || fieldId;
    });

    const data = categories.map(category => {
      const taskCount = tasks.filter(task => task.categoryId === category.id).length;
      
      return fields.map(fieldId => {
        switch (fieldId) {
          case 'name': return category.name;
          case 'color': return category.color;
          case 'description': return category.description || '';
          case 'parentId': return category.parentId ? getCategoryName(category.parentId) : '';
          case 'createdAt': return format(new Date(category.createdAt), 'yyyy-MM-dd HH:mm:ss');
          case 'taskCount': return taskCount;
          default: return '';
        }
      });
    });

    return generateCSV(data, headers);
  };

  const generateTagsCSV = () => {
    const fields = exportOptions.customFields.tags;
    
    const headers = fields.map(fieldId => {
      const field = TAG_FIELDS.find(f => f.id === fieldId);
      return field?.label || fieldId;
    });

    const data = tags.map(tag => {
      const taskCount = tasks.filter(task => task.tagIds?.includes(tag.id)).length;
      
      return fields.map(fieldId => {
        switch (fieldId) {
          case 'name': return tag.name;
          case 'color': return tag.color;
          case 'createdAt': return format(new Date(tag.createdAt), 'yyyy-MM-dd HH:mm:ss');
          case 'taskCount': return taskCount;
          default: return '';
        }
      });
    });

    return generateCSV(data, headers);
  };

  const generateAnalyticsCSV = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const overdueTasks = tasks.filter(t => {
      if (!t.dueDate || t.completed) return false;
      const dueDate = typeof t.dueDate === 'string' ? new Date(t.dueDate) : t.dueDate;
      return dueDate < new Date();
    }).length;

    const analytics = [
      ['Metric', 'Value'],
      ['Total Tasks', totalTasks],
      ['Completed Tasks', completedTasks],
      ['Active Tasks', totalTasks - completedTasks],
      ['Overdue Tasks', overdueTasks],
      ['Completion Rate', `${((completedTasks / totalTasks) * 100).toFixed(1)}%`],
      ['Total Companies', companies.length],
      ['Total Categories', categories.length],
      ['Total Tags', tags.length],
    ];

    return analytics.map(row => row.join(',')).join('\n');
  };

  const generatePDF = async () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Task Management Export', 20, 20);
    
    // Add export info
    doc.setFontSize(12);
    doc.text(`Export Date: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, 20, 35);
    doc.text(`Export Type: ${exportOptions.type}`, 20, 45);
    
    let yPosition = 60;

    switch (exportOptions.type) {
      case 'tasks':
        const filteredTasks = filterTasks();
        const taskHeaders = exportOptions.customFields.tasks.map(fieldId => {
          const field = TASK_FIELDS.find(f => f.id === fieldId);
          return field?.label || fieldId;
        });
        
        const taskData = filteredTasks.map(task => {
          return exportOptions.customFields.tasks.map(fieldId => {
            switch (fieldId) {
              case 'name': return task.name;
              case 'company': return getCompanyName(task.companyId);
              case 'category': return task.categoryId ? getCategoryName(task.categoryId) : 'Uncategorized';
              case 'priority': return task.priority;
              case 'status': return task.status;
              case 'completed': return task.completed ? 'Yes' : 'No';
              case 'createdAt': return format(new Date(task.createdAt), 'yyyy-MM-dd');
              case 'dueDate': return task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '';
              default: return '';
            }
          });
        });

        autoTable(doc, {
          head: [taskHeaders],
          body: taskData,
          startY: yPosition,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [66, 139, 202] },
        });
        break;

      case 'analytics':
        const analytics = [
          ['Total Tasks', tasks.length],
          ['Completed Tasks', tasks.filter(t => t.completed).length],
          ['Active Tasks', tasks.filter(t => !t.completed).length],
          ['Total Companies', companies.length],
          ['Total Categories', categories.length],
          ['Total Tags', tags.length],
        ];

        autoTable(doc, {
          head: [['Metric', 'Value']],
          body: analytics,
          startY: yPosition,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [66, 139, 202] },
        });
        break;
    }

    return doc;
  };

  const handleExport = async () => {
    try {
      let content: string;
      let filename: string;
      let mimeType: string;

      if (exportOptions.format === 'csv') {
        switch (exportOptions.type) {
          case 'tasks':
            content = generateTasksCSV();
            filename = `tasks-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
            break;
          case 'companies':
            content = generateCompaniesCSV();
            filename = `companies-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
            break;
          case 'categories':
            content = generateCategoriesCSV();
            filename = `categories-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
            break;
          case 'tags':
            content = generateTagsCSV();
            filename = `tags-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
            break;
          case 'analytics':
            content = generateAnalyticsCSV();
            filename = `analytics-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
            break;
          default:
            throw new Error('Invalid export type');
        }
        mimeType = 'text/csv;charset=utf-8;';

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // PDF export
        const doc = await generatePDF();
        filename = `${exportOptions.type}-export-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        doc.save(filename);
      }

      toast({
        title: 'Export successful',
        description: `Your ${exportOptions.type} data has been exported as ${exportOptions.format.toUpperCase()}.`,
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'There was an error exporting your data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const updateCustomFields = (type: keyof ExportOptions['customFields'], fieldId: string, checked: boolean) => {
    setExportOptions(prev => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [type]: checked
          ? [...prev.customFields[type], fieldId]
          : prev.customFields[type].filter(id => id !== fieldId)
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Export Options */}
            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium">Export Format</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Card 
                    className={`cursor-pointer border-2 ${exportOptions.format === 'csv' ? 'border-primary' : 'border-muted'}`}
                    onClick={() => setExportOptions(prev => ({ ...prev, format: 'csv' }))}
                  >
                    <CardContent className="p-4 text-center">
                      <FileSpreadsheet className="h-8 w-8 mx-auto mb-2" />
                      <div className="font-medium">CSV</div>
                      <div className="text-xs text-muted-foreground">Spreadsheet format</div>
                    </CardContent>
                  </Card>
                  <Card 
                    className={`cursor-pointer border-2 ${exportOptions.format === 'pdf' ? 'border-primary' : 'border-muted'}`}
                    onClick={() => setExportOptions(prev => ({ ...prev, format: 'pdf' }))}
                  >
                    <CardContent className="p-4 text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2" />
                      <div className="font-medium">PDF</div>
                      <div className="text-xs text-muted-foreground">Document format</div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Export Type</Label>
                <Select value={exportOptions.type} onValueChange={(value: ExportType) => setExportOptions(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tasks">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4" />
                        Tasks ({tasks.length})
                      </div>
                    </SelectItem>
                    <SelectItem value="companies">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Companies ({companies.length})
                      </div>
                    </SelectItem>
                    <SelectItem value="categories">
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4" />
                        Categories ({categories.length})
                      </div>
                    </SelectItem>
                    <SelectItem value="tags">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        Tags ({tags.length})
                      </div>
                    </SelectItem>
                    <SelectItem value="analytics">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Analytics Summary
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {exportOptions.type === 'tasks' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeCompleted"
                      checked={exportOptions.includeCompleted}
                      onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeCompleted: !!checked }))}
                    />
                    <Label htmlFor="includeCompleted">Include completed tasks</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeArchived"
                      checked={exportOptions.includeArchived}
                      onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeArchived: !!checked }))}
                    />
                    <Label htmlFor="includeArchived">Include archived tasks</Label>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Date Range (Optional)</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Input
                        type="date"
                        placeholder="Start date"
                        onChange={(e) => setExportOptions(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, start: e.target.value ? new Date(e.target.value) : undefined }
                        }))}
                      />
                      <Input
                        type="date"
                        placeholder="End date"
                        onChange={(e) => setExportOptions(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, end: e.target.value ? new Date(e.target.value) : undefined }
                        }))}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Field Selection */}
            <div>
              <Label className="text-base font-medium">Fields to Export</Label>
              <div className="mt-4 space-y-3 max-h-80 overflow-y-auto">
                {exportOptions.type === 'tasks' && TASK_FIELDS.map(field => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={field.id}
                      checked={exportOptions.customFields.tasks.includes(field.id)}
                      onCheckedChange={(checked) => updateCustomFields('tasks', field.id, !!checked)}
                    />
                    <Label htmlFor={field.id} className="text-sm">{field.label}</Label>
                  </div>
                ))}
                
                {exportOptions.type === 'companies' && COMPANY_FIELDS.map(field => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={field.id}
                      checked={exportOptions.customFields.companies.includes(field.id)}
                      onCheckedChange={(checked) => updateCustomFields('companies', field.id, !!checked)}
                    />
                    <Label htmlFor={field.id} className="text-sm">{field.label}</Label>
                  </div>
                ))}
                
                {exportOptions.type === 'categories' && CATEGORY_FIELDS.map(field => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={field.id}
                      checked={exportOptions.customFields.categories.includes(field.id)}
                      onCheckedChange={(checked) => updateCustomFields('categories', field.id, !!checked)}
                    />
                    <Label htmlFor={field.id} className="text-sm">{field.label}</Label>
                  </div>
                ))}
                
                {exportOptions.type === 'tags' && TAG_FIELDS.map(field => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={field.id}
                      checked={exportOptions.customFields.tags.includes(field.id)}
                      onCheckedChange={(checked) => updateCustomFields('tags', field.id, !!checked)}
                    />
                    <Label htmlFor={field.id} className="text-sm">{field.label}</Label>
                  </div>
                ))}
                
                {exportOptions.type === 'analytics' && (
                  <div className="text-sm text-muted-foreground">
                    Analytics export includes summary statistics and metrics.
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>

        <DialogFooter className="border-t p-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export {exportOptions.format.toUpperCase()}
          </Button>
        </DialogFooter>
      </Card>
    </div>
  );
}