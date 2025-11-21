import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { ConversationList } from "@/components/messaging/ConversationList";
import { MessageThread } from "@/components/messaging/MessageThread";
import { useConversations } from "@/hooks/useConversations";

export default function Messages() {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    null
  );
  const { data: conversations = [] } = useConversations();

  if (!user) {
    return <Navigate to="/" />;
  }

  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  );

  return (
    <>
      <SEO title="Messages" description="View and manage your messages" />
      <Navbar />
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <h1 className="text-3xl font-bold mb-6">Messages</h1>
        <div className="grid md:grid-cols-[350px_1fr] gap-4 h-[600px] border rounded-lg overflow-hidden bg-card">
          <div className="border-r">
            <ConversationList
              selectedConversationId={selectedConversationId}
              onSelectConversation={setSelectedConversationId}
            />
          </div>
          <div>
            <MessageThread
              conversationId={selectedConversationId}
              propertyTitle={selectedConversation?.property.title}
            />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
