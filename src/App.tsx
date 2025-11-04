import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
            <Route path="/my-properties" element={<MyProperties />} />
            <Route path="/property/:id" element={<PropertyDetails />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
