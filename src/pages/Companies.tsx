import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';

interface Company {
  id: string;
  name: string;
  logo?: string;
}

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([
    { id: '1', name: 'Acme Corp', logo: '🏢' },
    { id: '2', name: 'TechStart', logo: '💻' },
  ]);
  const [newCompanyName, setNewCompanyName] = useState('');
  const navigate = useNavigate();

  const handleAddCompany = () => {
    if (newCompanyName.trim()) {
      const newCompany: Company = {
        id: Date.now().toString(),
        name: newCompanyName.trim(),
        logo: '🏢',
      };
      setCompanies([...companies, newCompany]);
      setNewCompanyName('');
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-base-content">Companies</h1>
          <div className="join">
            <input
              type="text"
              placeholder="New company name"
              className="input input-bordered join-item"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCompany()}
            />
            <button 
              className="btn btn-primary join-item"
              onClick={handleAddCompany}
            >
              <PlusIcon className="h-5 w-5" />
              Add
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <div 
              key={company.id}
              className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-base-200/50 cursor-pointer group"
              onClick={() => navigate(`/companies/${company.id}/tasks`)}
            >
              <div className="card-body">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl group-hover:scale-110 transition-transform duration-300">{company.logo}</div>
                  <h2 className="card-title text-xl group-hover:text-primary transition-colors duration-300">{company.name}</h2>
                </div>
                <div className="card-actions justify-end mt-4">
                  <button className="btn btn-primary btn-sm hover:scale-105 transition-transform duration-300 hover:shadow-lg">View Tasks</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 