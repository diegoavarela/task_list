import { useState } from 'react';
import { FileText, Plus, Star, Edit, Trash2, Copy, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { PriorityBadge } from './PriorityBadge';
import type { Task } from '@/types/task';
import type { Company } from '@/types/company';
import type { Tag } from '@/types/tag';

interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  templateData: Omit<Task, 'id' | 'createdAt' | 'completed' | 'completedAt'>;
  isStarred: boolean;
  useCount: number;
  createdAt: Date;
  lastUsed?: Date;
}

interface TaskTemplatesProps {
  templates: TaskTemplate[];
  companies: Company[];
  tags: Tag[];
  onTemplateCreate: (template: Omit<TaskTemplate, 'id' | 'createdAt' | 'useCount' | 'lastUsed'>) => void;
  onTemplateUpdate: (templateId: string, updates: Partial<TaskTemplate>) => void;
  onTemplateDelete: (templateId: string) => void;
  onTemplateUse: (template: TaskTemplate) => void;
  onClose: () => void;
}

export function TaskTemplates({
  templates,
  companies,
  tags,
  onTemplateCreate,
  onTemplateUpdate,
  onTemplateDelete,
  onTemplateUse,
  onClose
}: TaskTemplatesProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateTaskName, setTemplateTaskName] = useState('');
  const [templateNotes, setTemplateNotes] = useState('');
  const [templateCompany, setTemplateCompany] = useState('');
  const [templatePriority, setTemplatePriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [templateTags, setTemplateTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || 'Unknown Company';
  };

  const getTagName = (tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    return tag?.name || 'Unknown Tag';
  };

  const getTagColor = (tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    return tag?.color || '#gray';
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.templateData.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    // Starred templates first
    if (a.isStarred && !b.isStarred) return -1;
    if (!a.isStarred && b.isStarred) return 1;
    
    // Then by use count (most used first)
    if (a.useCount !== b.useCount) return b.useCount - a.useCount;
    
    // Finally by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleCreateTemplate = () => {
    if (!templateName.trim() || !templateTaskName.trim() || !templateCompany) {
      toast({
        title: "Missing required fields",
        description: "Please fill in template name, task name, and company.",
        variant: "destructive"
      });
      return;
    }

    const templateData: Omit<Task, 'id' | 'createdAt' | 'completed' | 'completedAt'> = {
      name: templateTaskName.trim(),
      notes: templateNotes || undefined,
      companyId: templateCompany,
      priority: templatePriority,
      status: 'todo',
      tagIds: templateTags,
      subtasks: [],
      isTemplate: true
    };

    onTemplateCreate({
      name: templateName.trim(),
      description: templateDescription || undefined,
      templateData,
      isStarred: false
    });

    resetForm();
    setShowCreateDialog(false);
    
    toast({
      title: "Template created",
      description: "Your task template has been saved successfully."
    });
  };

  const handleEditTemplate = (template: TaskTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateDescription(template.description || '');
    setTemplateTaskName(template.templateData.name);
    setTemplateNotes(template.templateData.notes || '');
    setTemplateCompany(template.templateData.companyId);
    setTemplatePriority(template.templateData.priority);
    setTemplateTags(template.templateData.tagIds || []);
    setShowCreateDialog(true);
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate || !templateName.trim() || !templateTaskName.trim() || !templateCompany) {
      return;
    }

    const updates: Partial<TaskTemplate> = {
      name: templateName.trim(),
      description: templateDescription || undefined,
      templateData: {
        ...editingTemplate.templateData,
        name: templateTaskName.trim(),
        notes: templateNotes || undefined,
        companyId: templateCompany,
        priority: templatePriority,
        tagIds: templateTags
      }
    };

    onTemplateUpdate(editingTemplate.id, updates);
    resetForm();
    setShowCreateDialog(false);
    setEditingTemplate(null);
    
    toast({
      title: "Template updated",
      description: "Your task template has been updated successfully."
    });
  };

  const resetForm = () => {
    setTemplateName('');
    setTemplateDescription('');
    setTemplateTaskName('');
    setTemplateNotes('');
    setTemplateCompany('');
    setTemplatePriority('medium');
    setTemplateTags([]);
  };

  const handleUseTemplate = (template: TaskTemplate) => {
    onTemplateUse(template);
    toast({
      title: "Template applied",
      description: "A new task has been created from the template."
    });
  };

  const toggleStar = (templateId: string, isStarred: boolean) => {
    onTemplateUpdate(templateId, { isStarred: !isStarred });
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Task Templates
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Template
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="mt-4">
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardHeader>
        
        <CardContent className="p-0 overflow-y-auto max-h-[60vh]">
          {sortedTemplates.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No templates yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first task template to save time on recurring tasks
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
              {sortedTemplates.map((template) => (
                <Card key={template.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{template.name}</h4>
                          {template.isStarred && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        {template.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {template.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStar(template.id, template.isStarred)}
                          className="h-8 w-8 p-0"
                        >
                          <Star className={`h-4 w-4 ${template.isStarred ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTemplate(template)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onTemplateDelete(template.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Template Task Preview */}
                    <div className="bg-muted/50 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{template.templateData.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <PriorityBadge priority={template.templateData.priority} />
                        <Badge variant="outline" className="text-xs">
                          {getCompanyName(template.templateData.companyId)}
                        </Badge>
                      </div>
                      
                      {template.templateData.tagIds && template.templateData.tagIds.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {template.templateData.tagIds.map(tagId => (
                            <div
                              key={tagId}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ 
                                backgroundColor: `${getTagColor(tagId)}15`,
                                color: getTagColor(tagId),
                                border: `1px solid ${getTagColor(tagId)}30`
                              }}
                            >
                              {getTagName(tagId)}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {template.templateData.notes && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {template.templateData.notes}
                        </p>
                      )}
                    </div>
                    
                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span>Used {template.useCount} times</span>
                      {template.lastUsed && (
                        <span>Last used {new Date(template.lastUsed).toLocaleDateString()}</span>
                      )}
                    </div>
                    
                    {/* Use Template Button */}
                    <Button
                      onClick={() => handleUseTemplate(template)}
                      className="w-full gap-2"
                      size="sm"
                    >
                      <Copy className="h-4 w-4" />
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Template Name</label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Weekly Report, Client Meeting"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Description (Optional)</label>
              <Textarea
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Brief description of when to use this template"
                rows={2}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Task Name</label>
              <Input
                value={templateTaskName}
                onChange={(e) => setTemplateTaskName(e.target.value)}
                placeholder="Name for tasks created from this template"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Company</label>
              <Select value={templateCompany} onValueChange={setTemplateCompany}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Priority</label>
              <Select value={templatePriority} onValueChange={(value: 'high' | 'medium' | 'low') => setTemplatePriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Tags</label>
              <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                {tags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={templateTags.includes(tag.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTemplateTags([...templateTags, tag.id]);
                        } else {
                          setTemplateTags(templateTags.filter(id => id !== tag.id));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <div
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: `${tag.color}15`,
                        color: tag.color,
                        border: `1px solid ${tag.color}30`
                      }}
                    >
                      {tag.name}
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Notes (Optional)</label>
              <Textarea
                value={templateNotes}
                onChange={(e) => setTemplateNotes(e.target.value)}
                placeholder="Default notes for tasks created from this template"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setEditingTemplate(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}>
              {editingTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}