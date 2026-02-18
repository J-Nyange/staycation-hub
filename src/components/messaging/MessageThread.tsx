import { useMessages } from "@/hooks/useMessages";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare } from "lucide-react";

interface MessageThreadProps {
  conversationId: string | null;
  propertyTitle?: string;
  onBack?: () => void;
}

export const MessageThread = ({
  conversationId,
  propertyTitle,
  onBack,
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
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 p-8">
        <MessageSquare className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-center">Select a conversation to start messaging</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b flex items-center gap-3">
          {onBack && <Skeleton className="h-8 w-8 rounded" />}
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
      <div className="p-3 md:p-4 border-b flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        {propertyTitle && (
          <h3 className="font-semibold truncate">{propertyTitle}</h3>
        )}
      </div>
      <ScrollArea className="flex-1 p-3 md:p-4">
        <div ref={scrollRef} className="space-y-3 md:space-y-4">
          {messages.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">
              No messages yet. Send one to start the conversation!
            </p>
          )}
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
