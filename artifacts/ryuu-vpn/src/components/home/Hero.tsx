import { AuthModal } from "@/components/shared/AuthModal";
import { motion } from "framer-motion";

export function Hero() {
  const logoUrl =
    "https://assets.streamlinehq.com/image/private/w_300,h_300,ar_1/f_auto/v1/icons/interface-essential/check-badge-89c8o2nllxjypnppfmi9xm.png/check-badge-t05f9l6xba1iwy9pjudt.png?_a=DATAiZAAZAA0";

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background: CSS grid + glows */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `linear-gradient(rgba(168,85,247,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.15) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[700px] bg-primary/10 blur-[180px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/50 to-background" />
      </div>

      {/* Content — pt-28 accounts for the fixed navbar (~96px) */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 px-5 py-2 rounded-full border border-purple-500/40 bg-purple-900/20 text-purple-300 text-xs font-semibold tracking-[0.2em] uppercase"
        >
          Singapore Servers · Zero Logs · Always On
        </motion.div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-10"
        >
          <div className="absolute inset-0 bg-primary/25 blur-[60px] rounded-full scale-150" />
          <img
            src={logoUrl}
            alt="RYUU VPN Secure Badge"
            className="relative w-32 h-32 md:w-44 md:h-44 drop-shadow-[0_0_40px_rgba(168,85,247,0.8)]"
          />
        </motion.div>

        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-display text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-6 uppercase leading-none"
        >
          Secure. Fast.
          <br />
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent drop-shadow-lg">
            Unrestricted.
          </span>
        </motion.h1>

        <motion.p
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="max-w-xl text-base md:text-lg text-white/60 mb-12 leading-relaxed"
        >
          Protect your digital identity with military-grade encryption. Bypass
          restrictions, mask your identity, and explore the internet without
          borders.
        </motion.p>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <AuthModal defaultPlan="premium">
            <button className="inline-flex items-center justify-center h-14 px-10 rounded-xl bg-primary text-white font-display font-bold text-sm tracking-widest uppercase shadow-[0_0_30px_-5px_rgba(168,85,247,0.7)] hover:shadow-[0_0_50px_-5px_rgba(168,85,247,0.9)] hover:-translate-y-1 transition-all duration-200 cursor-pointer">
              Get Started
            </button>
          </AuthModal>
          <a
            href="#pricing"
            className="inline-flex items-center justify-center h-14 px-10 rounded-xl border border-white/20 bg-white/5 text-white font-display font-bold text-sm tracking-widest uppercase backdrop-blur-sm hover:bg-white/10 hover:-translate-y-1 transition-all duration-200"
          >
            View Plans
          </a>
        </motion.div>
      </div>

      {/* Bottom fade into next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
}
