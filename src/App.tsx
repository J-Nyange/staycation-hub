import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from "@/contexts/AuthContext";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
