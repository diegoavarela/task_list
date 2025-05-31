import { useState } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function ConfigPage() {
  const [companies, setCompanies] = useState<string[]>([]);
  const [name, setName] = useState('');

  function addCompany(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim() && !companies.includes(name.trim())) {
      setCompanies([...companies, name.trim()]);
      setName('');
    }
  }

  function removeCompany(name: string) {
    setCompanies(companies.filter(c => c !== name));
  }

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white rounded-lg shadow p-8">
      <h2 className="text-2xl font-bold mb-6">Companies</h2>
      <form onSubmit={addCompany} className="flex gap-2 mb-6">
        <input
          className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Add a new company..."
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-1 hover:bg-blue-700 transition"
        >
          <PlusIcon className="h-5 w-5" />
          Add
        </button>
      </form>
      <ul className="divide-y">
        {companies.length === 0 && (
          <li className="text-gray-400 py-4 text-center">No companies yet.</li>
        )}
        {companies.map(company => (
          <li key={company} className="flex items-center justify-between py-3">
            <span className="font-medium">{company}</span>
            <button
              onClick={() => removeCompany(company)}
              className="text-red-500 hover:text-red-700 p-1 rounded"
              title="Delete"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
} 