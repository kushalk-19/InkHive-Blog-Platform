import { useState, useEffect } from 'react';
import { Navbar } from '@/components/user/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MessageSquare, Plus, User, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const Feedback = () => {
  const { toast } = useToast();
  const currentUserStr = localStorage.getItem('currentUser');
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

  const [feedbacks, setFeedbacks] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFeedback, setNewFeedback] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/users/feedback');
        setFeedbacks(res.data);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load feedback",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchFeedbacks();
  }, []);

  const handleSubmitFeedback = async () => {
    const text = newFeedback.trim();
    if (!text || text.length < 10 || text.length > 200) {
      toast({
        title: "Invalid Feedback",
        description: "Feedback must be 10-200 characters",
        variant: "destructive"
      });
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/users/feedback', {
        feedbackDescription: text
      }, { withCredentials: true });

      const newFb = {
        id: Date.now(),
        username: currentUser?.userName || 'Anonymous',
        description: text,
        date: new Date().toLocaleDateString()
      };

      setFeedbacks([newFb, ...feedbacks]);
      setNewFeedback('');
      setIsDialogOpen(false);

      toast({
        title: "Success!",
        description: "Thank you for your feedback!",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err.response?.data?.msg || "Failed to submit feedback",
        variant: "destructive"
      });
    }
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 animate-fade-in-up">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-8 w-8 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Feedback
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              See what our community is saying about InkHive
            </p>
          </div>
          
          {currentUser && (
            <Button onClick={() => setIsDialogOpen(true)} className="mt-4 md:mt-0 gap-2">
              <Plus className="h-4 w-4" />
              Give Feedback
            </Button>
          )}
        </div>

        <div className="grid gap-6">
          {feedbacks.map((feedback, index) => (
            <Card 
              key={feedback.id} 
              className="animate-fade-in hover:shadow-lg transition-shadow"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{feedback.username}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>{feedback.date}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feedback.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {feedbacks.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No feedback yet</h3>
              <p className="text-muted-foreground">Be the first to share your thoughts!</p>
            </CardContent>
          </Card>
        )}
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Your Feedback</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Tell us what you think about InkHive... (10-200 characters)"
              value={newFeedback}
              onChange={(e) => setNewFeedback(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2 text-right">
              {newFeedback.length}/200
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitFeedback}>
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 Inkhive. Made with love for writers everywhere.</p>
        </div>
      </footer>
    </div>
  );
};

export default Feedback;