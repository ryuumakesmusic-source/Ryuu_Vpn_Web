import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqs = [
  {
    q: "How do I initialize the RYUU connection?",
    a: "Simply acquire an access plan, download our client for your specific OS (Windows, macOS, iOS, Android, or Linux), and click 'Connect'. Our routing algorithms automatically tunnel you through the fastest secure node."
  },
  {
    q: "Does the system log my activity?",
    a: "Absolutely not. We operate under a strict zero-logs policy. Our server architecture is RAM-only, meaning any data is permanently obliterated the moment a server reboots or shuts down."
  },
  {
    q: "Can I use RYUU on multiple hardware units?",
    a: "Yes. Depending on your active protocol (plan), a single subscription authorizes up to 10 devices simultaneously, securing your entire hardware ecosystem."
  },
  {
    q: "Will the encryption throttle my bandwidth?",
    a: "Negligibly. We utilize advanced protocols (WireGuard) paired with 10Gbps backbone connections. You can stream 4K content, game, and transfer large files with virtually zero interruption."
  },
  {
    q: "Is there a fail-safe kill switch?",
    a: "Yes. In the rare event your connection to our node drops, the built-in kill switch instantly severs your internet access to prevent any accidental data leakage."
  }
];

export function FAQ() {
  return (
    <section id="faq" className="py-24 md:py-32 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <motion.h2 
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="font-display text-4xl md:text-5xl font-bold mb-4 uppercase text-white"
        >
          Query <span className="text-primary drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">Database</span>
        </motion.h2>
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground text-lg font-medium"
        >
          Frequently requested data from the network.
        </motion.p>
      </div>
      
      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="bg-card/30 p-6 md:p-10 rounded-3xl border border-white/5"
      >
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-white/10 px-2 py-2">
              <AccordionTrigger className="text-left font-display text-xl tracking-wide hover:text-primary transition-colors hover:no-underline text-white/90">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-base font-medium pt-2 pb-4">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </section>
  );
}
