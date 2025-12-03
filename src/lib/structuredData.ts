// Structured Data (Schema.org JSON-LD) generators for SEO

export interface PropertySchemaProps {
  id: string;
  title: string;
  description: string;
  image: string;
  pricePerNight: number;
  location: string;
  rating?: number;
  reviewCount?: number;
  amenities?: string[];
  latitude?: number;
  longitude?: number;
}

export const generatePropertySchema = (property: PropertySchemaProps) => {
  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "@id": `https://Lukemanbnb.com/property/${property.id}`,
    name: property.title,
    description: property.description,
    image: property.image,
    address: {
      "@type": "PostalAddress",
      addressLocality: property.location,
      addressCountry: "KE",
    },
    ...(property.latitude && property.longitude && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: property.latitude,
        longitude: property.longitude,
      },
    }),
    priceRange: `KES ${property.pricePerNight}`,
    ...(property.rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: property.rating,
        reviewCount: property.reviewCount || 0,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    ...(property.amenities && property.amenities.length > 0 && {
      amenityFeature: property.amenities.map((amenity) => ({
        "@type": "LocationFeatureSpecification",
        name: amenity,
      })),
    }),
  };
};

export interface ReviewSchemaProps {
  propertyId: string;
  propertyName: string;
  authorName: string;
  rating: number;
  reviewBody: string;
  datePublished: string;
}

export const generateReviewSchema = (review: ReviewSchemaProps) => {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: {
      "@type": "LodgingBusiness",
      name: review.propertyName,
      "@id": `https://Lukemanbnb.com/property/${review.propertyId}`,
    },
    author: {
      "@type": "Person",
      name: review.authorName,
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: review.reviewBody,
    datePublished: review.datePublished,
  };
};

export interface BreadcrumbSchemaProps {
  items: {
    name: string;
    url: string;
  }[];
}

export const generateBreadcrumbSchema = (breadcrumb: BreadcrumbSchemaProps) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumb.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
};

export interface OrganizationSchemaProps {
  name: string;
  url: string;
  logo: string;
  description: string;
  contactEmail: string;
  sameAs?: string[];
}

export const generateOrganizationSchema = (org: OrganizationSchemaProps) => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: org.name,
    url: org.url,
    logo: org.logo,
    description: org.description,
    contactPoint: {
      "@type": "ContactPoint",
      email: org.contactEmail,
      contactType: "customer service",
    },
    ...(org.sameAs && org.sameAs.length > 0 && {
      sameAs: org.sameAs,
    }),
  };
};

export interface BlogPostSchemaProps {
  title: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified: string;
  authorName: string;
  url: string;
}

export const generateBlogPostSchema = (post: BlogPostSchemaProps) => {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: post.image,
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    author: {
      "@type": "Person",
      name: post.authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "Lukemanbnb Kenya",
      logo: {
        "@type": "ImageObject",
        url: "https://Lukemanbnb.com/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": post.url,
    },
  };
};
