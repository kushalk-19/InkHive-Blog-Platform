import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Clock, Tag, Eye } from 'lucide-react';
import axios from 'axios';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState('Admin');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBlogs: 0,
    pendingBlogs: 0,
    totalCategories: 0
  });
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [topCategories, setTopCategories] = useState([]);

  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (!adminUser) {
      navigate('/admin/login');
      return;
    }
    try {
      const parsed = JSON.parse(adminUser);
      setAdminName(parsed.userName || 'Admin');
    } catch (err) {
      setAdminName('Admin');
    }

    // Fetch all real data
    const fetchDashboardData = async () => {
      try {
        const [usersRes, blogsRes, categoriesRes] = await Promise.all([
          axios.get('http://localhost:5000/api/users/admin/users'),        // ← changed
          axios.get('http://localhost:5000/api/users/admin/blogs'),        // ← changed
          axios.get('http://localhost:5000/api/users/admin-categories')
        ]);

        const users = usersRes.data;
        const blogs = blogsRes.data;
        const categories = categoriesRes.data;

        // Count real stats
        const totalUsers = users.length; // ← Because we already filtered in backend!
        const approvedBlogs = blogs.filter(b => b.blogStatus === 'approved').length;
        const pendingBlogs = blogs.filter(b => b.blogStatus === 'pending').length;

        // Recent 5 user blogs
        const recent = blogs
          .filter(b => b.blogBy === 'user')
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5)
          .map(b => ({
            id: b.blogID,
            title: b.blogTitle,
            author: b.userName || 'Unknown User',
            date: new Date(b.created_at).toLocaleDateString()
          }));

        // Top categories with percentage
        // ALL APPROVED BLOGS — FROM BOTH ADMIN AND USERS
        const approvedBlogsAll = blogs.filter(b => b.blogStatus === 'approved');
        const categoryCount = {};
        approvedBlogsAll.forEach(b => {
          const catId = b.categoryID?._id || b.categoryID;
          const catName = categories.find(c =>
            c.categoryID === catId ||
            c._id?.toString() === catId?.toString()
          )?.categoryName || 'Uncategorized';

          categoryCount[catName] = (categoryCount[catName] || 0) + 1;
        });

        const totalApprovedAll = approvedBlogsAll.length || 1;
        const categoryList = Object.entries(categoryCount)
          .map(([name, count]) => ({
            name,
            count,
            percentage: Math.round((count / totalApprovedAll) * 100)
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);

        setStats({
          totalUsers,
          totalBlogs: approvedBlogs,
          pendingBlogs,
          totalCategories: categories.length
        });
        setRecentBlogs(recent);
        setTopCategories(categoryList);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500' },
    { title: 'Approved Blogs', value: stats.totalBlogs, icon: FileText, color: 'text-green-500' },
    { title: 'Pending Requests', value: stats.pendingBlogs, icon: Clock, color: 'text-orange-500' },
    { title: 'Total Categories', value: stats.totalCategories, icon: Tag, color: 'text-purple-500' },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-x-hidden">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {adminName}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Card key={stat.title} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Blogs */}
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Recent User Blogs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentBlogs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No blogs yet</p>
                ) : (
                  recentBlogs.map((blog) => (
                    <div key={blog.id} className="flex items-center gap-3 pb-3 border-b last:border-0">
                      <div className="h-12 w-12 rounded bg-primary/10 flex-shrink-0 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{blog.title}</p>
                        <p className="text-sm text-muted-foreground">
                          By {blog.author} • {blog.date}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Categories */}
          <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle>Top Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCategories.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No data yet</p>
                ) : (
                  topCategories.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between">
                      <span className="font-medium text-sm">{cat.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all"
                            style={{ width: `${cat.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {cat.percentage}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;