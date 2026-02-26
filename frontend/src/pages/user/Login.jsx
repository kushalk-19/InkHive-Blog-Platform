import { useState, useEffect } from 'react'; // Added useEffect
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { PenSquare } from 'lucide-react';
import axios from 'axios';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Check if user is logged in (either localStorage or cookie implies login)
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser || document.cookie.includes('userJWTToken')) {
      // Auto-logout by calling backend to clear cookie
      axios.post('http://localhost:5000/api/users/logout', {}, { withCredentials: true })
        .then(() => {
          localStorage.removeItem('currentUser');
          toast.info('You have been logged out');
        })
        .catch((err) => {
          console.error('Logout failed:', err);
          toast.error('Failed to log out automatically');
          // Fallback: Clear localStorage even if backend fails
          localStorage.removeItem('currentUser');
        });
    }
  }, []); // Empty dependency array: Runs only on mount

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post('http://localhost:5000/api/users/login', {
        userEmail: email,
        userPassword: password
      }, { withCredentials: true });
      
      localStorage.setItem('currentUser', JSON.stringify(response.data.user));
      toast.success(response.data.msg);
      setTimeout(() => navigate('/'), 500);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-scale-in">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <PenSquare className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Login to your BlogSpace account</CardDescription>
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
              Login
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <div className="text-sm text-muted-foreground text-center">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline">
              Register here
            </Link>
          </div>
          {/* <div className="text-xs text-muted-foreground text-center">
            Demo: john@example.com / any password
          </div> */}
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;