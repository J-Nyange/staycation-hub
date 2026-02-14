import { useMessages } from "@/hooks/useMessages";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface MessageThreadProps {
  conversationId: string | null;
  propertyTitle?: string;
}

export const MessageThread = ({
  conversationId,
  propertyTitle,
}: MessageThreadProps) => {
  const { messages, isLoading, sendMessage, isSending } = useMessages(conversationId);
  useRealtimeMessages(conversationId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!conversationId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Select a conversation to start messaging</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-3/4" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {propertyTitle && (
        <div className="p-4 border-b">
          <h3 className="font-semibold">{propertyTitle}</h3>
        </div>
      )}
      <ScrollArea className="flex-1 p-4">
        <div ref={scrollRef} className="space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>
      </ScrollArea>
      <MessageInput
        onSend={sendMessage}
        disabled={isSending}
        placeholder="Type your message..."
      />
    </div>
  );
};
