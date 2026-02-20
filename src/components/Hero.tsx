import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Star } from "lucide-react";
import heroVilla from "@/assets/hero-villa.jpg";
import SearchWidget from "./SearchWidget";
import SearchResults from "./SearchResults";
import { Property } from "@/hooks/useProperties";

const Hero = () => {
  const [searchResults, setSearchResults] = useState<Property[] | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const handleSearchResults = (results: Property[], query: string = "") => {
    setSearchResults(results);
    setSearchQuery(query);
    setShowResults(true);
  };

  const handleBackClick = () => {
    setShowResults(false);
    setSearchResults(null);
  };

  if (showResults && searchResults) {
    return (
      <SearchResults 
        results={searchResults} 
        isLoading={false} 
        searchQuery={searchQuery}
        onBackClick={handleBackClick}
      />
    );
  }
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroVilla}
          alt="Luxury beachfront villa with infinity pool"
          className="w-full h-full object-cover"
          fetchpriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto py-6">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-white text-sm font-medium">Premium Coastal Properties</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Discover Your Perfect
            <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Coastal Escape
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            Experience luxury accommodations across Kenya's most stunning coastal destinations. 
            From beachfront villas to cozy homestays, find your ideal getaway.
          </p>

          {/* Search Widget */}
          <div className="max-w-5xl mx-auto mb-8">
            <SearchWidget onSearchResults={handleSearchResults} />
          </div>

          {/* Location Highlights */}
          <div className="flex flex-wrap justify-center items-center gap-4 mb-8">
            {[
              "Vipingo, Kilifi",
              "Diani Beach", 
              "Nyali, Mombasa",
              "Voi, Taita Taveta"
            ].map((location) => (
              <div key={location} className="flex items-center space-x-2 bg-white/10 backdrop-blur-md rounded-full px-3 py-1">
                <MapPin className="w-3 h-3 text-primary" />
                <span className="text-sm text-white">{location}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="luxury"
              className="group"
              onClick={() => window.location.href = "#featured-properties"}
            >
              Explore Properties
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white/30 bg-white/10 text-white hover:bg-transparent hover:translate-y-[-5px] transition-transform backdrop-blur-md"
              onClick={() => window.open('https://www.youtube.com/watch?v=SRf_gbDtd4E', '_blank')}
            >
              Watch Virtual Tour
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-white/20">
            <div className="text-center ">
              <div className="text-2xl lg:text-3xl font-bold text-white mb-1">50+</div>
              <div className="text-sm text-white/70">Premium Properties</div>
            </div>
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-bold text-white mb-1">4.9</div>
              <div className="text-sm text-white/70">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-bold text-white mb-1">10K+</div>
              <div className="text-sm text-white/70">Happy Guests</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;