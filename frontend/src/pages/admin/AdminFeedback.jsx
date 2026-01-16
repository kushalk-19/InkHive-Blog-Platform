import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Mail, Calendar } from 'lucide-react';
import axios from 'axios';

const AdminFeedback = () => {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (!adminUser) {
      navigate('/admin/login');
      return;
    }

    const fetchFeedbacks = async () => {
      try {
        const res = await axios.get('https://inkhive-backend.onrender.com/api/users/admin/feedback');
        setFeedbacks(res.data);
      } catch (err) {
        console.error('Failed to load feedback:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-8">
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">View Feedback</h1>
          </div>
          <p className="text-muted-foreground">
            All feedback submitted by users
          </p>
        </div>

        <div className="grid gap-6">
          {feedbacks.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No feedback yet</h3>
                <p className="text-muted-foreground">Users haven't submitted any feedback.</p>
              </CardContent>
            </Card>
          ) : (
            feedbacks.map((feedback, index) => (
              <Card 
                key={feedback.id} 
                className="animate-fade-in hover:shadow-lg transition-shadow"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage 
                          src={feedback.profilePicture || undefined} 
                          alt={feedback.username} 
                        />
                        <AvatarFallback>
                          {feedback.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{feedback.username}</CardTitle>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Mail className="h-4 w-4" />
                          <span>{feedback.email}</span>
                        </div>
                      </div>
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
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminFeedback;