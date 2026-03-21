import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/shared/AuthModal";
import { motion } from "framer-motion";

export function Hero() {
  const logoUrl = "https://assets.streamlinehq.com/image/private/w_300,h_300,ar_1/f_auto/v1/icons/interface-essential/check-badge-89c8o2nllxjypnppfmi9xm.png/check-badge-t05f9l6xba1iwy9pjudt.png?_a=DATAiZAAZAA0";

  return (
    <section className="relative min-h-[100svh] flex items-center justify-center pt-20 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/cyber-bg.png`} 
          className="w-full h-full object-cover opacity-25 mix-blend-screen" 
          alt="Cyberpunk grid background" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/60 to-background" />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-10"
        >
          <div className="absolute inset-0 bg-primary/20 blur-[50px] rounded-full" />
          <img 
            src={logoUrl} 
            alt="RYUU VPN Secure Shield" 
            className="relative w-36 h-36 md:w-52 md:h-52 drop-shadow-[0_0_30px_rgba(168,85,247,0.7)]" 
          />
        </motion.div>
        
        <motion.h1 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-6 uppercase leading-none"
        >
          Secure. Fast. <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary drop-shadow-lg">
            Unrestricted.
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-2xl text-lg md:text-xl text-muted-foreground mb-12 font-medium"
        >
          Protect your digital footprint with military-grade encryption. Bypass restrictions, mask your identity, and explore the internet without borders.
        </motion.p>
        
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-5"
        >
          <AuthModal defaultPlan="annual">
            <Button size="lg" className="h-16 px-10 text-lg font-display font-bold tracking-widest uppercase bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_-5px_rgba(168,85,247,0.6)] hover:shadow-[0_0_40px_-5px_rgba(168,85,247,0.8)] transition-all hover:-translate-y-1">
              Initiate Link
            </Button>
          </AuthModal>
          <Button size="lg" variant="outline" className="h-16 px-10 text-lg font-display font-bold tracking-widest uppercase border-white/20 text-white bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all hover:-translate-y-1" asChild>
            <a href="#pricing">View Protocols</a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
