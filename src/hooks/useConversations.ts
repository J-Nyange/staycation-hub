import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@clerk/clerk-react";

export interface Conversation {
  id: string;
  property_id: string;
  guest_id: string;
  owner_id: string;
  booking_id: string | null;
  created_at: string;
  updated_at: string;
  property: {
    title: string;
    main_image: string | null;
  };
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
    is_read: boolean;
  };
  unread_count: number;
  other_user: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export const useConversations = () => {
  const { user } = useUser();

  return useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Fetch conversations
      const { data: conversations, error } = await supabase
        .from("conversations")
        .select(`
          *,
          property:properties(title, main_image)
        `)
        .or(`guest_id.eq.${user.id},owner_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Batch fetch all other user profiles in one query
      const otherUserIds = (conversations || []).map((conv) =>
        conv.guest_id === user.id ? conv.owner_id : conv.guest_id
      );
      const uniqueUserIds = [...new Set(otherUserIds)];

      const { data: profiles } = uniqueUserIds.length > 0
        ? await supabase
            .from("profiles")
            .select("user_id, first_name, last_name")
            .in("user_id", uniqueUserIds)
        : { data: [] };

      const profileMap = new Map(
        (profiles || []).map((p) => [p.user_id, p])
      );

      // Fetch last message and unread count for each conversation
      const conversationsWithDetails = await Promise.all(
        (conversations || []).map(async (conv) => {
          // Get last message
          const { data: lastMessage } = await supabase
            .from("messages")
            .select("content, created_at, sender_id, is_read")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          // Get unread count
          const { count: unreadCount } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("is_read", false)
            .neq("sender_id", user.id);

          const otherUserId = conv.guest_id === user.id ? conv.owner_id : conv.guest_id;
          const otherUserProfile = profileMap.get(otherUserId);

          return {
            ...conv,
            last_message: lastMessage || undefined,
            unread_count: unreadCount || 0,
            other_user: {
              id: otherUserId,
              first_name: otherUserProfile?.first_name || null,
              last_name: otherUserProfile?.last_name || null,
            },
          };
        })
      );

      return conversationsWithDetails as Conversation[];
    },
    enabled: !!user,
  });
};
