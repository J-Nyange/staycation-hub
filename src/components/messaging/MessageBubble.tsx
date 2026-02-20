import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { Message } from "@/hooks/useMessages";

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const { user } = useAuth();
  const isOwnMessage = message.sender_id === user?.id;

  const senderName = isOwnMessage
    ? "You"
    : message.sender.first_name || message.sender.last_name
      ? `${message.sender.first_name || ""} ${message.sender.last_name || ""}`.trim()
      : "User";

  return (
    <div
      className={cn(
        "flex flex-col",
        isOwnMessage ? "items-end" : "items-start"
      )}
    >
      <p className="text-xs text-muted-foreground mb-1">{senderName}</p>
      <div
        className={cn(
          "max-w-[80%] md:max-w-[70%] rounded-lg p-3",
          isOwnMessage
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
      </p>
    </div>
  );
};
