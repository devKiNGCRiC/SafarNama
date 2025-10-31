// src/Components/SEO/TourSEO.jsx
import React from 'react';
import { Helmet } from 'react-helmet-async';

const TourSEO = ({ tour }) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    "name": tour.name,
    "description": tour.description,
    "touristType": ["Adventure tourism", "Eco tourism"],
    "offers": {
      "@type": "Offer",
      "price": tour.pricing.adult,
      "priceCurrency": "INR"
    },
    "location": {
      "@type": "Place",
      "name": tour.destination.name,
      "address": tour.destination.address
    },
    "duration": `P${tour.duration.days}D`,
    "image": tour.images[0]
  };

  return (
    <Helmet>
      <title>{`${tour.name} - Eco Tourism Tour in ${tour.destination.name}`}</title>
      <meta name="description" content={tour.description.substring(0, 160)} />
      <meta name="keywords" content={`eco tourism, ${tour.name}, ${tour.destination.name}, adventure, sustainable tourism`} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={tour.name} />
      <meta property="og:description" content={tour.description.substring(0, 160)} />
      <meta property="og:image" content={tour.images[0]} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={tour.name} />
      <meta name="twitter:description" content={tour.description.substring(0, 160)} />
      <meta name="twitter:image" content={tour.images[0]} />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export default TourSEO;