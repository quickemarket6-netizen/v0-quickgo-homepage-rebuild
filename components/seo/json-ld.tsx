import { SITE_URL } from "@/lib/site-config"

const BASE = SITE_URL

export default function JsonLd() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "QuickGo",
    "alternateName": "QuickGo Cameroun",
    "url": BASE,
    "logo": {
      "@type": "ImageObject",
      "url": `${BASE}/quickgo-logo.jpg`,
      "width": 1080,
      "height": 1080,
    },
    "sameAs": [
      "https://www.facebook.com/quickgocm",
      "https://www.instagram.com/quickgocm",
      "https://www.twitter.com/quickgocm",
      "https://www.linkedin.com/company/quickgocm",
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+237-695-555-555",
      "contactType": "customer service",
      "areaServed": "CM",
      "availableLanguage": ["French", "English"],
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Bastos",
      "addressLocality": "Yaoundé",
      "addressCountry": "CM",
    },
  }

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "QuickGo",
    "image": `${BASE}/quickgo-logo.jpg`,
    "@id": BASE,
    "url": BASE,
    "telephone": "+237-695-555-555",
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Bastos",
      "addressLocality": "Yaoundé",
      "addressRegion": "Centre",
      "postalCode": "",
      "addressCountry": "CM",
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 3.8480,
      "longitude": 11.5021,
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
      ],
      "opens": "07:00",
      "closes": "22:00",
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.7",
      "reviewCount": "2538",
    },
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
      "ratingCount": "12000",
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "XAF",
    },
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "QuickGo",
    "url": BASE,
    "inLanguage": "fr-CM",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${BASE}/marketplace?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }

  const deliveryServiceSchema = {
    "@context": "https://schema.org",
    "@type": "DeliveryEvent",
    "name": "QuickGo Livraison Express",
    "description": "Service de livraison express en 30 minutes au Cameroun",
    "provider": {
      "@type": "Organization",
      "name": "QuickGo",
      "url": BASE,
    },
  }

  const schemas = [
    organizationSchema,
    localBusinessSchema,
    mobileApplicationSchema,
    websiteSchema,
    deliveryServiceSchema,
  ]

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  )
}
