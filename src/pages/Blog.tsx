import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Clock, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { generateBreadcrumbSchema } from "@/lib/structuredData";

const Blog = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const categories = ["All", ...Array.from(new Set(posts.map((p) => p.category)))];

  const filteredPosts = activeCategory === "All"
    ? posts
    : posts.filter((p) => p.category === activeCategory);

  const featuredPost = filteredPosts[0];
  const regularPosts = filteredPosts.slice(1);

  const categoryColors: Record<string, string> = {
    "Travel Guide": "bg-primary/10 text-primary border-primary/20",
    "Booking Tips": "bg-accent/10 text-accent-foreground border-accent/20",
    "Sustainability": "bg-secondary/10 text-secondary border-secondary/20",
    "Destinations": "bg-muted text-muted-foreground border-muted-foreground/20",
    "Culture": "bg-primary/15 text-primary border-primary/30",
  };

  const breadcrumbSchema = generateBreadcrumbSchema({
    items: [
      { name: "Home", url: "https://Lukemanbnb.com" },
      { name: "Blog", url: "https://Lukemanbnb.com/blog" },
    ],
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Travel Stories & Tips"
        description="Discover insider secrets, local stories, and expert advice to make your coastal Kenya experience unforgettable. Explore our travel guides and booking tips."
        keywords="Kenya travel tips, coastal Kenya guide, Diani travel blog, Mombasa tourism, Watamu travel, Kenya vacation planning"
        image="/hero-villa.jpg"
        url={window.location.href}
      />
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
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
                variant={activeCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(category)}
                className="hover:bg-primary/5"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Loading State */}
      {isLoading && (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">Loading posts...</p>
        </div>
      )}

      {/* Featured Post */}
      {!isLoading && featuredPost && (
        <section className="py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div 
              className="bg-card rounded-3xl overflow-hidden shadow-luxury cursor-pointer hover:scale-[1.01] transition-transform duration-300"
              onClick={() => navigate(`/blog/${featuredPost.slug}`)}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                <div className="relative">
                  <img
                    src={featuredPost.featured_image}
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
                      Lukemanbnb Team
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {Math.ceil(featuredPost.content.split(' ').length / 200)} min read
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
      {!isLoading && regularPosts.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularPosts.map((post) => (
                <article
                  key={post.id}
                  className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-500 hover:scale-[1.02] cursor-pointer"
                  onClick={() => navigate(`/blog/${post.slug}`)}
                >
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

                  <div className="p-6">
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

                    <h3 className="font-semibold text-lg mb-3 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>

                    <p className="text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>

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
          </div>
        </section>
      )}

      {/* Empty State */}
      {!isLoading && filteredPosts.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">No posts found in this category.</p>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Blog;
