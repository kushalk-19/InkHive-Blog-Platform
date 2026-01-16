import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/user/Navbar';
import { BlogCard } from '@/components/user/BlogCard';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import axios from 'axios';

const Profile = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [userBlogs, setUserBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('approved');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    userGender: '',
    userContact: '',
    userBio: '',
    userImage: null
  });

  // Fetch current user & their blogs
  useEffect(() => {
    const fetchData = async () => {
      const userStr = localStorage.getItem('currentUser');
      if (!userStr) {
        navigate('/login');
        return;
      }

      try {
        // Fetch user details
        const userRes = await axios.get('https://inkhive-backend.onrender.com/api/users/me', { withCredentials: true });
        const user = userRes.data;
        setCurrentUser(user);

        // Fetch user's own blogs (all statuses)
        const blogsRes = await axios.get('https://inkhive-backend.onrender.com/api/users/my-blogs', { withCredentials: true });
        setUserBlogs(blogsRes.data);
        setFilteredBlogs(blogsRes.data.filter(b => b.blogStatus === 'approved'));

        // Populate edit form
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

  // Filter blogs when status changes
  useEffect(() => {
    if (selectedStatus === 'all') {
      setFilteredBlogs(userBlogs);
    } else {
      setFilteredBlogs(userBlogs.filter(blog => blog.blogStatus === selectedStatus));
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
                  src={
                    currentUser.userImage
                      ? `https://inkhive-backend.onrender.com${currentUser.userImage}`
                      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.userName}`
                  }
                />
                <AvatarFallback>{currentUser.userName[0]}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{currentUser.userName}</h1>
                  <Badge variant="secondary">{currentUser.role}</Badge>
                </div>

                <div className="space-y-2 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{currentUser.userEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(currentUser.created_at).toLocaleDateString()}</span>
                  </div>
                  {currentUser.userBio && (
                    <p className="mt-2 text-foreground">Bio: {currentUser.userBio}</p>
                  )}
                </div>

                <Button onClick={() => setIsEditing(!isEditing)} className="mt-4">
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>

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
          <p className="text-muted-foreground">
            You have published {userBlogs.length} blog{userBlogs.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap gap-3 mb-8 animate-fade-in">
          <Button
            onClick={() => handleStatusChange('approved')}
            variant={selectedStatus === 'approved' ? 'default' : 'outline'}
            className={selectedStatus === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'border-green-600 text-green-600 hover:bg-green-50'}
          >
            Approved ({userBlogs.filter(b => b.blogStatus === 'approved').length})
          </Button>
          <Button
            onClick={() => handleStatusChange('pending')}
            variant={selectedStatus === 'pending' ? 'default' : 'outline'}
            className={selectedStatus === 'pending' ? 'bg-yellow-600 hover:bg-yellow-700' : 'border-yellow-600 text-yellow-600 hover:bg-yellow-50'}
          >
            Pending ({userBlogs.filter(b => b.blogStatus === 'pending').length})
          </Button>
          <Button
            onClick={() => handleStatusChange('rejected')}
            variant={selectedStatus === 'rejected' ? 'default' : 'outline'}
            className={selectedStatus === 'rejected' ? 'bg-red-600 hover:bg-red-700' : 'border-red-600 text-red-600 hover:bg-red-50'}
          >
            Rejected ({userBlogs.filter(b => b.blogStatus === 'rejected').length})
          </Button>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.map((blog, index) => (
            <div key={blog.blogID} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <BlogCard blog={blog} />
            </div>
          ))}
        </div>

        {filteredBlogs.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <p className="text-muted-foreground text-lg">
              You don't have any {selectedStatus} blogs yet.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;