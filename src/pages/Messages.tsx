import { useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { ConversationList } from "@/components/messaging/ConversationList";
import { MessageThread } from "@/components/messaging/MessageThread";
import { useConversations } from "@/hooks/useConversations";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Messages() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const conversationFromUrl = searchParams.get('conversation');
  const isMobile = useIsMobile();
  
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    conversationFromUrl
  );
  const { data: conversations = [] } = useConversations();

  useEffect(() => {
    if (conversationFromUrl) {
      setSelectedConversationId(conversationFromUrl);
    }
  }, [conversationFromUrl]);

  if (!user) {
    return <Navigate to="/" />;
  }

  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  );

  const showThreadOnMobile = isMobile && selectedConversationId;

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
  };

  const handleBack = () => {
    setSelectedConversationId(null);
  };

  return (
    <>
      <SEO title="Messages" description="View and manage your messages" />
      <Navbar />
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <h1 className="text-3xl font-bold mb-6">Messages</h1>
        <div className="border rounded-lg overflow-hidden bg-card h-[calc(100vh-220px)] md:h-[600px]">
          {isMobile ? (
            showThreadOnMobile ? (
              <MessageThread
                conversationId={selectedConversationId}
                propertyTitle={selectedConversation?.property.title}
                onBack={handleBack}
              />
            ) : (
              <ConversationList
                selectedConversationId={selectedConversationId}
                onSelectConversation={handleSelectConversation}
              />
            )
          ) : (
            <div className="grid grid-cols-[350px_1fr] h-full">
              <div className="border-r">
                <ConversationList
                  selectedConversationId={selectedConversationId}
                  onSelectConversation={handleSelectConversation}
                />
              </div>
              <div>
                <MessageThread
                  conversationId={selectedConversationId}
                  propertyTitle={selectedConversation?.property.title}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
