import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockBlogs } from '@/lib/mockData';
import { Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const ManageBlogs = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (!adminUser) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const handleDelete = (id) => {
    toast.success('Blog deleted successfully');
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">Manage Blogs</h1>
          <p className="text-muted-foreground">{mockBlogs.length} total blogs</p>
        </div>

        <div className="bg-card rounded-lg border animate-fade-in-up">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Engagement</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockBlogs.map((blog) => (
                <TableRow key={blog.id}>
                  <TableCell className="font-medium max-w-xs truncate">
                    {blog.title}
                  </TableCell>
                  <TableCell>{blog.author}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{blog.category}</Badge>
                  </TableCell>
                  <TableCell>{new Date(blog.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-3 text-sm text-muted-foreground">
                      <span>❤️ {blog.likes}</span>
                      <span>💬 {blog.comments.length}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => navigate(`/blog/${blog.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(blog.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
};

export default ManageBlogs;
