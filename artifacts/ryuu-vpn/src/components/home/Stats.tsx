import { motion } from "framer-motion";

const stats = [
  { value: "99.9%", label: "Uptime" },
  { value: "Unlimited", label: "Speed" },
  { value: "0 Logs", label: "Privacy" },
  { value: "24/7", label: "Support" },
];

export function Stats() {
  return (
    <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-2 md:grid-cols-4 gap-0 rounded-2xl bg-[#0f0f1a] border border-white/10 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7)] overflow-hidden"
      >
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={`flex flex-col items-center justify-center py-10 px-6 text-center relative ${
              idx < stats.length - 1 ? "border-r border-white/[0.06]" : ""
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
            <h3 className="font-display text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-[0_0_12px_rgba(168,85,247,0.4)]">
              {stat.value}
            </h3>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/80">
              {stat.label}
            </p>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
