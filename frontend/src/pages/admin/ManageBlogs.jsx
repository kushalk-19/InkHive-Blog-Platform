import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Heart, MessageCircle, Eye, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
const currentAdminID = adminUser?.adminID;

const ManageBlogs = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isAddBlogDialogOpen, setIsAddBlogDialogOpen] = useState(false);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogDescription, setBlogDescription] = useState('');
  const [blogCategory, setBlogCategory] = useState('');
  const [blogImage, setBlogImage] = useState(null);
  const [currentAdminID, setCurrentAdminID] = useState(null); // ← ADD STATE

  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (!adminUser) {
      navigate('/admin/login');
      return;
    }

    const parsed = JSON.parse(adminUser);
    setCurrentAdminID(parsed.adminID); // ← SET DYNAMICALLY

    const fetchData = async () => {
      try {
        const [blogRes, catRes] = await Promise.all([
          axios.get('https://inkhive-backend.onrender.com/api/users/admin-blogs'),
          axios.get('https://inkhive-backend.onrender.com/api/users/admin-categories')
        ]);
        setBlogs(blogRes.data);
        setCategories(catRes.data);
      } catch (err) {
        toast.error('Failed to load data');
      }
    };
    fetchData();
  }, [navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setBlogImage(file);
  };

  const handleAddBlog = async () => {
    if (!blogTitle.trim() || !blogDescription.trim() || !blogCategory || !blogImage) {
      toast.error('All fields are required');
      return;
    }

    const formData = new FormData();
    formData.append('blogTitle', blogTitle.trim());
    formData.append('blogDescription', blogDescription.trim());
    formData.append('categoryID', blogCategory);
    formData.append('blogImage', blogImage);

    try {
      const res = await axios.post(
        'https://inkhive-backend.onrender.com/api/users/admin-blogs',
        formData,
        { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setBlogs([res.data.blog, ...blogs]);
      setBlogTitle(''); setBlogDescription(''); setBlogCategory(''); setBlogImage(null);
      setIsAddBlogDialogOpen(false);
      toast.success('Blog added successfully');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to add blog');
    }
  };

  const toggleLike = async (blogID) => {
    if (!currentAdminID) {
      toast.error('Login required');
      return;
    }

    try {
      const res = await axios.post(
        `https://inkhive-backend.onrender.com/api/users/blogs/${blogID}/like`,
        {},
        { withCredentials: true }
      );

      setBlogs(blogs.map(b =>
        b.blogID === blogID
          ? {
            ...b,
            likes: res.data.liked
              ? [...b.likes.filter(id => id !== currentAdminID), currentAdminID]
              : b.likes.filter(id => id !== currentAdminID)
          }
          : b
      ));
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to like');
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Manage Blogs</h1>
            <p className="text-muted-foreground">{blogs.length} total blogs</p>
          </div>
          <Button onClick={() => setIsAddBlogDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Blog
          </Button>
        </div>

        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Engagement</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blogs.map((blog) => (
                <TableRow key={blog.blogID}>
                  <TableCell className="font-medium max-w-xs truncate">
                    {blog.blogTitle}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{blog.categoryID.categoryName}</Badge>
                  </TableCell>
                  <TableCell>{new Date(blog.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-3 text-sm">
                      <button onClick={() => toggleLike(blog.blogID)} className="flex items-center gap-1">
                        <Heart
                          className={`h-4 w-4 transition-all ${currentAdminID && blog.likes.includes(currentAdminID)
                            ? 'fill-red-500 text-red-500 scale-110'
                            : 'text-muted-foreground'
                            }`}
                        />
                        <span className="font-medium">{blog.likes.length}</span>
                      </button>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {blog.comments.length}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/blog/${blog.blogID}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Dialog open={isAddBlogDialogOpen} onOpenChange={setIsAddBlogDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Add Blog</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Image</Label>
                <Input type="file" accept="image/*" onChange={handleImageChange} />
              </div>
              <div className="space-y-2">
                <Label>Blog Title</Label>
                <Input value={blogTitle} onChange={(e) => setBlogTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={blogDescription} onChange={(e) => setBlogDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={blogCategory} onValueChange={setBlogCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.categoryID} value={cat.categoryID.toString()}>
                        {cat.categoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddBlogDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddBlog}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default ManageBlogs;