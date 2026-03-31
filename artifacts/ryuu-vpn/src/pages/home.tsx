import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { AnnouncementBanner } from "@/components/layout/AnnouncementBanner";
import { Hero } from "@/components/home/Hero";
import { Stats } from "@/components/home/Stats";
import { Features } from "@/components/home/Features";
import { Pricing } from "@/components/home/Pricing";
import { Testimonials } from "@/components/home/Testimonials";
import { FAQ } from "@/components/home/FAQ";
import { Footer } from "@/components/layout/Footer";

export default function HomePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const handleAnnouncementDismiss = () => {
    // If user is logged in, redirect to dashboard after dismissing announcement
    if (user) {
      navigate("/dashboard");
    }
    // If not logged in, stay on home page (do nothing)
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-x-hidden selection:bg-primary/30 selection:text-white">
      <AnnouncementBanner onDismiss={handleAnnouncementDismiss} />
      <Navbar />

      <main className="flex-grow w-full">
        <Hero />
        <Stats />
        <Features />
        <Pricing />
        <Testimonials />
        <FAQ />
      </main>

      <Footer />
    </div>
  );
}
