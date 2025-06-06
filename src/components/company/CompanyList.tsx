import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Trash2, Building2 } from 'lucide-react'
import { format } from 'date-fns'

interface Company {
  id: string
  name: string
  createdAt: Date
}

interface CompanyListProps {
  companies: Company[]
  onAddCompany: (name: string) => void
  onEditCompany: (companyId: string, name: string) => void
  onDeleteCompany: (companyId: string) => void
}

export function CompanyList({ companies, onAddCompany, onEditCompany, onDeleteCompany }: CompanyListProps) {
  const [newCompanyName, setNewCompanyName] = useState('')
  const [editingCompany, setEditingCompany] = useState<{ id: string; name: string } | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null)
  const { toast } = useToast()

  const handleAddCompany = () => {
    if (newCompanyName.trim()) {
      onAddCompany(newCompanyName.trim())
      setNewCompanyName('')
      toast({
        title: "Company added",
        description: "Your company has been added successfully.",
      })
    }
  }

  const handleEditCompany = () => {
    if (editingCompany && editingCompany.name.trim()) {
      onEditCompany(editingCompany.id, editingCompany.name.trim())
      setEditingCompany(null)
      toast({
        title: "Company updated",
        description: "Your company has been updated successfully.",
      })
    }
  }

  const handleDeleteCompany = (companyId: string) => {
    setCompanyToDelete(companyId)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteCompany = () => {
    if (companyToDelete) {
      onDeleteCompany(companyToDelete)
      setDeleteDialogOpen(false)
      setCompanyToDelete(null)
      toast({
        title: "Company deleted",
        description: "Your company has been deleted successfully.",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Add New Company</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Enter company name..."
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newCompanyName.trim()) {
                  handleAddCompany();
                }
              }}
              className="flex-1"
              autoFocus
            />
            <Button 
              onClick={handleAddCompany}
              disabled={!newCompanyName.trim()}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Company
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Companies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {companies.length === 0 ? (
              <div className="empty-state py-8">
                <Building2 className="empty-state-icon" />
                <h3 className="empty-state-title">No companies yet</h3>
                <p className="empty-state-description">
                  Add your first company to get started organizing your tasks.
                </p>
              </div>
            ) : (
              companies.map((company) => (
                <div 
                  key={company.id} 
                  className="company-item group"
                >
                  <div className="flex items-center">
                    <div className="company-color-indicator"
                         style={{ backgroundColor: company.color }} />
                    <Building2 className="h-5 w-5 text-muted-foreground mr-3" />
                    <div>
                      <div className="company-name">{company.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Created {format(new Date(company.createdAt), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingCompany({ id: company.id, name: company.name })}
                      className="h-8 w-8"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCompany(company.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingCompany} onOpenChange={() => setEditingCompany(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={editingCompany?.name || ''}
              onChange={(e) => setEditingCompany(prev => prev ? { ...prev, name: e.target.value } : null)}
              placeholder="Company name"
              className="shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-400"
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditingCompany(null)}
              className="hover:bg-gray-100 transition-all duration-300 hover:scale-[1.02]"
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
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
              className="hover:bg-gray-100 transition-all duration-300 hover:scale-[1.02]"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteCompany}
              className="hover:bg-red-600 transition-all duration-300 hover:scale-[1.02]"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 