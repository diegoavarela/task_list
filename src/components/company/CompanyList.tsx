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
    <div className="space-y-8">
      <Card className="rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01]">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white rounded-t-lg">
          <CardTitle>Add New Company</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Company name"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              className="flex-1 h-10 shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-400"
            />
            <Button 
              onClick={handleAddCompany} 
              className="border-2 border-black text-black hover:bg-black hover:text-white h-10 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
              type="button"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Company
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01]">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white rounded-t-lg">
          <CardTitle>Companies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {companies.map((company) => (
              <div 
                key={company.id} 
                className="rounded-lg border bg-card shadow-sm hover:shadow-2xl transition-all duration-300 hover:border-gray-400 hover:scale-[1.03] hover:bg-gray-50/90 cursor-pointer group"
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-300 group-hover:scale-110" />
                    <span className="text-lg group-hover:text-primary transition-colors duration-300 font-medium group-hover:scale-105">{company.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      {format(new Date(company.createdAt), 'MMM d, yyyy')}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingCompany({ id: company.id, name: company.name })}
                      className="hover:bg-gray-100 transition-all duration-300 hover:scale-125 hover:shadow-lg"
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
                      className="hover:bg-red-50 transition-all duration-300 hover:scale-125 hover:shadow-lg"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
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
              className="border-2 border-black text-black hover:bg-black hover:text-white transition-all duration-300 hover:scale-[1.02]"
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