import { useConversations } from "@/hooks/useConversations";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";

interface ConversationListProps {
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
}

export const ConversationList = ({
  selectedConversationId,
  onSelectConversation,
}: ConversationListProps) => {
  const { data: conversations = [], isLoading } = useConversations();

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Conversations</h2>
        </div>
        {conversations.length > 0 && (
          <span className="text-sm text-muted-foreground">{conversations.length}</span>
        )}
      </div>

      {conversations.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground flex-1 flex items-center justify-center">
          <p>No conversations yet</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {conversations.map((conversation) => {
              const otherUserName =
                conversation.other_user.first_name || conversation.other_user.last_name
                  ? `${conversation.other_user.first_name || ""} ${conversation.other_user.last_name || ""}`.trim()
                  : "User";

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg hover:bg-accent transition-colors min-h-[72px]",
                    selectedConversationId === conversation.id && "bg-accent"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={conversation.property.main_image || "/placeholder.svg"}
                      alt={conversation.property.title}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm truncate">{otherUserName}</p>
                        {conversation.unread_count > 0 && (
                          <Badge variant="default" className="ml-2 text-xs">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mb-1">
                        {conversation.property.title}
                      </p>
                      {conversation.last_message && (
                        <>
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.last_message.content}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(
                              new Date(conversation.last_message.created_at),
                              { addSuffix: true }
                            )}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
