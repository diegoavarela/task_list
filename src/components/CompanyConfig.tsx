import { useState } from 'react';
import type { Company } from '@/types/company';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CompanyConfigProps {
  companies: Company[];
  onAddCompany: (company: Company) => void;
  onDeleteCompany: (companyId: string) => void;
}

export function CompanyConfig({ companies, onAddCompany, onDeleteCompany }: CompanyConfigProps) {
  const [newCompanyName, setNewCompanyName] = useState('');

  const handleAddCompany = () => {
    if (!newCompanyName.trim()) return;

    const newCompany: Company = {
      id: crypto.randomUUID(),
      name: newCompanyName.trim(),
      createdAt: new Date(),
    };

    onAddCompany(newCompany);
    setNewCompanyName('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Company</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              type="text"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCompany()}
              placeholder="Enter company name..."
              className="flex-1"
            />
            <Button onClick={handleAddCompany}>Add Company</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Companies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {companies.map((company) => (
              <Card key={company.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-medium">{company.name}</span>
                      <div className="text-sm text-muted-foreground">
                        Created {new Date(company.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDeleteCompany(company.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 