import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  FileText,
  ArrowLeft,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useState } from 'react';

const MyBlogPosts = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const { data: posts, isLoading } = useQuery({
    queryKey: ['my-blog-posts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Post deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['my-blog-posts'] });
      setDeletingPostId(null);
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ postId, isPublished }: { postId: string; isPublished: boolean }) => {
      const { error } = await supabase
        .from('blog_posts')
        .update({ 
          is_published: isPublished,
          published_at: isPublished ? new Date().toISOString() : null,
        })
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: (_, { isPublished }) => {
      toast({ 
        title: isPublished ? 'Post published!' : 'Post unpublished',
        description: isPublished 
          ? 'Your post is now visible to everyone.' 
          : 'Your post has been hidden from the public.',
      });
      queryClient.invalidateQueries({ queryKey: ['my-blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Sign in to view your posts</h1>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const publishedPosts = posts?.filter(p => p.is_published) || [];
  const draftPosts = posts?.filter(p => !p.is_published) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => navigate('/blog')} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Button>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">My Blog Posts</h1>
              <p className="text-muted-foreground mt-1">
                {posts?.length || 0} total posts
              </p>
            </div>
            <Button onClick={() => navigate('/create-blog')}>
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <Skeleton className="w-32 h-24 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="space-y-8">
              {/* Drafts Section */}
              {draftPosts.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <EyeOff className="w-5 h-5 text-muted-foreground" />
                    Drafts ({draftPosts.length})
                  </h2>
                  <div className="space-y-4">
                    {draftPosts.map(post => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onEdit={() => navigate(`/edit-blog/${post.id}`)}
                        onDelete={() => setDeletingPostId(post.id)}
                        onTogglePublish={() => togglePublishMutation.mutate({ 
                          postId: post.id, 
                          isPublished: true 
                        })}
                        onView={() => navigate(`/blog/${post.slug}`)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Published Section */}
              {publishedPosts.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary" />
                    Published ({publishedPosts.length})
                  </h2>
                  <div className="space-y-4">
                    {publishedPosts.map(post => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onEdit={() => navigate(`/edit-blog/${post.id}`)}
                        onDelete={() => setDeletingPostId(post.id)}
                        onTogglePublish={() => togglePublishMutation.mutate({ 
                          postId: post.id, 
                          isPublished: false 
                        })}
                        onView={() => navigate(`/blog/${post.slug}`)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Card className="text-center p-12">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-6">
                Start sharing your stories and travel tips.
              </p>
              <Button onClick={() => navigate('/create-blog')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Post
              </Button>
            </Card>
          )}
        </div>
      </main>
      <Footer />

      <AlertDialog open={!!deletingPostId} onOpenChange={() => setDeletingPostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The post will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPostId && deleteMutation.mutate(deletingPostId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

interface PostCardProps {
  post: any;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
  onView: () => void;
}

const PostCard = ({ post, onEdit, onDelete, onTogglePublish, onView }: PostCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {post.featured_image ? (
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-32 h-24 object-cover rounded-lg"
            />
          ) : (
            <div className="w-32 h-24 bg-muted rounded-lg flex items-center justify-center">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{post.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={post.is_published ? 'default' : 'secondary'}>
                    {post.is_published ? 'Published' : 'Draft'}
                  </Badge>
                  {post.category && (
                    <Badge variant="outline">{post.category}</Badge>
                  )}
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {post.is_published && (
                    <DropdownMenuItem onClick={onView}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Post
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onTogglePublish}>
                    {post.is_published ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Publish
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {post.excerpt && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {post.excerpt}
              </p>
            )}
            
            <p className="text-xs text-muted-foreground mt-2">
              {post.is_published && post.published_at
                ? `Published ${format(new Date(post.published_at), 'MMM d, yyyy')}`
                : `Last edited ${format(new Date(post.updated_at), 'MMM d, yyyy')}`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyBlogPosts;