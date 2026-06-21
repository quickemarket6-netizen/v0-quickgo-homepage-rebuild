export default function JsonLd() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "QuickGo",
    "alternateName": "QuickGo Cameroun",
    "url": "https://www.quickgo.cm",
    "logo": "https://www.quickgo.cm/logo.png",
    "sameAs": [
      "https://www.facebook.com/quickgocm",
      "https://www.instagram.com/quickgocm",
      "https://www.twitter.com/quickgocm",
      "https://www.linkedin.com/company/quickgocm"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+237-690-773-615",
      "contactType": "customer service",
      "areaServed": "CM",
      "availableLanguage": ["French", "English"]
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Bastos",
      "addressLocality": "Yaoundé",
      "addressCountry": "CM"
    }
  }

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "QuickGo",
    "image": "https://www.quickgo.cm/og-image.jpg",
    "@id": "https://www.quickgo.cm",
    "url": "https://www.quickgo.cm",
    "telephone": "+237-690-773-615",
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Bastos",
      "addressLocality": "Yaoundé",
      "addressRegion": "Centre",
      "postalCode": "",
      "addressCountry": "CM"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 3.8480,
      "longitude": 11.5021
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
      ],
      "opens": "07:00",
      "closes": "22:00"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.7",
      "reviewCount": "2538"
    }
  }

  const mobileApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    "name": "QuickGo",
    "operatingSystem": "Android, iOS",
    "applicationCategory": "LifestyleApplication",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.6",
      "ratingCount": "12000"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "XAF"
    }
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "QuickGo",
    "url": "https://www.quickgo.cm",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://www.quickgo.cm/marketplace?search={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(mobileApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  )
}
