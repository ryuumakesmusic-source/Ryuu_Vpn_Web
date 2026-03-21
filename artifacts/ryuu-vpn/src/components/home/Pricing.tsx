import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/shared/AuthModal";
import { motion } from "framer-motion";

const plans = [
  {
    id: "monthly",
    name: "BASE PLAN",
    price: "$9.99",
    period: "/mo",
    features: ["100GB High-Speed Data", "5 Devices Supported", "Standard Encryption", "Standard Support"],
    highlight: false,
    delay: 0.1
  },
  {
    id: "annual",
    name: "PRIME DIRECTIVE",
    price: "$6.66",
    period: "/mo",
    billed: "Billed $79.99 yearly. Save 33%",
    features: ["Unlimited High-Speed Data", "10 Devices Supported", "Military-Grade Encryption", "Priority 24/7 Support", "Ad & Malware Blocker"],
    highlight: true,
    delay: 0.3
  },
  {
    id: "quarterly",
    name: "EXTENDED PLAN",
    price: "$8.33",
    period: "/mo",
    billed: "Billed $24.99 quarterly. Save 17%",
    features: ["500GB High-Speed Data", "5 Devices Supported", "Military-Grade Encryption", "Standard Support"],
    highlight: false,
    delay: 0.5
  }
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 md:py-32 bg-black relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="font-display text-4xl md:text-5xl font-bold mb-4 uppercase text-white"
          >
            Access <span className="text-primary drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">Protocols</span>
          </motion.h2>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground max-w-2xl mx-auto text-lg font-medium"
          >
            Select the connection tier that aligns with your operational requirements.
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
          {plans.map((plan) => (
            <motion.div 
              key={plan.id}
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: plan.delay, duration: 0.6 }}
              className={`relative p-8 md:p-10 rounded-3xl bg-card/80 backdrop-blur-xl flex flex-col h-full ${
                plan.highlight 
                  ? 'border-2 border-primary shadow-[0_0_40px_-10px_rgba(168,85,247,0.4)] lg:-translate-y-6 z-10' 
                  : 'border border-white/10 hover:border-white/20 mt-0 lg:mt-6'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-white px-6 py-2 rounded-full text-xs font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                  Maximum Stealth
                </div>
              )}
              
              <div className="mb-8">
                <h3 className={`font-display text-2xl font-bold tracking-widest mb-6 ${plan.highlight ? 'text-primary' : 'text-white'}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-white tracking-tight">{plan.price}</span>
                  <span className="text-muted-foreground font-medium">{plan.period}</span>
                </div>
                <div className="h-6 mt-2">
                  {plan.billed && <p className="text-sm font-medium text-secondary">{plan.billed}</p>}
                </div>
              </div>
              
              <div className="flex-grow">
                <ul className="space-y-5 mb-10">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-4 text-sm font-medium text-muted-foreground">
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-white/80">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <AuthModal defaultPlan={plan.id}>
                <Button 
                  className={`w-full h-14 font-display font-bold tracking-widest text-lg transition-all ${
                    plan.highlight 
                      ? 'bg-primary hover:bg-primary/80 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)]' 
                      : 'bg-white/5 hover:bg-white/15 text-white border border-white/10'
                  }`}
                >
                  ACQUIRE ACCESS
                </Button>
              </AuthModal>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
