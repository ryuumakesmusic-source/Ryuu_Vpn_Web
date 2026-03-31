import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/shared/AuthModal";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const logoUrl = "/logo.svg";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/90 backdrop-blur-md border-b border-white/5 shadow-lg shadow-black/50"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 md:h-24">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src={logoUrl}
              alt="RYUU VPN Logo"
              className="w-10 h-10 md:w-12 md:h-12 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)] group-hover:scale-105 transition-transform"
            />
            <span className="font-display font-bold text-2xl md:text-3xl tracking-widest text-foreground">
              RYUU{" "}
              <span className="text-primary drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">
                VPN
              </span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-sm font-medium text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors">
              Pricing
            </a>
            <a href="#faq" className="text-sm font-medium text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors">
              FAQ
            </a>
          </div>

          <div className="hidden md:block">
            {user ? (
              <Button
                onClick={() => navigate("/dashboard")}
                className="h-11 px-6 font-display font-bold text-sm tracking-wider bg-primary/10 text-primary border border-primary/50 hover:bg-primary hover:text-primary-foreground transition-all shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)] hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                DASHBOARD
              </Button>
            ) : (
              <AuthModal>
                <Button className="h-11 px-6 font-display font-bold text-sm tracking-wider bg-primary/10 text-primary border border-primary/50 hover:bg-primary hover:text-primary-foreground transition-all shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)] hover:shadow-[0_0_20px_rgba(168,85,247,0.6)]">
                  GET STARTED
                </Button>
              </AuthModal>
            )}
          </div>

          <button
            className="md:hidden text-foreground hover:text-primary transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-white/5 p-6 space-y-6 absolute w-full left-0 shadow-2xl">
          <a href="#features" onClick={() => setIsOpen(false)} className="block text-base font-medium text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors">
            Features
          </a>
          <a href="#pricing" onClick={() => setIsOpen(false)} className="block text-base font-medium text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors">
            Pricing
          </a>
          <a href="#faq" onClick={() => setIsOpen(false)} className="block text-base font-medium text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors">
            FAQ
          </a>
          <AuthModal>
            <Button className="w-full h-12 font-display font-bold text-lg tracking-wider bg-primary/10 text-primary border border-primary/50 hover:bg-primary hover:text-primary-foreground transition-all">
              GET STARTED
            </Button>
          </AuthModal>
        </div>
      )}
    </nav>
  );
}
