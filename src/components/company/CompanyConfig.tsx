import { useState } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import type { Company } from '../../types/company';

interface CompanyConfigProps {
  companies: Company[];
  onAddCompany: (company: Company) => void;
  onDeleteCompany: (companyId: string) => void;
}

export function CompanyConfig({ companies, onAddCompany, onDeleteCompany }: CompanyConfigProps) {
  const [newCompany, setNewCompany] = useState('');

  const handleAddCompany = () => {
    if (newCompany.trim()) {
      onAddCompany({
        id: Date.now().toString(),
        name: newCompany.trim(),
        createdAt: new Date()
      });
      setNewCompany('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCompany();
    }
  };

  return (
    <div className="space-y-8">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Add New Company</h2>
        </div>
        <div className="space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter company name"
              className="input flex-1"
            />
            <button onClick={handleAddCompany} className="btn btn-primary">
              <PlusCircle className="h-4 w-4" />
              Add Company
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {companies.length === 0 ? (
          <div className="card empty-state">
            <h3 className="empty-state-title">No companies yet</h3>
            <p className="empty-state-description">Add a company above to get started!</p>
          </div>
        ) : (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Companies</h2>
            </div>
            <div className="space-y-4">
              {companies.map(company => (
                <div key={company.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <span className="font-medium">{company.name}</span>
                    <p className="text-sm text-muted-foreground">
                      Created: {company.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteCompany(company.id)}
                    className="btn btn-ghost text-destructive hover:text-destructive-dark"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 