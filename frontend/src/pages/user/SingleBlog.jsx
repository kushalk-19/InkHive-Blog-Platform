import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/user/Navbar';
import { CommentSection } from '@/components/user/CommentSection';
import axios from 'axios';
import { Heart, MessageCircle, Calendar, User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const SingleBlog = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState([]);

  // GET CURRENT USER
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const currentUserID = currentUser?.userID || null;

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/users/blogs/${id}`);
        const data = res.data;

        setBlog(data);
        setLikes(data.likes?.length || 0);
        setComments(data.comments || []);

        // CHECK IF USER LIKED
        if (currentUserID && data.likes?.includes(currentUserID)) {
          setIsLiked(true);
        }
      } catch (err) {
        toast.error('Blog not found');
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [id, currentUserID]);

  const handleLike = async () => {
    if (!currentUserID) {
      toast.error('Login to like');
      return;
    }

    try {
      const res = await axios.post(
        `http://localhost:5000/api/users/blogs/${id}/like`,
        {},
        { withCredentials: true }
      );

      setLikes(res.data.likes);
      setIsLiked(res.data.liked);
      toast[res.data.liked ? 'success' : 'info'](
        res.data.liked ? 'Liked!' : 'Like removed'
      );
    } catch (err) {
      toast.error('Failed to like');
    }
  };

  const handleAddComment = (comment) => {
    setComments(prev => [...prev, comment]);
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`http://localhost:5000/api/users/blogs/${id}/comment/${commentId}`, {
        withCredentials: true
      });
      setComments(prev => prev.filter(c => c._id !== commentId));
      toast.success('Comment deleted successfully');
    } catch (err) {
      toast.error('Failed to delete comment');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Blog not found</h1>
          <Link to="/blogs">
            <Button>View All Blogs</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/blogs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 animate-fade-in">
          <ArrowLeft className="h-4 w-4" />
          Back to all blogs
        </Link>

        <article className="animate-fade-in-up">
          <div className="mb-6">
            <Badge className="mb-4">{blog.category}</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              {blog.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <Link
                  to={`/user/${blog.authorId || blog.userID || blog.adminID}`}
                  className="font-medium text-foreground hover:underline transition-colors"
                >
                  {blog.author}
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(blog.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
            </div>
          </div>

          <div className="relative aspect-video rounded-2xl overflow-hidden mb-8">
            <img
              src={blog.image}
              alt={blog.title}
              className="object-cover w-full h-full"
            />
          </div>

          <div className="flex items-center gap-4 mb-8 pb-8 border-b">
            <Button
              variant="outline"
              size="lg"
              onClick={handleLike}
              className={isLiked ? 'text-red-500 border-red-500' : ''}
            >
              <Heart className={`h-5 w-5 mr-2 ${isLiked ? 'fill-current' : ''}`} />
              {likes} Likes
            </Button>
            <Button variant="outline" size="lg">
              <MessageCircle className="h-5 w-5 mr-2" />
              {comments.length} Comments
            </Button>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
            <p className="text-lg leading-relaxed">
              {blog.snippet} {/* ← Use snippet or add full content */}
            </p>
          </div>

          <CommentSection
            comments={comments}
            blogId={blog.id}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
          />
        </article>
      </main>
    </div>
  );
};

export default SingleBlog;