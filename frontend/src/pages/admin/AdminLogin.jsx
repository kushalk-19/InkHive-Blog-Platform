import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';
import axios from 'axios';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Clear httpOnly cookie via backend
    axios.post('http://localhost:5000/api/users/admin-logout', {}, {
      withCredentials: true
    }).catch(() => {
      // Ignore error — we just want to clear cookie if exists
    });

    // Clear localStorage
    localStorage.removeItem('adminUser');
  }, []); // ← Runs once on mount

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        'http://localhost:5000/api/users/admin-login',   // <-- admin endpoint
        {
          userEmail: email,
          userPassword: password,
        },
        { withCredentials: true }
      );

      // Store admin data in localStorage (same key your sidebar uses)
      localStorage.setItem('adminUser', JSON.stringify(res.data.admin));

      toast.success(res.data.msg);
      setTimeout(() => navigate('/admin/dashboard'), 500);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Admin login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-scale-in">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Admin Portal</CardTitle>
          <CardDescription>Secure admin access only</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              {/* <Label htmlFor="email">Email</Label> */}
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              {/* <Label htmlFor="password">Password</Label> */}
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Admin Login
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          {/* <div className="text-xs text-muted-foreground text-center w-full">
            Demo: admink@inkhive.com / any password
          </div> */}
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminLogin;