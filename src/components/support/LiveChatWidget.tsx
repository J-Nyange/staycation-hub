import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, X, Send, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function LiveChatWidget() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get or create conversation
  const { data: conversation, isLoading: loadingConversation } = useQuery({
    queryKey: ['support-conversation', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Try to find existing open conversation
      const { data: existing, error: fetchError } = await supabase
        .from('support_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        setConversationId(existing.id);
        return existing;
      }

      // Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from('support_conversations')
        .insert({
          user_id: user.id,
          subject: 'Support Request',
          status: 'open',
        })
        .select()
        .single();

      if (createError) throw createError;
      setConversationId(newConv.id);
      return newConv;
    },
    enabled: !!user && isOpen,
  });

  // Get messages
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['support-messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!conversationId,
    refetchInterval: 5000, // Poll for new messages
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!conversationId || !user) throw new Error('No conversation');

      const { data, error } = await supabase
        .from('support_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          sender_type: 'user',
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['support-messages', conversationId] });
    },
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  if (!user) return null;

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:scale-105 transition-transform"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 bg-background border border-border rounded-xl shadow-2xl transition-all duration-300",
            isMinimized ? "w-72 h-14" : "w-96 h-[500px]"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5 rounded-t-xl">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="font-semibold">Support Chat</span>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-4 h-[380px]">
                {loadingConversation || loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">How can we help?</p>
                    <p className="text-sm mt-1">Send us a message and we'll respond shortly.</p>
                  </div>
                ) : (
                  <div ref={scrollRef} className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex",
                          msg.sender_type === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-lg p-3",
                            msg.sender_type === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          )}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={cn(
                            "text-xs mt-1",
                            msg.sender_type === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          )}>
                            {format(new Date(msg.created_at), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 border-t border-border">
                <div className="flex space-x-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!message.trim() || sendMessageMutation.isPending}
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
