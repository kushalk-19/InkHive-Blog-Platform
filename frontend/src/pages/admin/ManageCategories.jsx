import { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const ManageCategories = () => {

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('https://inkhive-backend.onrender.com/api/users/admin-categories');
        setCategories(res.data);
      } catch (err) {
        toast.error('Failed to load categories');
      }
    };
    fetchCategories();
  }, []);

  const [categories, setCategories] = useState([]); // ← ADD THIS

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);

  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      toast.error('Category name is required');
      return;
    }
    if (categoryName.trim().length < 4 || categoryName.trim().length > 15) {
      toast.error('Category name must be 4–15 characters');
      return;
    }

    try {
      const res = await axios.post(
        'https://inkhive-backend.onrender.com/api/users/admin-categories',
        { categoryName: categoryName.trim() },
        { withCredentials: true }
      );

      setCategories([...categories, res.data.category]);
      setCategoryName('');
      setIsAddDialogOpen(false);
      toast.success('Category added successfully');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to add category');
    }
  };

  const handleEditCategory = async () => {
    if (!categoryName.trim()) {
      toast.error('Category name is required');
      return;
    }
    if (categoryName.trim().length < 4 || categoryName.trim().length > 15) {
      toast.error('Category name must be 4–15 characters');
      return;
    }

    try {
      const res = await axios.patch(
        `https://inkhive-backend.onrender.com/api/users/admin-categories/${editingCategory.categoryID}`,
        { categoryName: categoryName.trim() },
        { withCredentials: true }
      );

      setCategories(categories.map(cat =>
        cat.categoryID === editingCategory.categoryID
          ? res.data.category
          : cat
      ));

      setCategoryName('');
      setEditingCategory(null);
      setIsEditDialogOpen(false);
      toast.success('Category updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to update');
    }
  };

  const handleDeleteCategory = async (categoryID) => {
    try {
      await axios.delete(
        `https://inkhive-backend.onrender.com/api/users/admin-categories/${categoryID}`,
        { withCredentials: true }
      );

      setCategories(categories.filter(cat => cat.categoryID !== categoryID));
      toast.success('Category deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to delete');
    }
  };

  const openEditDialog = (category) => {
    setEditingCategory(category);
    setCategoryName(category.categoryName); // ← .categoryName
    setIsEditDialogOpen(true);
  };

  const openAddDialog = () => {
    setCategoryName('');
    setIsAddDialogOpen(true);
  };

  return (
    <div className="flex min-h-screen w-full">
      <AdminSidebar />

      <main className="flex-1 p-6 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Manage Categories</CardTitle>
              <CardDescription>
                Add, edit, or delete blog categories
              </CardDescription>
            </div>
            <Button onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.categoryID}>
                    <TableCell>{category.categoryID}</TableCell>
                    <TableCell className="font-medium">{category.categoryName}</TableCell>
                    <TableCell className="capitalize">{category.categoryBy}</TableCell>
                    <TableCell>{category.email || '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.categoryID)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add Category Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Category</DialogTitle>
              <DialogDescription>
                Enter the name of the new category
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Category Name</Label>
                <Input
                  id="category-name"
                  placeholder="Enter category name"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCategory}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Category Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Update the category name
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category-name">Category Name</Label>
                <Input
                  id="edit-category-name"
                  placeholder="Enter category name"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditCategory}>Update</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default ManageCategories;
