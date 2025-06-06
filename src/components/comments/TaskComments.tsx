import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Reply, Edit, Trash2, MoreVertical, AtSign, Paperclip, Heart, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import type { TaskComment } from '@/types/task';

interface TaskCommentsProps {
  taskId: string;
  comments: TaskComment[];
  onCommentAdd: (comment: Omit<TaskComment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCommentUpdate: (commentId: string, updates: Partial<TaskComment>) => void;
  onCommentDelete: (commentId: string) => void;
  currentUserId: string;
  currentUserName: string;
  disabled?: boolean;
}

interface CommentReaction {
  id: string;
  userId: string;
  userName: string;
  type: 'like' | 'love' | 'thumbsup';
  createdAt: Date;
}

const REACTION_EMOJIS = {
  like: '👍',
  love: '❤️',
  thumbsup: '👍'
};

export function TaskComments({
  taskId,
  comments,
  onCommentAdd,
  onCommentUpdate,
  onCommentDelete,
  currentUserId,
  currentUserName,
  disabled = false
}: TaskCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [mentions, setMentions] = useState<string[]>([]);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Sort comments by creation date, with replies nested under parent comments
  const sortedComments = comments
    .filter(comment => !comment.parentCommentId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map(comment => ({
      ...comment,
      replies: comments
        .filter(reply => reply.parentCommentId === comment.id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }));

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    onCommentAdd({
      taskId,
      userId: currentUserId,
      content: newComment.trim(),
      mentions,
      attachments: [],
      isEdited: false,
    });

    setNewComment('');
    setMentions([]);
    toast({
      title: 'Comment added',
      description: 'Your comment has been posted successfully.',
    });
  };

  const handleAddReply = (parentCommentId: string) => {
    if (!replyContent.trim()) return;

    onCommentAdd({
      taskId,
      userId: currentUserId,
      content: replyContent.trim(),
      parentCommentId,
      mentions,
      attachments: [],
      isEdited: false,
    });

    setReplyContent('');
    setReplyingTo(null);
    setMentions([]);
    toast({
      title: 'Reply added',
      description: 'Your reply has been posted successfully.',
    });
  };

  const handleEditComment = (commentId: string, content: string) => {
    setEditingComment(commentId);
    setEditContent(content);
  };

  const handleSaveEdit = (commentId: string) => {
    if (!editContent.trim()) return;

    onCommentUpdate(commentId, {
      content: editContent.trim(),
      isEdited: true,
      updatedAt: new Date(),
    });

    setEditingComment(null);
    setEditContent('');
    toast({
      title: 'Comment updated',
      description: 'Your comment has been updated successfully.',
    });
  };

  const handleDeleteComment = (commentId: string) => {
    onCommentDelete(commentId);
    toast({
      title: 'Comment deleted',
      description: 'The comment has been deleted successfully.',
    });
  };

  const handleMention = (username: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = newComment;
    const beforeText = text.substring(0, start);
    const afterText = text.substring(end);
    
    const newText = beforeText + `@${username} ` + afterText;
    setNewComment(newText);
    
    if (!mentions.includes(username)) {
      setMentions([...mentions, username]);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTimestamp = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInHours = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return formatDistanceToNow(dateObj, { addSuffix: true });
    } else {
      return format(dateObj, 'MMM d, yyyy HH:mm');
    }
  };

  const renderComment = (comment: TaskComment & { replies?: TaskComment[] }, isReply = false) => {
    const isEditing = editingComment === comment.id;
    const isOwner = comment.userId === currentUserId;

    return (
      <div key={comment.id} className={`${isReply ? 'ml-8 mt-3' : 'mt-4'}`}>
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="text-xs">
              {getInitials(comment.userId)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{comment.userId}</span>
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(comment.createdAt)}
                </span>
                {comment.isEdited && (
                  <Badge variant="outline" className="text-xs">edited</Badge>
                )}
              </div>
              
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[60px]"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSaveEdit(comment.id)}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingComment(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {comment.content}
                  </div>
                  
                  {comment.mentions && comment.mentions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {comment.mentions.map(mention => (
                        <Badge key={mention} variant="secondary" className="text-xs">
                          @{mention}
                        </Badge>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            
            {!isEditing && (
              <div className="flex items-center gap-2 mt-1">
                {!isReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(comment.id)}
                    className="text-xs h-6 px-2"
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Reply
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReactions(showReactions === comment.id ? null : comment.id)}
                  className="text-xs h-6 px-2"
                >
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  React
                </Button>
                
                {isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditComment(comment.id, comment.content)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Reply form */}
        {replyingTo === comment.id && (
          <div className="ml-11 mt-3">
            <div className="space-y-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`Reply to ${comment.userId}...`}
                className="min-h-[60px]"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleAddReply(comment.id)}>
                  <Send className="h-3 w-3 mr-1" />
                  Reply
                </Button>
                <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Replies */}
        {comment.replies && comment.replies.map(reply => renderComment(reply, true))}
      </div>
    );
  };

  if (disabled) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Comments are not available for this task.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Add new comment */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="text-xs">
                {getInitials(currentUserName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="min-h-[80px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleAddComment();
                  }
                }}
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-xs">
                <AtSign className="h-3 w-3 mr-1" />
                Mention
              </Button>
              <Button variant="ghost" size="sm" className="text-xs">
                <Paperclip className="h-3 w-3 mr-1" />
                Attach
              </Button>
            </div>
            
            <div className="flex gap-2">
              <span className="text-xs text-muted-foreground">
                Ctrl+Enter to post
              </span>
              <Button 
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                size="sm"
                className="gap-1"
              >
                <Send className="h-3 w-3" />
                Comment
              </Button>
            </div>
          </div>
        </div>
        
        {/* Comments list */}
        <div className="space-y-1">
          {sortedComments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No comments yet</p>
              <p className="text-xs">Be the first to add a comment!</p>
            </div>
          ) : (
            sortedComments.map(comment => renderComment(comment))
          )}
        </div>
      </CardContent>
    </Card>
  );
}