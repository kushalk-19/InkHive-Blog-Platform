import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

export const FeaturedCarousel = ({ blogs }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % blogs.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + blogs.length) % blogs.length);
  };

  useEffect(() => {
    if (blogs.length <= 1) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [blogs.length]);

  if (!blogs || blogs.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl">
      <div 
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {blogs.map((blog) => (
          <div key={blog.blogID} className="min-w-full">
            <Link to={`/blog/${blog.blogID}`}>
              <Card className="border-0 rounded-2xl overflow-hidden bg-gradient-to-br from-card to-muted/50">
                <CardContent className="p-0">
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="relative aspect-video md:aspect-auto overflow-hidden">
                      <img 
                        src={blog.image || blog.blogImage} 
                        alt={blog.title || blog.blogTitle}
                        className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                      />
                      <Badge className="absolute top-4 left-4 bg-primary/90 backdrop-blur">
                        {blog.category || blog.categoryName || 'Uncategorized'}
                      </Badge>
                    </div>
                    <div className="p-8 md:p-12 flex flex-col justify-center">
                      <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                        {blog.title || blog.blogTitle}
                      </h2>
                      <p className="text-muted-foreground mb-6 line-clamp-3">
                        {blog.blogDescription?.substring(0, 150) || blog.snippet || 'No description available'}...
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>By {blog.author || 'Anonymous'}</span>
                        <span>•</span>
                        <span>{new Date(blog.date || blog.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="absolute inset-y-0 left-4 right-4 flex items-center justify-between pointer-events-none">
        <Button
          variant="outline"
          size="icon"
          onClick={prevSlide}
          className="pointer-events-auto rounded-full bg-background/80 backdrop-blur border-2 hover:bg-background"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={nextSlide}
          className="pointer-events-auto rounded-full bg-background/80 backdrop-blur border-2 hover:bg-background"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {blogs.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};