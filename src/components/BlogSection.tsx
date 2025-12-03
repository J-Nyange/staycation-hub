import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const BlogSection = () => {
  const navigate = useNavigate();

  const { data: posts = [] } = useQuery({
    queryKey: ["blog-posts-featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
  });

  const categoryColors: Record<string, string> = {
    "Travel Guide": "bg-primary/10 text-primary border-primary/20",
    "Booking Tips": "bg-accent/10 text-accent-foreground border-accent/20",
    "Sustainability": "bg-secondary/10 text-secondary border-secondary/20",
    "Destinations": "bg-muted text-muted-foreground border-muted-foreground/20",
    "Culture": "bg-primary/15 text-primary border-primary/30",
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
          
          <Button 
            variant="outline" 
            className="group"
            onClick={() => navigate("/blog")}
          >
            View All Posts
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <article
              key={post.id}
              className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-500 hover:scale-[1.02] cursor-pointer"
              onClick={() => navigate(`/blog/${post.slug}`)}
            >
              {/* Featured Image */}
              <div className="relative overflow-hidden">
                <img
                  src={post.featured_image}
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
                    Lukemanbnb Team
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {Math.ceil(post.content.split(' ').length / 200)} min read
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
                    {format(new Date(post.published_at || post.created_at), "MMMM dd, yyyy")}
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
