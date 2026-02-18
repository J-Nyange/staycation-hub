import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender: {
    first_name: string | null;
    last_name: string | null;
  };
}

export const useMessages = (conversationId: string | null) => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, content, is_read, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Batch fetch sender profiles
      const senderIds = [...new Set((data || []).map((m) => m.sender_id))];
      const { data: profiles } = senderIds.length > 0
        ? await supabase
            .from("profiles")
            .select("user_id, first_name, last_name")
            .in("user_id", senderIds)
        : { data: [] };

      const profileMap = new Map(
        (profiles || []).map((p) => [p.user_id, p])
      );

      const messagesWithSenders = (data || []).map((message) => {
        const profile = profileMap.get(message.sender_id);
        // Fall back to Clerk user data for current user
        let senderInfo = { first_name: profile?.first_name || null, last_name: profile?.last_name || null };
        if ((!senderInfo.first_name && !senderInfo.last_name) && user && message.sender_id === user.id) {
          senderInfo = { first_name: user.firstName || null, last_name: user.lastName || null };
        }
        return {
          ...message,
          sender: senderInfo,
        };
      });

      // Mark messages as read
      if (user) {
        await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("conversation_id", conversationId)
          .neq("sender_id", user.id)
          .eq("is_read", false);
      }

      return messagesWithSenders as Message[];
    },
    enabled: !!conversationId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !conversationId) throw new Error("Not authenticated");

      const trimmed = content.trim();
      if (!trimmed) throw new Error("Message cannot be empty");
      if (trimmed.length > 2000) throw new Error("Message too long (max 2000 characters)");

      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: trimmed,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: error.message,
      });
    },
  });

  return {
    messages,
    isLoading,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
  };
};
