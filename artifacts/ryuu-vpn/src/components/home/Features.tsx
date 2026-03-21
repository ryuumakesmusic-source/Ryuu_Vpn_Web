import { Shield, Zap, Globe, FileX } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Shield,
    title: "Military-Grade Security",
    desc: "AES-256 bit encryption ensures your data stream is completely unreadable to unauthorized entities and network sniffers."
  },
  {
    icon: Zap,
    title: "Lightning Fast Velocity",
    desc: "Experience 10Gbps backbone connections with zero throttling. Optimized for 4K streaming and low-latency gaming."
  },
  {
    icon: Globe,
    title: "Global Server Grid",
    desc: "Connect seamlessly to over 30 locations worldwide. Bypass geo-blocks instantly and mask your true location."
  },
  {
    icon: FileX,
    title: "Absolute Zero Logs",
    desc: "Your privacy is paramount. Our RAM-only architecture ensures we never track, collect, or store your browsing activity."
  }
];

export function Features() {
  return (
    <section id="features" className="py-24 md:py-32 relative overflow-hidden bg-background">
      <div className="absolute inset-0 z-0 opacity-20 mix-blend-screen pointer-events-none">
        <img 
          src={`${import.meta.env.BASE_URL}images/map-nodes.png`} 
          className="w-full h-full object-cover" 
          alt="Global Network Map" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="font-display text-4xl md:text-5xl font-bold mb-4 uppercase tracking-wide text-white"
          >
            Next-Gen <span className="text-primary drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">Capabilities</span>
          </motion.h2>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground max-w-2xl mx-auto text-lg font-medium"
          >
            Engineered for maximum security and untethered performance across the global net.
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feat, idx) => (
            <motion.div 
              key={idx}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 + 0.2 }}
              className="p-8 rounded-2xl bg-card/80 backdrop-blur-sm border border-white/5 hover:border-primary/50 transition-all duration-300 group hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.2)] hover:-translate-y-2 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] group-hover:bg-primary/20 transition-colors" />
              
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 border border-primary/20">
                <feat.icon className="w-8 h-8 text-primary drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-4 text-white">{feat.title}</h3>
              <p className="text-muted-foreground leading-relaxed font-medium">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
