import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import CookieBanner from "@/components/CookieBanner";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import ComparisonBar from "@/components/ComparisonBar";
import Index from "./pages/Index";
import PropertyComparison from "./pages/PropertyComparison";
import Airbnb from "./pages/Airbnb";
import Villas from "./pages/Villas";
import Homestays from "./pages/Homestays";
import Blog from "./pages/Blog";
import About from "./pages/About";
import Contacts from "./pages/Contacts";
import Profile from "./pages/Profile";
import Wishlist from "./pages/Wishlist";
import BookingHistory from "./pages/BookingHistory";
import MyProperties from "./pages/MyProperties";
import PropertyDetails from "./pages/PropertyDetails";
import BlogPost from "./pages/BlogPost";
import BookingConfirmation from "./pages/BookingConfirmation";
import OwnerDashboard from "./pages/OwnerDashboard";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CancellationPolicy from "./pages/CancellationPolicy";
import NotFound from "./pages/NotFound";
import MapView from "./pages/MapView";
import Notifications from "./pages/Notifications";
import OwnerBookings from "./pages/OwnerBookings";
import Messages from "./pages/Messages";
import CreateBlogPost from "./pages/CreateBlogPost";
import MyBlogPosts from "./pages/MyBlogPosts";
import EditBlogPost from "./pages/EditBlogPost";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { setTokenProvider } from "@/integrations/supabase/client";
import { BookingModalProvider } from "@/contexts/BookingModalContext";


// Clerk publishable key - safe for client-side use, loaded from environment variable for flexibility
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "pk_test_cHVtcGVkLXRvdWNhbi00OS5jbGVyay5hY2NvdW50cy5kZXYk";

// --- Supabase token sync component ---
const SupabaseTokenSync = () => {
  const { getToken } = useAuth();

  useEffect(() => {
    setTokenProvider(async () => {
      try {
        const token = await getToken({ template: "supabase" });
        return token || null;
      } catch (error) {
        console.error("Failed to get Supabase token from Clerk:", error);
        return null;
      }
    });
  }, [getToken]);

  return null;
};

// --- Main App ---
const App = () => (
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    {/* Sync Clerk tokens to Supabase */}
    <SupabaseTokenSync />

    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <BookingModalProvider>
              <CookieBanner />
              <PWAInstallPrompt />
              <ComparisonBar />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/airbnb" element={<Airbnb />} />
                <Route path="/villas" element={<Villas />} />
                <Route path="/homestays" element={<Homestays />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/create-blog" element={<CreateBlogPost />} />
                <Route path="/my-posts" element={<MyBlogPosts />} />
                <Route path="/edit-blog/:id" element={<EditBlogPost />} />
                <Route path="/about" element={<About />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/bookings" element={<BookingHistory />} />
                <Route path="/booking-confirmation" element={<BookingConfirmation />} />
                <Route path="/my-properties" element={<MyProperties />} />
                <Route path="/owner-dashboard" element={<OwnerDashboard />} />
                <Route path="/properties/:id" element={<PropertyDetails />} />
                <Route path="/compare" element={<PropertyComparison />} />
                <Route path="/map" element={<MapView />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/owner-bookings" element={<OwnerBookings />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/cancellation-policy" element={<CancellationPolicy />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BookingModalProvider>
          </BrowserRouter>
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  </ClerkProvider>
);

export default App;