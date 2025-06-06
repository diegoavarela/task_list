import { useState } from 'react';
import { Plus, Trash2, Edit2, X, Check, Building2, Eye, EyeOff } from 'lucide-react';
import type { Company } from '../../types/company';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { EmptyState } from '@/components/ui/empty-state';
import { format } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CompanyConfigProps {
  companies: Company[];
  onAddCompany: (company: Company) => void;
  onUpdateCompany: (company: Company) => void;
  onDeleteCompany: (companyId: string) => void;
}

const COMPANY_COLORS = [
  // Reds
  '#ef4444', '#dc2626', '#b91c1c',
  // Oranges
  '#f97316', '#ea580c', '#c2410c',
  // Yellows
  '#eab308', '#ca8a04', '#a16207',
  // Greens
  '#22c55e', '#16a34a', '#15803d',
  // Blues
  '#3b82f6', '#2563eb', '#1d4ed8',
  // Purples
  '#8b5cf6', '#7c3aed', '#6d28d9',
  // Pinks
  '#ec4899', '#db2777', '#be185d',
  // Teals
  '#14b8a6', '#0d9488', '#0f766e'
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
          <div className="absolute top-full left-0 mt-2 p-6 bg-card rounded-lg shadow-lg border z-50 min-w-[280px]">
            <div className="grid grid-cols-4 gap-4">
              {COMPANY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    "w-10 h-10 rounded-lg border-2 transition-all hover:scale-105",
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

export function CompanyConfig({ companies, onAddCompany, onUpdateCompany, onDeleteCompany }: CompanyConfigProps) {
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyColor, setNewCompanyColor] = useState(COMPANY_COLORS[0]);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  const handleAddCompany = () => {
    if (newCompanyName.trim()) {
      onAddCompany({
        id: crypto.randomUUID(),
        name: newCompanyName.trim(),
        createdAt: new Date(),
        color: newCompanyColor
      });
      setNewCompanyName('');
      setNewCompanyColor(COMPANY_COLORS[0]);
      setShowAddForm(false);
      toast({
        title: "Company created",
        description: "Your company has been created successfully.",
      });
    }
  };

  const handleEditCompany = () => {
    if (editingCompany && editingCompany.name.trim()) {
      onUpdateCompany({
        ...editingCompany,
        name: editingCompany.name.trim()
      });
      setEditingCompany(null);
      toast({
        title: "Company updated",
        description: "Your company has been updated successfully.",
      });
    }
  };

  const handleDeleteCompany = (companyId: string) => {
    setCompanyToDelete(companyId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCompany = () => {
    if (companyToDelete) {
      onDeleteCompany(companyToDelete);
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
      toast({
        title: "Company deleted",
        description: "Your company has been deleted successfully.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Company */}
      {showAddForm ? (
        <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Create New Company
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Company name..."
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newCompanyName.trim()) {
                      handleAddCompany();
                    }
                  }}
                  className="flex-1 min-w-0"
                  autoFocus
                />
                <div className="flex sm:flex-row gap-2 sm:gap-3">
                  <ColorPicker
                    value={newCompanyColor}
                    onChange={setNewCompanyColor}
                  />
                  <Button 
                    onClick={handleAddCompany}
                    disabled={!newCompanyName.trim()}
                    className="gap-2 flex-1 sm:flex-none"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Create</span>
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewCompanyName('');
                      setNewCompanyColor(COMPANY_COLORS[0]);
                    }}
                    className="flex-1 sm:flex-none"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
              {newCompanyName.trim() && (
                <div className="pt-2">
                  <span className="text-sm text-muted-foreground mb-2 block">Preview:</span>
                  <div 
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: `${newCompanyColor}15`,
                      color: newCompanyColor,
                      border: `1px solid ${newCompanyColor}30`
                    }}
                  >
                    <Building2 className="h-4 w-4" />
                    {newCompanyName.trim()}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-xl sm:text-2xl font-semibold">Companies</CardTitle>
              <Button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 self-start sm:self-auto"
              >
                <Plus className="h-4 w-4" />
                Add Company
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Companies List */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Companies ({companies.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <EmptyState
              icon={<Building2 className="h-full w-full" />}
              title="No companies yet"
              description="Create your first company to organize your tasks better."
              action={{
                label: "Add Company",
                onClick: () => setShowAddForm(true)
              }}
            />
          ) : (
            <div className="space-y-3">
              {companies.map((company) => (
                <div 
                  key={company.id} 
                  className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card transition-all duration-200 hover:shadow-sm hover:border-border gap-3 sm:gap-0"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-4 h-4 rounded-full ring-2 ring-offset-2 ring-offset-background transition-all"
                      style={{ backgroundColor: company.color, ringColor: `${company.color}40` }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-medium">{company.name}</h4>
                        <div 
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: `${company.color}15`,
                            color: company.color,
                            border: `1px solid ${company.color}30`
                          }}
                        >
                          <Building2 className="h-3 w-3" />
                          {company.name}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created {format(new Date(company.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity self-end sm:self-auto">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingCompany(company)}
                            className="h-8 w-8"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit company</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCompany(company.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete company</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Company Dialog */}
      <Dialog open={!!editingCompany} onOpenChange={() => setEditingCompany(null)}>
        <DialogContent className="w-[95vw] max-w-[425px] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                value={editingCompany?.name || ''}
                onChange={(e) => setEditingCompany(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="Company name"
                className="flex-1"
              />
              <ColorPicker
                value={editingCompany?.color || COMPANY_COLORS[0]}
                onChange={(color) => setEditingCompany(prev => prev ? { ...prev, color } : null)}
              />
            </div>
            {editingCompany && (
              <div className="pt-2">
                <span className="text-sm text-muted-foreground mb-2 block">Preview:</span>
                <div 
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: `${editingCompany.color}15`,
                    color: editingCompany.color,
                    border: `1px solid ${editingCompany.color}30`
                  }}
                >
                  <Building2 className="h-3 w-3" />
                  {editingCompany.name}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditingCompany(null)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditCompany}
              disabled={!editingCompany?.name.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[425px] sm:w-full">
          <DialogHeader>
            <DialogTitle>Delete Company</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this company? This action cannot be undone.
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
              onClick={confirmDeleteCompany}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}