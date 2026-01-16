import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Moon, Sun, PenSquare, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from '@/components/ui/avatar';
import { useTheme } from '@/contexts/ThemeContext';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const currentUserStr = localStorage.getItem('currentUser');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const refreshUser = async () => {
      const saved = localStorage.getItem('currentUser');
      if (saved) {
        try {
          const res = await axios.get('https://inkhive-backend.onrender.com/api/users/me', {
            withCredentials: true
          });
          const freshUser = res.data;
          localStorage.setItem('currentUser', JSON.stringify(freshUser));
          setUser(freshUser); // THIS MAKES IT REACTIVE
        } catch (err) {
          console.log('Could not refresh user data');
        }
      }
    };

    refreshUser();
  }, []);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    window.location.href = '/';
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            {/* <PenSquare className="h-6 w-6 text-primary" /> */}
            <img
              src="/Logo2.png"
              alt="InkHive Logo"
              className="h-12 w-12"
            />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              InkHive
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${isActive('/') ? 'text-primary' : 'text-muted-foreground'}`}
            >
              Home
            </Link>
            <Link
              to="/blogs"
              className={`text-sm font-medium transition-colors hover:text-primary ${isActive('/blogs') ? 'text-primary' : 'text-muted-foreground'}`}
            >
              All Blogs
            </Link>
            <Link
              to="/about"
              className={`text-sm font-medium transition-colors hover:text-primary ${isActive('/about') ? 'text-primary' : 'text-muted-foreground'}`}
            >
              About
            </Link>
            <Link
              to="/feedback"
              className={`text-sm font-medium transition-colors hover:text-primary ${isActive('/feedback') ? 'text-primary' : 'text-muted-foreground'}`}
            >
              Feedback
            </Link>

            {currentUserStr && (
              <>
                <Link
                  to="/add-blog"
                  className={`text-sm font-medium transition-colors hover:text-primary ${isActive('/add-blog') ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  Add Blog
                </Link>

                {/* PROFILE AVATAR + NAME */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user?.userImage ? `https://inkhive-backend.onrender.com${user.userImage}` : undefined}
                      alt={user?.userName}
                    />
                    <AvatarFallback className="text-xs">
                      {user?.firstName?.[0]?.toUpperCase() || user?.userName?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Link
                    to="/profile"
                    className={`text-sm font-medium transition-colors hover:text-primary hidden lg:block ${isActive('/profile') ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    {user?.userName}
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>

            {currentUserStr ? (
              <Button onClick={handleLogout} variant="outline" className="hidden md:flex">
                Logout
              </Button>
            ) : (
              <Link to="/login" className="hidden md:block">
                <Button>Login</Button>
              </Link>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <nav className="flex flex-col gap-4 mt-8">
                  <Link
                    to="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-lg font-medium transition-colors hover:text-primary px-4 py-2 rounded-md ${isActive('/') ? 'bg-muted text-primary' : 'text-muted-foreground'}`}
                  >
                    Home
                  </Link>
                  <Link
                    to="/blogs"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-lg font-medium transition-colors hover:text-primary px-4 py-2 rounded-md ${isActive('/blogs') ? 'bg-muted text-primary' : 'text-muted-foreground'}`}
                  >
                    All Blogs
                  </Link>
                  {currentUserStr && (
                    <>
                      <Link
                        to="/add-blog"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`text-lg font-medium transition-colors hover:text-primary px-4 py-2 rounded-md ${isActive('/add-blog') ? 'bg-muted text-primary' : 'text-muted-foreground'}`}
                      >
                        Add Blog
                      </Link>

                      {/* Mobile Profile with Avatar */}
                      <div className="flex items-center gap-3 px-4 py-2">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={user?.userImage ? `https://inkhive-backend.onrender.com${user.userImage}` : undefined}
                            alt={user?.userName}
                          />
                          <AvatarFallback>
                            {user?.firstName?.[0]?.toUpperCase() || user?.userName?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <Link
                          to="/profile"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`text-lg font-medium transition-colors hover:text-primary flex-1 ${isActive('/profile') ? 'text-primary' : 'text-muted-foreground'}`}
                        >
                          {user?.userName}
                        </Link>
                      </div>
                    </>
                  )}
                  <div className="border-t pt-4 mt-4">
                    {currentUserStr ? (
                      <Button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} variant="outline" className="w-full">
                        Logout
                      </Button>
                    ) : (
                      <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full">Login</Button>
                      </Link>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};