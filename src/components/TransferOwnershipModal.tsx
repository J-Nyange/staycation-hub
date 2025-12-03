import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Search, User, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface TransferOwnershipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyTitle: string;
  onSuccess?: () => void;
}

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

const TransferOwnershipModal = ({ 
  open, 
  onOpenChange, 
  propertyId, 
  propertyTitle,
  onSuccess 
}: TransferOwnershipModalProps) => {
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: searchResults, isLoading: isSearching, refetch } = useQuery({
    queryKey: ['search-users', searchEmail],
    queryFn: async () => {
      if (!searchEmail || searchEmail.length < 3) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, first_name, last_name, avatar_url')
        .or(`first_name.ilike.%${searchEmail}%,last_name.ilike.%${searchEmail}%`)
        .limit(5);

      if (error) throw error;
      return data as UserProfile[];
    },
    enabled: false,
  });

  const handleSearch = () => {
    if (searchEmail.length >= 3) {
      refetch();
    }
  };

  const transferMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser) throw new Error('No user selected');

      const { error } = await supabase
        .from('properties')
        .update({ owner_id: selectedUser.user_id })
        .eq('id', propertyId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Ownership Transferred',
        description: `Property "${propertyTitle}" has been transferred successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['my-properties'] });
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Transfer Failed',
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setSearchEmail('');
    setSelectedUser(null);
    setConfirmText('');
  };

  const handleTransfer = () => {
    if (confirmText !== 'TRANSFER') {
      toast({
        variant: 'destructive',
        title: 'Confirmation Required',
        description: 'Please type TRANSFER to confirm.',
      });
      return;
    }
    transferMutation.mutate();
  };

  const isConfirmValid = confirmText === 'TRANSFER' && selectedUser;

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-primary" />
            Transfer Ownership
          </DialogTitle>
          <DialogDescription>
            Transfer "{propertyTitle}" to another user. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search Section */}
          {!selectedUser && (
            <div className="space-y-3">
              <Label>Search for user by name</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter first or last name..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} variant="outline" disabled={searchEmail.length < 3}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              
              {isSearching && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {searchResults && searchResults.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Select a user:</Label>
                  {searchResults.map((user) => (
                    <Card 
                      key={user.id} 
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => setSelectedUser(user)}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {user.first_name || ''} {user.last_name || ''}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID: {user.user_id.slice(0, 8)}...
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {searchResults && searchResults.length === 0 && searchEmail.length >= 3 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No users found with that name.
                </p>
              )}
            </div>
          )}

          {/* Selected User & Confirmation */}
          {selectedUser && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <Label className="text-sm text-muted-foreground">Transfer to:</Label>
                <div className="flex items-center gap-3 mt-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    {selectedUser.avatar_url ? (
                      <img src={selectedUser.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {selectedUser.first_name || ''} {selectedUser.last_name || ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      User ID: {selectedUser.user_id.slice(0, 12)}...
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setSelectedUser(null)}
                >
                  Change user
                </Button>
              </div>

              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">Warning</p>
                    <p className="text-sm text-muted-foreground">
                      This will permanently transfer ownership of this property. 
                      You will no longer have access to manage it.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Type TRANSFER to confirm</Label>
                <Input
                  id="confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="TRANSFER"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleTransfer} 
            disabled={!isConfirmValid || transferMutation.isPending}
            variant="destructive"
          >
            {transferMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Transfer Ownership
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransferOwnershipModal;