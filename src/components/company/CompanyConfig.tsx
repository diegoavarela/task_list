import { useState } from 'react';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';
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
      <div
        className={`w-8 h-8 rounded-md border-2 border-gray-200 hover:border-gray-400 transition-colors cursor-pointer ${className}`}
        style={{ backgroundColor: value }}
        onClick={() => setIsOpen(!isOpen)}
      />
      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-2 p-6 bg-white rounded-lg shadow-lg border border-gray-200 z-10 min-w-[320px]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid grid-cols-6 gap-6">
            {COMPANY_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`w-10 h-10 rounded-md cursor-pointer border-2 transition-transform hover:scale-110 ${
                  value === color ? 'border-black' : 'border-gray-200'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => {
                  onChange(color);
                  setIsOpen(false);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CompanyConfig({ companies, onAddCompany, onUpdateCompany, onDeleteCompany }: CompanyConfigProps) {
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyColor, setNewCompanyColor] = useState(COMPANY_COLORS[0]);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAddCompany = () => {
    if (newCompanyName.trim()) {
      onAddCompany({
        id: Date.now().toString(),
        name: newCompanyName.trim(),
        createdAt: new Date(),
        color: newCompanyColor
      });
      setNewCompanyName('');
      setNewCompanyColor(COMPANY_COLORS[0]);
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
    setEditingColor(company.color);
  };

  const handleCompanyEdit = (company: Company) => {
    if (editingName.trim()) {
      onUpdateCompany({
        ...company,
        name: editingName.trim(),
        color: editingColor
      });
      setEditingCompanyId(null);
      setEditingName('');
      setEditingColor('');
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
    setEditingColor('');
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
              className="flex-1 h-10"
            />
            <div className="flex items-center gap-2">
              <ColorPicker
                value={newCompanyColor}
                onChange={setNewCompanyColor}
                className="w-10 h-10"
              />
              <Button 
                onClick={handleAddCompany} 
                className="border-2 border-black text-black hover:bg-black hover:text-white h-10"
                type="button"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Company
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {companies.map((company) => (
              <div
                key={company.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm hover:shadow-xl transition-all duration-300 hover:border-gray-400 hover:scale-[1.02] hover:bg-gray-50/80 cursor-pointer group"
                onClick={() => handleCompanyClick(company)}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded-md border-2 border-gray-200"
                    style={{ backgroundColor: company.color }}
                  />
                  {editingCompanyId === company.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyPress={(e) => handleEditKeyPress(e, company)}
                        className="h-8 w-48"
                        autoFocus
                      />
                      <ColorPicker
                        value={editingColor}
                        onChange={setEditingColor}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompanyEdit(company);
                        }}
                        className="hover:bg-green-50 transition-all duration-300 hover:scale-110"
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelEdit();
                        }}
                        className="hover:bg-gray-100 transition-all duration-300 hover:scale-110"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-sm font-medium group-hover:text-primary transition-colors duration-300">
                      {company.name}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(company.id);
                  }}
                  aria-label="Delete"
                  className="hover:bg-red-50 transition-all duration-300 hover:scale-110 hover:shadow-md"
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