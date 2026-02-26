import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";


// User Pages
import Home from "./pages/user/Home";
import AllBlogs from "./pages/user/AllBlogs";
import SingleBlog from "./pages/user/SingleBlog";
import AddBlog from "./pages/user/AddBlog";
import Profile from "./pages/user/Profile";
import Login from "./pages/user/Login";
import Register from "./pages/user/Register";
import UserProfile from '@/pages/user/UserProfile';
import About from "./pages/user/About";
import Feedback from "./pages/user/Feedback";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageBlogs from "./pages/admin/ManageBlogs";
import ManageBlogRequests from "./pages/admin/ManageBlogRequests";
import ManageCategories from "./pages/admin/ManageCategories";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminFeedback from "./pages/admin/AdminFeedback";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* User Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/blogs" element={<AllBlogs />} />
            <Route path="/blog/:id" element={<SingleBlog />} />
            <Route path="/add-blog" element={<AddBlog />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about" element={<About />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/user/:userId" element={<UserProfile />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<ManageUsers />} />
            <Route path="/admin/blogs" element={<ManageBlogs />} />
            <Route path="/admin/requests" element={<ManageBlogRequests />} />
            <Route path="/admin/categories" element={<ManageCategories />} />
            <Route path="/admin/feedback" element={<AdminFeedback />} />
            <Route path="/admin/profile" element={<AdminProfile />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
