import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, Search, LogOut, Heart, Plus, Calendar, Home, FileText, PenSquare, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUser, useClerk, SignInButton, SignUpButton } from "@clerk/clerk-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserRole } from "@/hooks/useUserRole";
import AddPropertyModal from "@/components/AddPropertyModal";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Navbar = () => {
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { getDisplayName } = useUserProfile();
  const { isAdmin, isModerator } = useUserRole();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
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

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName[0].toUpperCase();
    }
    return "U";
  };

  const handleNavClick = (href: string) => {
    navigate(href);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 md:h-16">
          
          {/* Mobile Header */}
          <div className="flex md:hidden items-center justify-between w-full">
            {/* Left: Hamburger + Logo */}
            <div className="flex items-center gap-2">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0">
                  <div className="flex flex-col h-full">
                    {/* Menu Header */}
                    <div className="p-4 border-b border-border">
                      <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                        <img src="/Logo/lukemanLogo.png" className="h-10 object-contain" alt="Logo" />
                      </Link>
                    </div>
                    
                    {/* Search */}
                    <div className="p-4 border-b border-border">
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
                    </div>
                    
                    {/* Navigation Links */}
                    <div className="flex-1 overflow-y-auto p-4">
                      <div className="space-y-1">
                        {navigation.map((item) => (
                          <button
                            key={item.name}
                            onClick={() => handleNavClick(item.href)}
                            className={`w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                              isActive(item.href)
                                ? "bg-primary/10 text-primary"
                                : "text-foreground/70 hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            {item.name}
                          </button>
                        ))}
                      </div>
                      
                      {/* User Actions */}
                      {user && (
                        <div className="mt-6 pt-4 border-t border-border space-y-1">
                          <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</p>
                          <button onClick={() => handleNavClick('/profile')} className="w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg text-foreground/70 hover:bg-muted hover:text-foreground flex items-center gap-2">
                            <User className="w-4 h-4" /> Profile
                          </button>
                          <button onClick={() => handleNavClick('/my-properties')} className="w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg text-foreground/70 hover:bg-muted hover:text-foreground flex items-center gap-2">
                            <Home className="w-4 h-4" /> My Properties
                          </button>
                          <button onClick={() => handleNavClick('/owner-dashboard')} className="w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg text-foreground/70 hover:bg-muted hover:text-foreground flex items-center gap-2">
                            <Home className="w-4 h-4" /> Owner Dashboard
                          </button>
                          <button onClick={() => handleNavClick('/bookings')} className="w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg text-foreground/70 hover:bg-muted hover:text-foreground flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Booking History
                          </button>
                          <button onClick={() => handleNavClick('/wishlist')} className="w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg text-foreground/70 hover:bg-muted hover:text-foreground flex items-center gap-2">
                            <Heart className="w-4 h-4" /> My Wishlist
                          </button>
                          
                          <p className="px-3 py-1 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Blog</p>
                          <button onClick={() => handleNavClick('/my-posts')} className="w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg text-foreground/70 hover:bg-muted hover:text-foreground flex items-center gap-2">
                            <FileText className="w-4 h-4" /> My Blog Posts
                          </button>
                          <button onClick={() => handleNavClick('/create-blog')} className="w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg text-foreground/70 hover:bg-muted hover:text-foreground flex items-center gap-2">
                            <PenSquare className="w-4 h-4" /> Write a Post
                          </button>
                          
                          {(isAdmin || isModerator) && (
                            <>
                              <p className="px-3 py-1 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</p>
                              <button onClick={() => handleNavClick('/admin')} className="w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg text-foreground/70 hover:bg-muted hover:text-foreground flex items-center gap-2">
                                <Shield className="w-4 h-4" /> Admin Dashboard
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Footer Actions */}
                    <div className="p-4 border-t border-border">
                      {user ? (
                        <div className="space-y-2">
                          <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => {
                              setIsAddPropertyModalOpen(true);
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Property
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => signOut()}
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <SignInButton mode="modal">
                            <Button variant="outline" className="w-full">
                              Sign In
                            </Button>
                          </SignInButton>
                          <SignUpButton mode="modal">
                            <Button className="w-full">
                              Sign Up
                            </Button>
                          </SignUpButton>
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              
              <Link to="/" className="flex items-center">
                <img src="/Logo/lukemanLogo.png" className="h-8 object-contain" alt="Logo" />
              </Link>
            </div>
            
            {/* Right: Search, Notifications, User */}
            <div className="flex items-center gap-1">
              {/* Search Toggle */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
              >
                <Search className="h-4 w-4" />
              </Button>
              
              {/* Notifications (if signed in) */}
              {user && <NotificationBell />}
              
              {/* User Avatar or Sign In */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={user.imageUrl} alt={getDisplayName()} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/bookings')}>
                      <Calendar className="w-4 h-4 mr-2" />
                      Booking History
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <SignInButton mode="modal">
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <User className="h-4 w-4" />
                  </Button>
                </SignInButton>
              )}
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between w-full">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center flex-shrink-0 transition-all duration-300 hover:scale-105"
            >
              <img src="/Logo/lukemanLogo.png" className="h-10 lg:h-11 object-contain" alt="Logo" />
            </Link>

            {/* Center: Navigation Links */}
            <div className="flex items-center justify-center flex-1 mx-4">
              <div className="flex items-center gap-1 lg:gap-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`relative px-2 lg:px-3 py-2 text-sm font-medium transition-all duration-300 whitespace-nowrap ${
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
            </div>

            {/* Right: Search, Add Property, Notifications, User */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Expandable Search */}
              <div className="relative">
                {isSearchOpen ? (
                  <form onSubmit={handleSearch} className="flex items-center">
                    <Input
                      type="text"
                      placeholder="Search..."
                      className="w-40 lg:w-52 h-9 pr-8 bg-muted/50 border-0 focus:bg-background"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 h-9 w-9"
                      onClick={() => setIsSearchOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </form>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setIsSearchOpen(true)}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Add Property */}
              {user && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddPropertyModalOpen(true)}
                  className="border-primary/20 hover:bg-primary/5 h-9"
                >
                  <Plus className="w-4 h-4 lg:mr-1" />
                  <span className="hidden lg:inline">Add Property</span>
                </Button>
              )}

              {/* Notifications */}
              {user && <NotificationBell />}
              
              {/* User Dropdown */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="hover:bg-muted h-9 gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.imageUrl} alt={getDisplayName()} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden lg:inline max-w-[100px] truncate text-sm">{getDisplayName()}</span>
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
                    {(isAdmin || isModerator) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/admin')}>
                          <Shield className="w-4 h-4 mr-2" />
                          Admin Dashboard
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <SignInButton mode="modal">
                    <Button variant="ghost" size="sm" className="h-9">
                      Sign In
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button size="sm" className="h-9">
                      Sign Up
                    </Button>
                  </SignUpButton>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile Search Dropdown */}
        {isSearchOpen && (
          <div className="md:hidden pb-3">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search properties..."
                className="pl-10 pr-10 bg-muted/50 border-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full w-10"
                onClick={() => setIsSearchOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* Add Property Modal */}
      <AddPropertyModal
        open={isAddPropertyModalOpen}
        onOpenChange={setIsAddPropertyModalOpen}
      />
    </nav>
  );
};

export default Navbar;
