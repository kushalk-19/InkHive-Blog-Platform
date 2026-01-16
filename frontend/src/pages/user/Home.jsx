import { useEffect, useState } from 'react';
import { Navbar } from '@/components/user/Navbar';
import { FeaturedCarousel } from '@/components/user/FeaturedCarousel';
import { BlogCard } from '@/components/user/BlogCard';
import { Sparkles } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const Home = () => {
  const [featuredBlogs, setFeaturedBlogs] = useState([]);
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        // 1. Get ALL approved blogs for Recent section & fallback
        const allRes = await axios.get('http://localhost:5000/api/users/blogs');
        const allBlogs = allRes.data;

        // 2. Get ONLY 4 featured blogs with correct blogID for carousel
        const featuredRes = await axios.get('http://localhost:5000/api/users/blogs/featured');
        const featured = featuredRes.data;

        // Use featured route if available, else fallback to top 4 from main route
        const carouselBlogs = featured.length > 0 ? featured : allBlogs.slice(0, 4);

        // Sort all blogs for Recent section
        const sorted = [...allBlogs].sort((a, b) =>
          new Date(b.date || b.created_at) - new Date(a.date || a.created_at)
        );

        setFeaturedBlogs(carouselBlogs);
        setRecentBlogs(sorted.slice(0, 6));
      } catch (err) {
        console.error(err);
        toast.error('Failed to load blogs');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Featured Stories
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Inkhive is a creative space where writers, bloggers, and content creators come together to share their ideas, stories, and insights. It’s a vibrant community of thinkers and makers, offering a platform for expression, engagement, and collaboration.
          </p>
        </div>

        {/* Featured Carousel */}
        {featuredBlogs.length > 0 ? (
          <div className="mb-16 animate-scale-in">
            <FeaturedCarousel blogs={featuredBlogs} />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-xl">No featured stories yet.</p>
          </div>
        )}

        {/* Recent Blogs */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-6">Recent Blogs</h2>

          {recentBlogs.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                No approved blogs yet. Be the first to publish!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentBlogs.map((blog, index) => (
                <div
                  key={blog.blogID}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <BlogCard blog={blog} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 Inkhive. Made with love for writers everywhere.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;