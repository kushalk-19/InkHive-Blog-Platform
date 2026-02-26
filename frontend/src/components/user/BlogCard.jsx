import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Calendar, User } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import axios from 'axios';

export const BlogCard = ({ blog }) => {
  // SAFE: Always treat likes as array
  const safeLikes = Array.isArray(blog.likes) ? blog.likes : [];
  const [likes, setLikes] = useState(safeLikes.length);
  const [isLiked, setIsLiked] = useState(false);

  // GET CURRENT USER (KEY: 'currentUser')
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const currentUserID = currentUser?.userID || null;

  // CHECK IF USER LIKED
  useEffect(() => {
    if (currentUserID && safeLikes.includes(currentUserID)) {
      setIsLiked(true);
    }
  }, [safeLikes, currentUserID]);

  const handleLike = async () => {
    if (!currentUserID) {
      toast.error('Login to like');
      return;
    }

    try {
      const res = await axios.post(
        `http://localhost:5000/api/users/blogs/${blog.id}/like`,
        {},
        { withCredentials: true }
      );

      setLikes(res.data.likes);
      setIsLiked(res.data.liked);

      // FIXED TOAST
      if (res.data.liked) {
        toast.success('Liked!');
      } else {
        toast.info('Like removed');
      }
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to like');
    }
  };

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 animate-fade-in">
      <Link to={`/blog/${blog.id}`}>
        <div className="relative overflow-hidden aspect-video">
          <img
            src={blog.image}
            alt={blog.title}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
          <Badge className="absolute top-3 right-3 bg-primary/90 backdrop-blur">
            {blog.category}
          </Badge>
        </div>
      </Link>

      <CardContent className="p-5">
        <Link to={`/blog/${blog.id}`}>
          <h3 className="font-bold text-xl mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {blog.title}
          </h3>
        </Link>

        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {blog.snippet}
        </p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{blog.author}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(blog.date).toLocaleDateString()}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {blog.blogBy}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className={isLiked ? 'text-red-500' : ''}
        >
          <Heart className={`h-4 w-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
          {likes}
        </Button>
        <Link to={`/blog/${blog.id}`}>
          <Button variant="ghost" size="sm">
            <MessageCircle className="h-4 w-4 mr-1" />
            {blog.comments?.length || 0}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};