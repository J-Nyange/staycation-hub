import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageInput = ({
  onSend,
  disabled = false,
  placeholder = "Type a message...",
}: MessageInputProps) => {
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (trimmed && !disabled && trimmed.length <= 2000) {
      onSend(trimmed);
      setContent("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 md:p-4 border-t">
      <div className="flex gap-2 items-center">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, 2000))}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1"
          maxLength={2000}
        />
        <Button type="submit" size="icon" disabled={disabled || !content.trim()} className="shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>
      {content.length > 1800 && (
        <p className="text-xs text-muted-foreground mt-1">{content.length}/2000</p>
      )}
    </form>
  );
};
