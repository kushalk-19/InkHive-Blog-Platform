import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import axios from 'axios';

const ManageBlogRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlog, setSelectedBlog] = useState(null);

  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (!adminUser) {
      navigate('/admin/login');
      return;
    }

    const fetchPendingBlogs = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/users/blogs/admin/pending', {
          withCredentials: true
        });
        setRequests(res.data);
      } catch (err) {
        toast.error(err.response?.data?.msg || 'Failed to load requests');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingBlogs();
  }, [navigate]);

  const handleApprove = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/users/blogs/admin/${id}/approve`, {}, {
        withCredentials: true
      });
      setRequests(prev => prev.filter(r => r.id !== id));
      toast.success('Blog approved!');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to approve');
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/users/blogs/admin/${id}/reject`, {}, {
        withCredentials: true
      });
      setRequests(prev => prev.filter(r => r.id !== id));
      toast.error('Blog rejected');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to reject');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 p-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">Blog Requests</h1>
          <p className="text-muted-foreground">{requests.length} pending review</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {requests.map((request, index) => (
            <Card
              key={request.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* <CardTitle className="mb-2">{request.title}</CardTitle> */}
                    <CardTitle
                      className="mb-2 text-primary hover:underline cursor-pointer"
                      onClick={() => {
                        console.log('Blog image field:', request?.blogImage || 'MISSING');
                        setSelectedBlog(request);
                      }}
                    >
                      {request.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>By {request.author}</span>
                      <span>•</span>
                      <span>{new Date(request.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="mb-3">{request.category}</Badge>
                <p className="text-muted-foreground">{request.snippet}</p>
              </CardContent>
              <CardFooter className="gap-3">
                <Button
                  className="flex-1"
                  onClick={() => handleApprove(request.id)}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleReject(request.id)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {requests.length === 0 && !loading && (
          <div className="text-center py-16 animate-fade-in">
            <p className="text-muted-foreground text-lg">
              No blog requests at the moment
            </p>
          </div>
        )}

        {/* BLOG DETAILS POPUP */}
        <Dialog open={!!selectedBlog} onOpenChange={() => setSelectedBlog(null)}>
          <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedBlog?.title}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Author:</span> {selectedBlog?.author}
                </div>
                <div>
                  <span className="font-medium">Category:</span> {selectedBlog?.category}
                </div>
                <div>
                  <span className="font-medium">Submitted:</span> {selectedBlog && new Date(selectedBlog.date).toLocaleDateString()}
                </div>
              </div>

              {selectedBlog?.blogImage && (
                <div>
                  <img
                    src={`http://localhost:5000${selectedBlog.blogImage}`}
                    alt={selectedBlog.title || 'Blog Image'}
                    className="w-full max-h-96 object-cover rounded-lg"
                  />
                </div>
              )}

              <ScrollArea className="h-96 rounded-md border p-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {selectedBlog?.fullDescription}
                </div>
              </ScrollArea>
            </div>

            <DialogFooter className="gap-3">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  handleReject(selectedBlog?.id);
                  setSelectedBlog(null);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  handleApprove(selectedBlog?.id);
                  setSelectedBlog(null);
                }}
              >
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
};

export default ManageBlogRequests;