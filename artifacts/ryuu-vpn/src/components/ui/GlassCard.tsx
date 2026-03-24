import { type ReactNode } from "react";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
}

export function GlassCard({ children, className = "", hover = true, gradient = false }: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.01 } : {}}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`
        relative overflow-hidden rounded-2xl
        bg-white/[0.03] backdrop-blur-xl
        border border-white/10
        shadow-[0_8px_32px_rgba(0,0,0,0.3)]
        ${hover ? "hover:shadow-[0_12px_48px_rgba(139,92,246,0.15)] hover:border-primary/30" : ""}
        transition-all duration-300
        ${className}
      `}
    >
      {gradient && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5 pointer-events-none" />
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 blur-[60px] rounded-full pointer-events-none" />
        </>
      )}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
