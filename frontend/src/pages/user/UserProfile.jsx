import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/user/Navbar';
import { BlogCard } from '@/components/user/BlogCard';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Mail, User as UserIcon, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const UserProfile = () => {
    const { userId } = useParams();
    const [user, setUser] = useState(null);
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserAndBlogs = async () => {
            try {
                // Step 1: Get user details
                const userRes = await axios.get(`http://localhost:5000/api/users/profile/${userId}`);
                setUser(userRes.data);

                // Step 2: Get all approved blogs by this user
                const blogsRes = await axios.get(`http://localhost:5000/api/users/blogs/by-user/${userId}`);
                setBlogs(blogsRes.data);
            } catch (err) {
                toast.error('User not found or no blogs');
            } finally {
                setLoading(false);
            }
        };

        fetchUserAndBlogs();
    }, [userId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto px-4 py-16 text-center">
                    <h1 className="text-3xl font-bold mb-4">User not found</h1>
                    <Link to="/blogs">
                        <Button>Back to Blogs</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-4 py-12 max-w-6xl">
                <Link to="/blogs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
                    <ArrowLeft className="h-4 w-4" />
                    Back to blogs
                </Link>

                {/* USER INFO CARD */}
                <Card className="mb-12">
                    <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row items-start gap-8">
                            <Avatar className="h-32 w-32 ring-4 ring-primary/10">
                                <AvatarImage src={user.userImage || ''} />
                                <AvatarFallback className="text-3xl">
                                    {user.userName?.[0]?.toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 space-y-4">
                                <div>
                                    <h1 className="text-4xl font-bold mb-2">{user.userName}</h1>
                                    <Badge variant="secondary" className="text-sm">
                                        {user.role === 'admin' ? 'Administrator' : 'Blogger'}
                                    </Badge>
                                </div>

                                <div className="space-y-3 text-muted-foreground">
                                    {user.userEmail && (
                                        <div className="flex items-center gap-3">
                                            <Mail className="h-5 w-5" />
                                            <span>{user.userEmail}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <Calendar className="h-5 w-5" />
                                        <span>Joined {new Date(user.created_at || Date.now()).toLocaleDateString()}</span>
                                    </div>
                                    {user.userBio && (
                                        <p className="text-muted-foreground text-sm mt-3 max-w-2xl">
                                            Bio: {user.userBio}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <UserIcon className="h-5 w-5" />
                                        <span>{blogs.length} Published Blog{blogs.length !== 1 ? 's' : ''}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* USER'S BLOGS */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold mb-6">{user.userName}'s Blogs</h2>
                </div>

                {blogs.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <p className="text-xl text-muted-foreground">
                                No published blogs yet.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {blogs.map((blog, index) => (
                            <div
                                key={blog.id}
                                className="animate-fade-in"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <BlogCard blog={blog} />
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default UserProfile;