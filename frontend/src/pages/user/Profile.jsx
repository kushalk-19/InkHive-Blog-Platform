import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/user/Navbar';
import { BlogCard } from '@/components/user/BlogCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, Mail, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import axios from 'axios';

const Profile = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [userBlogs, setUserBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('approved');
  const [isEditing, setIsEditing] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [blogToDelete, setBlogToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    userGender: '',
    userContact: '',
    userBio: '',
    userImage: null
  });

  useEffect(() => {
    const fetchData = async () => {
      const userStr = localStorage.getItem('currentUser');
      if (!userStr) {
        navigate('/login');
        return;
      }

      try {
        const [userRes, blogsRes, catRes] = await Promise.all([
          axios.get('https://inkhive-backend.onrender.com/api/users/me', { withCredentials: true }),
          axios.get('https://inkhive-backend.onrender.com/api/users/my-blogs', { withCredentials: true }),
          axios.get('https://inkhive-backend.onrender.com/api/users/admin-categories')
        ]);

        const user = userRes.data;
        setCurrentUser(user);
        setUserBlogs(blogsRes.data);
        setFilteredBlogs(blogsRes.data.filter(b => b.blogStatus === 'approved'));
        setCategories(catRes.data.map(c => ({ id: c.categoryID, name: c.categoryName })));

        setFormData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          userGender: user.userGender || '',
          userContact: user.userContact || '',
          userBio: user.userBio || '',
          userImage: null
        });
      } catch (err) {
        toast.error('Failed to load profile');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  useEffect(() => {
    const filtered = selectedStatus === 'all'
      ? userBlogs
      : userBlogs.filter(blog => blog.blogStatus === selectedStatus);
    setFilteredBlogs(filtered);
  }, [selectedStatus, userBlogs]);

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, userImage: e.target.files[0] });
  };

  const handleEditBlog = (blog) => {
    setEditingBlog({
      blogID: blog.blogID || blog.id,
      blogTitle: blog.blogTitle || blog.title,
      blogDescription: blog.blogDescription || blog.snippet || '',
      categoryID: blog.categoryID || blog.category?.categoryID,
      blogImage: null,
      currentImage: blog.blogImage ? `https://inkhive-backend.onrender.com${blog.blogImage}` : blog.image
    });
  };

  const handleDeleteBlog = async () => {
    if (!blogToDelete) return;

    try {
      await axios.delete(`https://inkhive-backend.onrender.com/api/users/blogs/${blogToDelete.blogID}`, {
        withCredentials: true
      });
      toast.success('Blog deleted permanently');
      setUserBlogs(prev => prev.filter(b =>
        (b.blogID || b.id) !== blogToDelete.blogID
      ));
      setBlogToDelete(null);
    } catch (err) {
      toast.error('Failed to delete blog');
    }
  };

  const handleUpdateBlog = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('blogTitle', editingBlog.blogTitle);
    formData.append('blogDescription', editingBlog.blogDescription);
    // Convert to number and validate
    const catId = parseInt(editingBlog.categoryID);
    if (isNaN(catId)) {
      toast.error('Please select a category');
      return;
    }
    formData.append('categoryID', catId);
    if (editingBlog.blogImage) {
      formData.append('blogImage', editingBlog.blogImage);
    }

    try {
      await axios.put(
        `https://inkhive-backend.onrender.com/api/users/blogs/${editingBlog.blogID}`,
        formData,
        { withCredentials: true }
      );

      toast.success('Blog updated! Status changed to Pending');
      setEditingBlog(null);
      // Refresh blogs
      const res = await axios.get('https://inkhive-backend.onrender.com/api/users/my-blogs', { withCredentials: true });
      setUserBlogs(res.data);
    } catch (err) {
      toast.error('Failed to update blog');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.userBio && (formData.userBio.length < 10 || formData.userBio.length > 250)) {
      toast.error('Bio must be between 10 and 250 characters');
      return;
    }
    if (formData.userContact && !/^[6-9]\d{9}$/.test(formData.userContact)) {
      toast.error('Contact must be 10 digits starting with 6-9');
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== '') {
        data.append(key, formData[key]);
      }
    });

    try {
      const response = await axios.put('https://inkhive-backend.onrender.com/api/users/update', data, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCurrentUser(response.data.user);
      localStorage.setItem('currentUser', JSON.stringify(response.data.user));
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Update failed');
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Profile Card */}
        <Card className="mb-12 animate-fade-in">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={currentUser.userImage ? `https://inkhive-backend.onrender.com${currentUser.userImage}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.userName}`}
                />
                <AvatarFallback>{currentUser.userName[0]}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{currentUser.userName}</h1>
                  <Badge variant="secondary">{currentUser.role}</Badge>
                </div>

                <div className="space-y-2 text-muted-foreground">
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4" /><span>{currentUser.userEmail}</span></div>
                  <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /><span>Joined {new Date(currentUser.created_at).toLocaleDateString()}</span></div>
                  {currentUser.userBio && <p className="mt-2 text-foreground italic">"{currentUser.userBio}"</p>}
                </div>

                <Button onClick={() => setIsEditing(!isEditing)} className="mt-4">
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>

                {/* Edit Profile Form */}
                {isEditing && (
                  <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>First Name</Label>
                        <Input name="firstName" value={formData.firstName} onChange={handleInputChange} />
                      </div>
                      <div>
                        <Label>Last Name</Label>
                        <Input name="lastName" value={formData.lastName} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div>
                      <Label>Gender</Label>
                      <RadioGroup value={formData.userGender} onValueChange={(v) => setFormData({ ...formData, userGender: v })}>
                        {['Male', 'Female', 'Other'].map(g => (
                          <div key={g} className="flex items-center space-x-2">
                            <RadioGroupItem value={g} id={g.toLowerCase()} />
                            <Label htmlFor={g.toLowerCase()}>{g}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                    <div>
                      <Label>Contact</Label>
                      <Input name="userContact" value={formData.userContact} onChange={handleInputChange} />
                    </div>
                    <div>
                      <Label>Bio</Label>
                      <Textarea name="userBio" value={formData.userBio} onChange={handleInputChange} maxLength={250} />
                    </div>
                    <div>
                      <Label>Profile Image</Label>
                      <Input type="file" accept="image/*" onChange={handleFileChange} />
                    </div>
                    <Button type="submit">Save Changes</Button>
                  </form>
                )}

              </div>
            </div>
          </CardContent>
        </Card>

        {/* My Blogs Section */}
        <div className="mb-6 animate-fade-in">
          <h2 className="text-3xl font-bold mb-2">My Blogs</h2>
          <p className="text-muted-foreground">You have {userBlogs.length} blog{userBlogs.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-3 mb-8 animate-fade-in">
          {['approved', 'pending', 'rejected'].map(status => (
            <Button
              key={status}
              onClick={() => handleStatusChange(status)}
              variant={selectedStatus === status ? 'default' : 'outline'}
              className={selectedStatus === status
                ? status === 'approved' ? 'bg-green-600 hover:bg-green-700' :
                  status === 'pending' ? 'bg-yellow-600 hover:bg-yellow-700' :
                    'bg-red-600 hover:bg-red-700'
                : ''
              }
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({userBlogs.filter(b => b.blogStatus === status).length})
            </Button>
          ))}
        </div>

        {/* Blogs Grid with Edit/Delete */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.map((blog, index) => (
            <div key={blog.blogID} className="relative group animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <BlogCard blog={blog} />

              {/* EDIT & DELETE BUTTONS — SHOW ON ALL BLOGS */}
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-9 w-9"
                  onClick={() => handleEditBlog(blog)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-9 w-9"
                  onClick={() => setBlogToDelete({
                    blogID: blog.blogID || blog.id,
                    blogTitle: blog.blogTitle || blog.title
                  })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredBlogs.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              No {selectedStatus} blogs yet.
            </p>
          </div>
        )}

        {/* EDIT BLOG MODAL */}
        {editingBlog && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-3xl max-h-screen overflow-y-auto bg-background">
              <CardHeader className="border-b">
                <CardTitle>Edit Blog</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleUpdateBlog} className="space-y-6">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={editingBlog.blogTitle}
                      onChange={(e) => setEditingBlog({ ...editingBlog, blogTitle: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={editingBlog.categoryID?.toString()}
                      onValueChange={(v) => setEditingBlog({ ...editingBlog, categoryID: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Textarea
                      value={editingBlog.blogDescription}
                      onChange={(e) => setEditingBlog({ ...editingBlog, blogDescription: e.target.value })}
                      className="min-h-64"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Featured Image (optional)</Label>
                    {editingBlog.currentImage && !editingBlog.blogImage && (
                      <img src={editingBlog.currentImage} alt="Current" className="h-48 object-cover rounded" />
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && setEditingBlog({ ...editingBlog, blogImage: e.target.files[0] })}
                    />
                  </div>

                  <div className="flex gap-3 justify-end">
                    <Button type="button" variant="outline" onClick={() => setEditingBlog(null)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Save Changes → Pending Review
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* DELETE CONFIRMATION */}
        <AlertDialog open={!!blogToDelete} onOpenChange={() => setBlogToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Blog?</AlertDialogTitle>
              <AlertDialogDescription>
                "{blogToDelete?.blogTitle || 'This blog'}" will sbe permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteBlog} className="bg-red-600">
                Delete Forever
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default Profile;