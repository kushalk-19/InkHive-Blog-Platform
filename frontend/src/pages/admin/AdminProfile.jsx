import { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Camera, ImageOff } from 'lucide-react';
import axios from 'axios';

const AdminProfile = () => {
  const [adminData, setAdminData] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    contactNumber: '',
    image: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const res = await axios.get('https://inkhive-backend.onrender.com/api/users/admin-profile', {
          withCredentials: true,
        });
        const data = res.data.admin;

        setAdminData(data);
        setFormData({
          username: data.userName || '',
          email: data.userEmail || '',
          contactNumber: data.userContact || '',
          image: data.userImage ? `https://inkhive-backend.onrender.com${data.userImage}` : '',
        });
      } catch (err) {
        toast.error(err.response?.data?.msg || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdmin();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const username = formData.username.trim();
    if (username.length < 8 || username.length > 16 || /\s/.test(username)) {
      toast.error('Username: 8–16 chars, no spaces');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(formData.contactNumber)) {
      toast.error('Contact: 10 digits, starts with 6-9');
      return;
    }

    const submitData = new FormData();
    submitData.append('userName', username.toLowerCase());
    submitData.append('userContact', formData.contactNumber);

    // Only append image if it's a File (not URL)
    if (formData.image && formData.image.startsWith('data:')) {
      const response = await fetch(formData.image);
      const blob = await response.blob();
      submitData.append('userImage', blob, 'admin-image.jpg');
    }

    try {
      const res = await axios.patch(
        'https://inkhive-backend.onrender.com/api/users/admin-profile',
        submitData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      const updated = res.data.admin;
      setAdminData(updated);
      localStorage.setItem('adminUser', JSON.stringify(updated));

      // Update image preview to new URL
      setFormData({
        ...formData,
        image: updated.userImage ? `https://inkhive-backend.onrender.com${updated.userImage}` : '',
      });

      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Update failed');
    }
  };

  // const handleReset = () => {
  //   if (adminData) {
  //     setFormData({
  //       username: adminData.userName || '',
  //       email: adminData.userEmail || '',
  //       contactNumber: adminData.userContact || '',
  //       image: adminData.userImage ? `https://inkhive-backend.onrender.com${adminData.userImage}` : '',
  //     });
  //   }
  //   toast.info('Changes reset');
  // };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Admin Profile</h1>
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>View and manage your profile details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="h-32 w-32">
                      {formData.image ? (
                        <AvatarImage src={formData.image} alt={formData.username} />
                      ) : (
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs flex flex-col items-center justify-center p-2">
                          <ImageOff className="h-5 w-5 mb-1" />
                          <span>No image</span>
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <label
                      htmlFor="image-upload"
                      className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90"
                    >
                      <Camera className="h-4 w-4" />
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\s/g, '').toLowerCase();
                      setFormData({ ...formData, username: val });
                    }}
                    placeholder="Enter username (8-60 chars, no spaces)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={formData.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact">Contact Number</Label>
                  <Input
                    id="contact"
                    value={formData.contactNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData({ ...formData, contactNumber: val });
                    }}
                    placeholder="Not provided"
                    maxLength={10}
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit">Save Changes</Button>
                  {/* <Button type="button" variant="outline" onClick={handleReset}>
                    Reset
                  </Button> */}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;