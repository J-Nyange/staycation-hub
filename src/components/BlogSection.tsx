import { Clock, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const BlogSection = () => {
  const blogPosts = [
    {
      id: 1,
      title: "Ultimate Guide to Diani Beach: Hidden Gems & Must-Visit Spots",
      excerpt: "Discover the pristine beauty of Diani Beach beyond the resorts. From secret snorkeling spots to authentic local cuisine...",
      author: "Sarah Johnson",
      date: "2024-01-15",
      readTime: "8 min read",
      category: "Travel Guide",
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80",
    },
    {
      id: 2,
      title: "Booking Your Perfect Coastal Getaway: Insider Tips",
      excerpt: "Learn from our hospitality experts about the best times to visit, what amenities to look for, and how to get the best deals...",
      author: "Michael Chen",
      date: "2024-01-12",
      readTime: "6 min read",
      category: "Booking Tips",
      image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80",
    },
    {
      id: 3,
      title: "Sustainable Tourism: Our Commitment to Kenya's Coast",
      excerpt: "How we're working with local communities to ensure tourism benefits everyone while preserving the natural beauty...",
      author: "Emma Wilson",
      date: "2024-01-10",
      readTime: "5 min read",
      category: "Sustainability",
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=80",
    },
  ];

  const categoryColors: Record<string, string> = {
    "Travel Guide": "bg-primary/10 text-primary border-primary/20",
    "Booking Tips": "bg-accent/10 text-accent-foreground border-accent/20",
    "Sustainability": "bg-secondary/10 text-secondary border-secondary/20",
  };

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-b from-muted-luxury/20 to-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center bg-secondary/10 text-secondary rounded-full px-4 py-2 text-sm font-medium mb-4">
            Travel Insights
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold mb-4">
            Stories & 
            <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
              {" "}Travel Tips
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Expert insights, local stories, and insider tips to help you make the most of your coastal adventure
          </p>
          
          <Button variant="outline" className="group">
            View All Posts
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <article
              key={post.id}
              className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-500 hover:scale-[1.02]"
            >
              {/* Featured Image */}
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

              {/* Content */}
              <div className="p-6">
                {/* Meta Information */}
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

                {/* Title */}
                <h3 className="font-semibold text-lg mb-3 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h3>

                {/* Excerpt */}
                <p className="text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
                  {post.excerpt}
                </p>

                {/* Read More */}
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

        {/* Newsletter Signup */}
        <div className="mt-16 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-3xl p-8 lg:p-12 text-center">
          <h3 className="text-2xl lg:text-3xl font-bold mb-4">
            Stay Updated with Our Latest Stories
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Get travel tips, property highlights, and exclusive offers delivered to your inbox
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Button variant="luxury" className="px-6">
              Subscribe
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;