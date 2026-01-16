import { useState, useEffect } from 'react';
import { Navbar } from '@/components/user/Navbar';
import { BlogCard } from '@/components/user/BlogCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const AllBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const blogsPerPage = 9;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [blogRes, catRes] = await Promise.all([
          axios.get('https://inkhive-backend.onrender.com/api/users/blogs'),
          axios.get('https://inkhive-backend.onrender.com/api/users/admin-categories')
        ]);

        setBlogs(blogRes.data);

        const allCategories = catRes.data.map(c => c.categoryName || c.category);
        setCategories(['All', ...allCategories]);
      } catch (err) {
        toast.error('Failed to load blogs');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter blogs by category
  const filteredBlogs = selectedCategory === 'All'
    ? blogs
    : blogs.filter(blog => 
        blog.category === selectedCategory || 
        blog.categoryName === selectedCategory
      );

  // Reset to page 1 when category changes
  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    setCurrentPage(1);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredBlogs.length / blogsPerPage);
  const startIndex = (currentPage - 1) * blogsPerPage;
  const endIndex = startIndex + blogsPerPage;
  const currentBlogs = filteredBlogs.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

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
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">All Blogs</h1>
          <p className="text-muted-foreground">
            Explore {filteredBlogs.length} blog{filteredBlogs.length !== 1 ? 's' : ''} across various categories
          </p>
        </div>

        <div className="mb-6 flex items-center gap-3 animate-fade-in">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {currentBlogs.map((blog, index) => (
            <div
              key={blog.blogID}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <BlogCard blog={blog} />
            </div>
          ))}
        </div>

        {/* Empty State */}
        {currentBlogs.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <p className="text-muted-foreground text-lg">
              No blogs found in this category. Try selecting a different filter!
            </p>
          </div>
        )}

        {/* Pagination - Only show if more than 1 page */}
        {totalPages > 1 && (
          <Pagination className="mt-10">
            <PaginationContent>
              {/* Previous Button */}
              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="cursor-pointer"
                  />
                </PaginationItem>
              )}

              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => handlePageChange(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}

              {/* Next Button */}
              {currentPage < totalPages && (
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="cursor-pointer"
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        )}
      </main>
    </div>
  );
};

export default AllBlogs;