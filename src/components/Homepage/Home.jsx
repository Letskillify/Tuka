import React from 'react';
import Hero from './Hero';
import Marquee from './Marquee';
import QualitySection from './WhyChoose';
import SareeShowcase from './SareeShowcase';
import HindshreeSection from './HindshreeSection';
import WeavingHeritage from './WeavingHeritage';
import CategorySection from './CategorySection';
import BestSellers from './Bestsellers';
import TheEdit from './TheEdit';
import PromoSlider from './PromoSlider';
import TestimonialSection from './Testemonials';
import SocialGallery from './SocialGallery';
import NewsletterBar from './NewsletterBar';

function Home() {
  return (
    <div className="w-full bg-[#FDFAF5] overflow-hidden">
      {/* 1. Immersive Video Hero Banner */}
      <Hero />

      {/* 2. Infinite Ticker Announcement Marquee */}
      {/* <Marquee /> */}

      {/* 3. The Brand Promise / Craftsmanship Grid */}
      {/* <QualitySection /> */}

      {/* 4. Iconic Weaves of Bengal - Dhaniakhali, Begumpuri, Shantipuri, Hindshree */}
      <SareeShowcase />

      {/* 5. Hindshree Saree Collection Anthology */}
      {/* <HindshreeSection /> */}

      {/* 6. Bengali Craft Narrative Video Storytelling */}
      {/* <WeavingHeritage /> */}

      {/* 7. Flush Luxury Category Showcase */}
      <CategorySection />

      {/* 8. Most Loved Bestsellers Swiper Carousel */}
      <BestSellers />

      {/* 9. Editorial Spotlight - The Edit (Trending vs Bestsellers) */}
      {/* <TheEdit /> */}

      {/* 10. Curated Promo Slider */}
      {/* <PromoSlider /> */}

      {/* 11. Customer Love & Verified Buyer Reviews */}
      <TestimonialSection />


    </div>
  );
}

export default Home;

