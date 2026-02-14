import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense } from "react";

import CookieBanner from "@/components/CookieBanner";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import ComparisonBar from "@/components/ComparisonBar";

// Lazy-load all route pages for better mobile performance
const Index = lazy(() => import("./pages/Index"));
const PropertyComparison = lazy(() => import("./pages/PropertyComparison"));
const Airbnb = lazy(() => import("./pages/Airbnb"));
const Villas = lazy(() => import("./pages/Villas"));
const Homestays = lazy(() => import("./pages/Homestays"));
const Blog = lazy(() => import("./pages/Blog"));
const About = lazy(() => import("./pages/About"));
const Contacts = lazy(() => import("./pages/Contacts"));
const Profile = lazy(() => import("./pages/Profile"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const BookingHistory = lazy(() => import("./pages/BookingHistory"));
const MyProperties = lazy(() => import("./pages/MyProperties"));
const PropertyDetails = lazy(() => import("./pages/PropertyDetails"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const BookingConfirmation = lazy(() => import("./pages/BookingConfirmation"));
const OwnerDashboard = lazy(() => import("./pages/OwnerDashboard"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const CancellationPolicy = lazy(() => import("./pages/CancellationPolicy"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MapView = lazy(() => import("./pages/MapView"));
const Notifications = lazy(() => import("./pages/Notifications"));
const OwnerBookings = lazy(() => import("./pages/OwnerBookings"));
const Messages = lazy(() => import("./pages/Messages"));
const CreateBlogPost = lazy(() => import("./pages/CreateBlogPost"));
const MyBlogPosts = lazy(() => import("./pages/MyBlogPosts"));
const EditBlogPost = lazy(() => import("./pages/EditBlogPost"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

const queryClient = new QueryClient();

import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { setTokenProvider } from "@/integrations/supabase/client";
import { BookingModalProvider } from "@/contexts/BookingModalContext";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "pk_test_cHVtcGVkLXRvdWNhbi00OS5jbGVyay5hY2NvdW50cy5kZXYk";

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

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const App = () => (
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
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
              <Suspense fallback={<PageLoader />}>
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
              </Suspense>
            </BookingModalProvider>
          </BrowserRouter>
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  </ClerkProvider>
);

export default App;
