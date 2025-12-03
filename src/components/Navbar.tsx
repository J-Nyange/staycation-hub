import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, Search, LogOut, Heart, Plus, Calendar, Home, FileText, PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUser, useClerk, SignInButton, SignUpButton } from "@clerk/clerk-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import AddPropertyModal from "@/components/AddPropertyModal";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { getDisplayName } = useUserProfile();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setIsMenuOpen(false);
      setSearchQuery("");
    }
  };

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Map View", href: "/map" },
    { name: "Homestays", href: "/homestays" },
    { name: "Airbnb", href: "/airbnb" },
    { name: "Villas", href: "/villas" },
    { name: "Blog", href: "/blog" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 transition-all duration-300 hover:scale-105"
          >
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white font-bold text-xl">
              L
            </div>
            <span className="sm:block text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Villa Horizon
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`relative px-3 py-2 text-sm font-medium transition-all duration-300 hover:text-primary ${
                  isActive(item.href)
                    ? "text-primary"
                    : "text-foreground/70 hover:text-foreground"
                }`}
              >
                {item.name}
                {isActive(item.href) && (
                  <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-primary to-secondary rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="hover:bg-muted"
            >
              <Search className="w-4 h-4" />
            </Button>
            
            {user && <NotificationBell />}
            
            {user ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddPropertyModalOpen(true)}
                  className="border-primary/20 hover:bg-primary/5"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  <span className="hidden xl:inline">Add Property</span>
                  <span className="xl:hidden">Add</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="hover:bg-muted max-w-[150px]">
                      <User className="w-4 h-4 mr-1" />
                      <span className="truncate">{getDisplayName()}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/my-properties')}>
                      <Home className="w-4 h-4 mr-2" />
                      My Properties
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/owner-dashboard')}>
                      <Home className="w-4 h-4 mr-2" />
                      Owner Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/bookings')}>
                      <Calendar className="w-4 h-4 mr-2" />
                      Booking History
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/wishlist')}>
                      <Heart className="w-4 h-4 mr-2" />
                      My Wishlist
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/my-posts')}>
                      <FileText className="w-4 h-4 mr-2" />
                      My Blog Posts
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/create-blog')}>
                      <PenSquare className="w-4 h-4 mr-2" />
                      Write a Post
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <SignInButton mode="modal">
                  <Button variant="outline" size="sm" className="border-primary/20 hover:bg-primary/5">
                    <User className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-primary/20 hover:bg-primary/5"
                  >
                    Sign Up
                  </Button>
                </SignUpButton>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Search Bar */}
        {isSearchOpen && (
          <div className="hidden lg:block py-4 border-t border-border/50">
            <form onSubmit={handleSearch} className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search properties, locations..."
                className="pl-10 bg-muted/50 border-0 focus:bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-border/50 bg-background/95 backdrop-blur-md">
          <div className="px-4 py-4 space-y-4">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search properties..."
                className="pl-10 bg-muted/50 border-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            {/* Mobile Navigation */}
            <div className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 text-base font-medium rounded-lg transition-all duration-300 ${
                    isActive(item.href)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/70 hover:bg-muted hover:text-foreground"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Mobile Actions */}
            <div className="pt-4 border-t border-border/50 space-y-2">
              {user ? (
                <>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setIsAddPropertyModalOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Property
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => navigate('/profile')}>
                    <User className="w-4 h-4 mr-2" />
                    {getDisplayName()}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => navigate('/my-properties')}>
                    <Home className="w-4 h-4 mr-2" />
                    My Properties
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => navigate('/bookings')}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Booking History
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => navigate('/wishlist')}>
                    <Heart className="w-4 h-4 mr-2" />
                    My Wishlist
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => signOut()}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <SignInButton mode="modal">
                    <Button variant="outline" className="w-full border-primary/20 hover:bg-primary/5">
                      <User className="w-4 h-4 mr-2" />
                      Sign In
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button 
                      variant="outline" 
                      className="w-full border-primary/20 hover:bg-primary/5"
                    >
                      Sign Up
                    </Button>
                  </SignUpButton>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Property Modal */}
      <AddPropertyModal
        open={isAddPropertyModalOpen}
        onOpenChange={setIsAddPropertyModalOpen}
      />
    </nav>
  );
};

export default Navbar;