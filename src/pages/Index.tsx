import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CategoriesSection from "@/components/CategoriesSection";
import FeaturedJobsSection from "@/components/FeaturedJobsSection";
import MediaGallerySection from "@/components/MediaGallerySection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <CategoriesSection />
      <FeaturedJobsSection />
      <MediaGallerySection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;

