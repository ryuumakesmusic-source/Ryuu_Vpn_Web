import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/shared/AuthModal";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const plans = [
  {
    id: "starter",
    name: "STARTER PLAN",
    sub: "Trial & Light Users",
    price: "3,000",
    currency: "Ks",
    data: "50 GB",
    validity: "20 Days",
    note: "✅ Rollover: Unused data carries over when you renew before expiry.",
    highlight: false,
    delay: 0.1,
  },
  {
    id: "premium",
    name: "PREMIUM VALUE",
    sub: "Best Seller — Most Popular",
    price: "5,000",
    currency: "Ks",
    data: "120 GB",
    validity: "30 Days",
    note: "✅ Rollover: Unused data carries over when you renew before expiry.",
    highlight: true,
    delay: 0.3,
  },
  {
    id: "ultra",
    name: "ULTRA PRO",
    sub: "Heavy Users — 4K & Downloads",
    price: "10,000",
    currency: "Ks",
    data: "250 GB",
    validity: "30 Days",
    note: "✅ Data rollover + High-Speed Priority access.",
    highlight: false,
    delay: 0.5,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-28 md:py-36 bg-[#080810] relative scroll-mt-24">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="font-display text-4xl md:text-5xl font-bold mb-4 uppercase text-white"
          >
            Choose Your{" "}
            <span className="text-primary drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">Plan</span>
          </motion.h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground max-w-2xl mx-auto text-lg font-medium"
          >
            Transparent pricing. No hidden fees. Real Singapore VPN.
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
                  ? "border-2 border-primary shadow-[0_0_40px_-10px_rgba(168,85,247,0.4)] lg:-translate-y-6 z-10"
                  : "border border-white/10 hover:border-white/20 mt-0 lg:mt-6"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-white px-6 py-2 rounded-full text-xs font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(168,85,247,0.5)] flex items-center gap-1.5">
                  <Star className="w-3 h-3 fill-white" />
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className={`font-display text-xl font-bold tracking-widest mb-1 ${plan.highlight ? "text-primary" : "text-white"}`}>
                  {plan.name}
                </h3>
                <p className="text-xs text-muted-foreground font-medium">{plan.sub}</p>
              </div>

              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-bold text-white tracking-tight">{plan.price}</span>
                <span className="text-xl font-bold text-primary">{plan.currency}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1 uppercase tracking-widest">Data</p>
                  <p className="text-lg font-bold text-white">{plan.data}</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1 uppercase tracking-widest">Validity</p>
                  <p className="text-base font-bold text-white">{plan.validity}</p>
                </div>
              </div>

              <div className="flex-grow mb-8">
                <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-primary/40 pl-3">
                  {plan.note}
                </p>
              </div>

              <AuthModal defaultPlan={plan.id}>
                <Button
                  className={`w-full h-14 font-display font-bold tracking-widest text-sm transition-all ${
                    plan.highlight
                      ? "bg-primary hover:bg-primary/80 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)]"
                      : "bg-white/5 hover:bg-white/15 text-white border border-white/10"
                  }`}
                >
                  Buy Now
                </Button>
              </AuthModal>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
