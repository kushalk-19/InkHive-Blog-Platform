import { useState } from 'react';
import { Send, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash2 } from 'lucide-react';
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
import { toast } from 'sonner';
import axios from 'axios';

export const CommentSection = ({ comments, blogId, onAddComment, onDeleteComment }) => {
  const [newComment, setNewComment] = useState('');
  const [commentToDelete, setCommentToDelete] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const userName = currentUser.userName;
  const userID = currentUser.userID;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser.userID) {
      toast.error('Please login to comment');
      return;
    }
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    if (newComment.trim().length > 100) {
      toast.error('Max 100 characters');
      return;
    }

    try {
      const res = await axios.post(
        `http://localhost:5000/api/users/blogs/${blogId}/comment`,
        { commentText: newComment },
        { withCredentials: true }
      );

      const savedComment = {
        ...res.data.comment,
        _id: res.data.comment._id || Date.now().toString(), // ← REAL OR TEMP ID
        author: userName,
        userID: userID,
        timestamp: res.data.comment.created_at || new Date().toISOString()
      };

      onAddComment(savedComment);
      setNewComment('');
      toast.success('Comment posted!');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to post');
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <h3 className="text-2xl font-bold">Comments ({comments.length})</h3>

      {currentUser.userID && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="Share your thoughts..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px] resize-none"
          />
          <div className="flex justify-end">
            <Button type="submit" className="gap-2">
              <Send className="h-4 w-4" />
              Post Comment
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {comments.map((comment) => {
          const isOwnComment = userID && comment.userID === userID;

          return (
            <div key={comment._id} className="p-4 rounded-lg border bg-card animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <UserIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {comment.author || `User ${comment.userID}`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.timestamp || comment.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* DELETE BUTTON - ONLY FOR OWNER */}
                    {isOwnComment && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:bg-red-50"
                        onClick={() => setCommentToDelete(comment._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm">{comment.commentText}</p>
                </div>
              </div>
            </div>
          );
        })}

        {comments.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to share your thoughts!
          </p>
        )}
      </div>
      <AlertDialog open={!!commentToDelete} onOpenChange={() => setCommentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your comment will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDeleteComment(commentToDelete);
                setCommentToDelete(null);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};