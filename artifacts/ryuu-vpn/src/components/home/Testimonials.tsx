import { motion } from "framer-motion";
import { Star } from "lucide-react";

const reviews = [
  {
    initials: "JD",
    name: "Jameson D.",
    role: "Security Architect",
    text: "RYUU VPN provides the most stable node connection I've experienced. The encryption protocols hold up perfectly under heavy stress tests. Flawless execution."
  },
  {
    initials: "AL",
    name: "Alyssa L.",
    role: "Freelance Operator",
    text: "Finally a tool that doesn't throttle my data. I can access my home region's secure networks from any café in the world without latency."
  },
  {
    initials: "SW",
    name: "Silas W.",
    role: "Privacy Advocate",
    text: "The zero-logs policy is airtight. The interface is clean, incredibly intuitive, and perfectly fits my system aesthetic. Highly recommended."
  }
];

export function Testimonials() {
  return (
    <section className="py-24 md:py-32 bg-background border-y border-white/5 relative">
      {/* Decorative gradient mesh */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-secondary/5 via-background to-background pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="font-display text-4xl md:text-5xl font-bold mb-4 uppercase text-white"
          >
            System <span className="text-secondary drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">Feedback</span>
          </motion.h2>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground max-w-2xl mx-auto text-lg font-medium"
          >
            Direct reports from active operators on the network.
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((rev, idx) => (
            <motion.div 
              key={idx}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15 }}
              className="p-8 md:p-10 rounded-2xl bg-card/40 border border-white/10 hover:border-secondary/30 transition-colors shadow-lg relative"
            >
              <div className="flex text-secondary mb-8 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]" />
                ))}
              </div>
              <p className="text-muted-foreground italic mb-10 leading-relaxed text-lg text-white/80">
                "{rev.text}"
              </p>
              <div className="flex items-center gap-5 mt-auto">
                <div className="w-14 h-14 rounded-full bg-secondary/10 border border-secondary/50 flex items-center justify-center font-display font-bold text-secondary text-xl shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                  {rev.initials}
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">{rev.name}</h4>
                  <p className="text-sm font-medium text-secondary">{rev.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
