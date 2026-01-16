import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, ImageOff, Trash2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { User } from 'lucide-react';  // ← ADD THIS LINE
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const ManageUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Admin guard
  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (!adminUser) navigate('/admin/login');
  }, [navigate]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('https://inkhive-backend.onrender.com/api/users/all', {
          withCredentials: true,
        });
        setUsers(res.data);
      } catch (err) {
        toast.error(err.response?.data?.msg || 'Failed to load users');
      }
    };
    fetchUsers();
  }, []);

  // Handle Delete
  const handleDelete = async () => {
    try {
      await axios.delete(`https://inkhive-backend.onrender.com/api/users/${deleteId}`, {
        withCredentials: true,
      });
      setUsers(users.filter((u) => u._id !== deleteId));
      toast.success('User deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to delete user');
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  const openDeleteDialog = (id) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 p-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">Manage Users</h1>
          <p className="text-muted-foreground">{users.length} registered users</p>
        </div>

        <div className="bg-card rounded-lg border animate-fade-in-up">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>UserName</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Bio</TableHead>
                <TableHead>Joined</TableHead>
                {/* <TableHead>Role</TableHead> */}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  {/* USER IMAGE + USERNAME */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage
                          src={user.userImage ? `https://inkhive-backend.onrender.com${user.userImage}` : undefined}
                          alt={user.userName}
                        />
                        {/* <AvatarFallback className="bg-primary/10">
                          <User className="h-5 w-5 text-primary" />
                        </AvatarFallback> */}
                        <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                          {user.firstName?.[0]?.toUpperCase() || user.userName?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.userName}</span>
                    </div>
                  </TableCell>

                  <TableCell>{user.userEmail}</TableCell>

                  <TableCell>
                    {user.userContact ? user.userContact : (<span className="text-muted-foreground italic">Not provided</span>)}
                  </TableCell>

                  <TableCell className="max-w-xs">
                    {user.userBio ? (
                      <p className="truncate">{user.userBio}</p>
                    ) : (
                      <span className="text-muted-foreground italic">
                        Not provided
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>

                  {/* <TableCell>
                    <Badge variant="secondary">{user.role}</Badge>
                  </TableCell> */}

                  {/* ACTIONS: More + Delete */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {/* <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button> */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(user._id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the user
                and all their data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default ManageUsers;