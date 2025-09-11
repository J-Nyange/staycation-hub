import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  const quickLinks = [
    { name: "About Us", href: "/about" },
    { name: "Properties", href: "/properties" },
    { name: "How It Works", href: "/how-it-works" },
    { name: "Contact", href: "/contacts" },
  ];

  const categories = [
    { name: "Airbnb Apartments", href: "/airbnb" },
    { name: "Luxury Villas", href: "/villas" },
    { name: "Cozy Homestays", href: "/homestays" },
    { name: "Special Offers", href: "/offers" },
  ];

  const legal = [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cancellation Policy", href: "/cancellation" },
    { name: "Cookie Policy", href: "/cookies" },
  ];

  const locations = [
    "Vipingo, Kilifi",
    "Diani Beach, Ukunda",
    "Nyali, Mombasa",
    "Voi, Taita Taveta",
  ];

  return (
    <footer className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-t border-border">
      <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center space-x-2 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white font-bold text-xl">
                L
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Villa Horizon
              </span>
            </Link>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Discover luxury coastal accommodations across Kenya's most beautiful destinations. 
              From beachfront villas to cozy homestays, experience the perfect blend of comfort and adventure.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              {[
                { Icon: Facebook, href: "#", label: "Facebook" },
                { Icon: Instagram, href: "#", label: "Instagram" },
                { Icon: Twitter, href: "#", label: "Twitter" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  className="w-10 h-10 bg-muted hover:bg-primary/10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-md group"
                  aria-label={label}
                >
                  <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Property Categories */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Property Categories</h3>
            <ul className="space-y-3">
              {categories.map((category) => (
                <li key={category.name}>
                  <Link
                    to={category.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-300"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Locations */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Contact & Locations</h3>
            
            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <span className="text-muted-foreground">+254 700 123 456</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <span className="text-muted-foreground">hello@Villa Horizon.com</span>
              </div>
            </div>

            {/* Popular Locations */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Popular Locations</h4>
              <ul className="space-y-2">
                {locations.map((location) => (
                  <li key={location} className="flex items-center space-x-2">
                    <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{location}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-border/50 mt-12 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            {/* Copyright */}
            <div className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} Villa Horizon. All rights reserved.
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap justify-center lg:justify-end space-x-6">
              {legal.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;