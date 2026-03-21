import { motion } from "framer-motion";

const stats = [
  { value: "50K+", label: "Active Nodes" },
  { value: "30+", label: "Global Regions" },
  { value: "99.9%", label: "Uptime Rating" },
  { value: "10Gbps", label: "Network Backbone" },
];

export function Stats() {
  return (
    <section className="relative z-20 -mt-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 md:p-10 rounded-2xl bg-card/60 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]"
      >
        {stats.map((stat, idx) => (
          <div key={idx} className="text-center relative">
            {idx !== 0 && (
              <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-px h-12 bg-white/10" />
            )}
            <h3 className="font-display text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              {stat.value}
            </h3>
            <p className="text-xs md:text-sm text-primary font-bold uppercase tracking-widest">
              {stat.label}
            </p>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
