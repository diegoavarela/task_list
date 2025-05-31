import { useState } from 'react';
import { PlusCircle, Trash2, Edit2, X } from 'lucide-react';
import type { Company } from '../../types/company';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

interface CompanyConfigProps {
  companies: Company[];
  onAddCompany: (company: Company) => void;
  onUpdateCompany: (company: Company) => void;
  onDeleteCompany: (companyId: string) => void;
}

const DEFAULT_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
  '#f43f5e', '#6366f1', '#84cc16', '#06b6d4', '#a855f7', '#f59e0b', '#10b981', '#64748b'
];

export function CompanyConfig({ companies, onAddCompany, onUpdateCompany, onDeleteCompany }: CompanyConfigProps) {
  const [newCompanyName, setNewCompanyName] = useState('');
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAddCompany = () => {
    if (newCompanyName.trim()) {
      // Assign a color based on the number of existing companies
      const colorIndex = companies.length % DEFAULT_COLORS.length;
      onAddCompany({
        id: Date.now().toString(),
        name: newCompanyName.trim(),
        createdAt: new Date(),
        color: DEFAULT_COLORS[colorIndex]
      });
      setNewCompanyName('');
      toast({
        title: "Company added",
        description: "The company has been added successfully.",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCompany();
    }
  };

  const handleCompanyClick = (company: Company) => {
    setEditingCompanyId(company.id);
    setEditingName(company.name);
  };

  const handleCompanyEdit = (company: Company) => {
    if (editingName.trim()) {
      onUpdateCompany({
        ...company,
        name: editingName.trim()
      });
      setEditingCompanyId(null);
      setEditingName('');
    }
  };

  const handleEditKeyPress = (e: React.KeyboardEvent, company: Company) => {
    if (e.key === 'Enter') {
      handleCompanyEdit(company);
    } else if (e.key === 'Escape') {
      setEditingCompanyId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingCompanyId(null);
    setEditingName('');
  };

  const handleDeleteClick = (companyId: string) => {
    setShowDeleteConfirm(companyId);
  };

  const handleConfirmDelete = (companyId: string) => {
    onDeleteCompany(companyId);
    setShowDeleteConfirm(null);
    toast({
      title: "Company deleted",
      description: "The company has been deleted successfully.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter company name"
              className="flex-1"
            />
            <Button onClick={handleAddCompany}>Add Company</Button>
          </div>

          <div className="space-y-2">
            {companies.map((company) => (
              <div
                key={company.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <span className="text-sm font-medium">{company.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteClick(company.id)}
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
              <Card className="w-[400px]">
                <CardHeader>
                  <CardTitle>Confirm Deletion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>Are you sure you want to delete this company?</p>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleConfirmDelete(showDeleteConfirm)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 