import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Clock, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Blog = () => {
  const blogPosts = [
    {
      id: 1,
      title: "Ultimate Guide to Diani Beach: Hidden Gems & Must-Visit Spots",
      excerpt: "Discover the pristine beauty of Diani Beach beyond the resorts. From secret snorkeling spots to authentic local cuisine, explore the hidden treasures that make this coastal paradise truly special.",
      author: "Sarah Johnson",
      date: "2024-01-15",
      readTime: "8 min read",
      category: "Travel Guide",
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
      featured: true,
    },
    {
      id: 2,
      title: "Booking Your Perfect Coastal Getaway: Insider Tips",
      excerpt: "Learn from our hospitality experts about the best times to visit, what amenities to look for, and how to get the best deals on your coastal accommodation.",
      author: "Michael Chen",
      date: "2024-01-12",
      readTime: "6 min read",
      category: "Booking Tips",
      image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
      featured: false,
    },
    {
      id: 3,
      title: "Sustainable Tourism: Our Commitment to Kenya's Coast",
      excerpt: "How we're working with local communities to ensure tourism benefits everyone while preserving the natural beauty of Kenya's coastal regions.",
      author: "Emma Wilson",
      date: "2024-01-10",
      readTime: "5 min read",
      category: "Sustainability",
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
      featured: false,
    },
    {
      id: 4,
      title: "Exploring Vipingo: A Coastal Paradise Beyond Mombasa",
      excerpt: "Uncover the charm of Vipingo, where luxury meets nature. From pristine beaches to world-class accommodations, discover why this hidden gem is perfect for your next getaway.",
      author: "David Kiprotich",
      date: "2024-01-08",
      readTime: "7 min read",
      category: "Destinations",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      featured: false,
    },
    {
      id: 5,
      title: "Cultural Immersion: Homestay Experiences in Coastal Kenya",
      excerpt: "Dive deep into Kenyan culture through authentic homestay experiences. Learn about traditions, enjoy home-cooked meals, and create lasting memories with local families.",
      author: "Grace Wanjiku",
      date: "2024-01-05",
      readTime: "9 min read",
      category: "Culture",
      image: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&q=80",
      featured: false,
    },
    {
      id: 6,
      title: "Villa vs Homestay vs Airbnb: Which is Right for You?",
      excerpt: "Confused about which accommodation type suits your travel style? We break down the pros and cons of each option to help you make the perfect choice.",
      author: "James Mwangi",
      date: "2024-01-03",
      readTime: "6 min read",
      category: "Booking Tips",
      image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
      featured: false,
    },
  ];

  const categories = ["All", "Travel Guide", "Booking Tips", "Sustainability", "Destinations", "Culture"];

  const categoryColors: Record<string, string> = {
    "Travel Guide": "bg-primary/10 text-primary border-primary/20",
    "Booking Tips": "bg-accent/10 text-accent-foreground border-accent/20",
    "Sustainability": "bg-secondary/10 text-secondary border-secondary/20",
    "Destinations": "bg-muted text-muted-foreground border-muted-foreground/20",
    "Culture": "bg-primary/15 text-primary border-primary/30",
  };

  const featuredPost = blogPosts.find(post => post.featured);
  const regularPosts = blogPosts.filter(post => !post.featured);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-6xl font-bold mb-6">
            Travel 
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {" "}Stories & Tips
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover insider secrets, local stories, and expert advice to make your coastal Kenya experience unforgettable
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 border-b border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <Button
                key={category}
                variant="outline"
                size="sm"
                className="hover:bg-primary/5"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && (
        <section className="py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="bg-card rounded-3xl overflow-hidden shadow-luxury">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                <div className="relative">
                  <img
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    className="w-full h-64 lg:h-full object-cover"
                  />
                  <div className="absolute top-6 left-6">
                    <Badge className="bg-accent text-accent-foreground">
                      Featured Story
                    </Badge>
                  </div>
                </div>
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center">
                      <User className="w-3 h-3 mr-1" />
                      {featuredPost.author}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {featuredPost.readTime}
                    </div>
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-bold mb-4 leading-tight">
                    {featuredPost.title}
                  </h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                  <Button variant="luxury" className="w-fit group">
                    Read Full Story
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Blog Posts Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularPosts.map((post) => (
              <article
                key={post.id}
                className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-500 hover:scale-[1.02]"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className={categoryColors[post.category] || categoryColors["Travel Guide"]}>
                      {post.category}
                    </Badge>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center">
                      <User className="w-3 h-3 mr-1" />
                      {post.author}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {post.readTime}
                    </div>
                  </div>

                  <h3 className="font-semibold text-lg mb-3 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <time className="text-sm text-muted-foreground">
                      {new Date(post.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </time>
                    <Button variant="ghost" size="sm" className="group text-primary hover:text-primary">
                      Read More
                      <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;