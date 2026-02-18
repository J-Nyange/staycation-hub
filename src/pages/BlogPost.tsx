import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, User, ArrowLeft, Calendar } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import { generateBlogPostSchema, generateBreadcrumbSchema } from "@/lib/structuredData";

/**
 * Formats raw blog content into well-structured paragraphs.
 * - Splits content by double newlines to create paragraphs
 * - Handles single newlines within paragraphs
 * - Preserves markdown formatting
 */
const formatContentToParagraphs = (content: string): string => {
  if (!content) return "";
  
  // First, normalize line endings
  let formatted = content.replace(/\r\n/g, "\n");
  
  // If the content doesn't have explicit paragraph breaks (double newlines),
  // try to intelligently add them based on common patterns
  const hasExplicitParagraphs = formatted.includes("\n\n");
  
  if (!hasExplicitParagraphs) {
    // Split sentences that end with periods followed by spaces and capital letters
    // This helps convert run-on text into paragraphs
    formatted = formatted
      // Add paragraph breaks after sentences that look like paragraph endings
      .replace(/([.!?])\s+([A-Z])/g, "$1\n\n$2")
      // Add breaks before common paragraph starters
      .replace(/\n(#{1,6}\s)/g, "\n\n$1") // Markdown headers
      .replace(/\n(-\s)/g, "\n\n$1") // List items
      .replace(/\n(\d+\.\s)/g, "\n\n$1"); // Numbered lists
  }
  
  // Clean up excessive newlines (more than 2 in a row)
  formatted = formatted.replace(/\n{3,}/g, "\n\n");
  
  // Ensure proper spacing around headers
  formatted = formatted.replace(/(#{1,6}.*?)\n(?!\n)/g, "$1\n\n");
  
  return formatted.trim();
};

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, content, excerpt, featured_image, category, tags, is_published, published_at, created_at, updated_at, is_featured")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="animate-pulse space-y-8 max-w-4xl mx-auto">
            <div className="h-96 bg-muted rounded-3xl"></div>
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Blog post not found</h1>
          <Button onClick={() => navigate("/blog")}>Back to Blog</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    "Travel Guide": "bg-primary/10 text-primary border-primary/20",
    "Booking Tips": "bg-accent/10 text-accent-foreground border-accent/20",
    "Sustainability": "bg-secondary/10 text-secondary border-secondary/20",
    "Destinations": "bg-muted text-muted-foreground border-muted-foreground/20",
    "Culture": "bg-primary/15 text-primary border-primary/30",
  };

  const authorName = 'Lukemanbnb Team';

  const blogSchema = generateBlogPostSchema({
    title: post.title,
    description: post.excerpt || "",
    image: post.featured_image || "",
    datePublished: post.published_at || "",
    dateModified: post.updated_at,
    authorName,
    url: window.location.href,
  });

  const breadcrumbSchema = generateBreadcrumbSchema({
    items: [
      { name: "Home", url: "https://Lukemanbnb.com" },
      { name: "Blog", url: "https://Lukemanbnb.com/blog" },
      { name: post.title, url: window.location.href },
    ],
  });

  const readTime = Math.ceil(post.content.split(' ').length / 200);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={post.title}
        description={post.excerpt || post.title}
        keywords={`${post.category}, ${post.tags?.join(", ")}, Kenya travel, coastal Kenya`}
        image={post.featured_image || ""}
        url={window.location.href}
        type="article"
      />
      <script type="application/ld+json">
        {JSON.stringify(blogSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
      <Navbar />
      
      <main className="container mx-auto px-4 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/blog")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Blog
        </Button>

        {/* Article */}
        <article className="max-w-4xl mx-auto">
          {/* Featured Image */}
          {post.featured_image && (
            <div className="mb-8 rounded-3xl overflow-hidden">
              <img
                src={post.featured_image}
                alt={post.title}
                className="w-full h-96 object-cover"
              />
            </div>
          )}

          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge className={categoryColors[post.category] || categoryColors["Travel Guide"]}>
                {post.category}
              </Badge>
              {post.tags && post.tags.map((tag, i) => (
                <Badge key={i} variant="outline">{tag}</Badge>
              ))}
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                {post.excerpt}
              </p>
            )}

            <div className="flex items-center gap-6 text-sm text-muted-foreground pb-6 border-b border-border">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{authorName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <time dateTime={post.published_at || post.created_at}>
                  {format(new Date(post.published_at || post.created_at), "MMMM dd, yyyy")}
                </time>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{readTime} min read</span>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="prose prose-lg lg:prose-xl max-w-none
            prose-headings:font-bold prose-headings:text-foreground
            prose-h1:text-3xl prose-h1:mt-8 prose-h1:mb-4
            prose-h2:text-2xl prose-h2:mt-6 prose-h2:mb-3 prose-h2:border-b prose-h2:border-border prose-h2:pb-2
            prose-h3:text-xl prose-h3:mt-5 prose-h3:mb-2
            prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:mb-6
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-2xl prose-img:shadow-lg
            prose-strong:font-semibold prose-strong:text-foreground
            prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-muted/50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:italic prose-blockquote:text-muted-foreground
            prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
            prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
            prose-li:mb-2 prose-li:text-foreground/90
            prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
            prose-pre:bg-muted prose-pre:rounded-xl prose-pre:p-4 prose-pre:overflow-x-auto
            dark:prose-invert
          ">
            <ReactMarkdown>{formatContentToParagraphs(post.content)}</ReactMarkdown>
          </div>

          {/* Footer */}
          <footer className="mt-12 pt-8 border-t border-border">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => navigate("/blog")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Button>
              
              <div className="flex gap-2">
                {post.tags && post.tags.slice(0, 3).map((tag, i) => (
                  <Badge key={i} variant="secondary">#{tag}</Badge>
                ))}
              </div>
            </div>
          </footer>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPost;
