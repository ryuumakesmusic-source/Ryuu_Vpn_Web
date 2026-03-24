import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";

interface WelcomeAnnouncementProps {
  onDismiss: () => void;
}

export function WelcomeAnnouncement({ onDismiss }: WelcomeAnnouncementProps) {
  const [show, setShow] = useState(true);

  const handleDismiss = () => {
    setShow(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md bg-gradient-to-br from-[#0f0f17] to-[#1a1a2e] border border-primary/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Decorative gradient */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/10 to-transparent" />
            
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="relative z-10 text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-primary/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>

              <h2 className="font-display text-2xl font-bold text-white mb-3 uppercase tracking-wide">
                Welcome to RYUU VPN!
              </h2>

              <div className="space-y-4 text-left mb-8">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-primary mb-2 uppercase tracking-wider">🎉 What's New</h3>
                  <ul className="text-sm text-white/70 space-y-1.5">
                    <li>• Persistent login - stay logged in across sessions</li>
                    <li>• Telegram notifications for top-ups & expiry</li>
                    <li>• Improved dashboard with real-time stats</li>
                  </ul>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-amber-400 mb-2 uppercase tracking-wider">⚡ Quick Start</h3>
                  <ul className="text-sm text-white/70 space-y-1.5">
                    <li>• Link your Telegram: Send <code className="px-1.5 py-0.5 bg-black/30 rounded text-primary">/link username</code> to bot</li>
                    <li>• Top up your balance using KBZ/Wave/AYA Pay</li>
                    <li>• Buy a plan and start browsing securely!</li>
                  </ul>
                </div>

                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-green-400 mb-2 uppercase tracking-wider">💡 Pro Tip</h3>
                  <p className="text-sm text-white/70">
                    You'll get notified 3 days before your plan expires. Keep your balance topped up for seamless renewals!
                  </p>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="w-full py-4 rounded-xl bg-primary text-white font-display font-bold tracking-widest text-sm uppercase shadow-[0_0_30px_-5px_rgba(168,85,247,0.7)] hover:shadow-[0_0_40px_-5px_rgba(168,85,247,0.9)] hover:-translate-y-0.5 transition-all"
              >
                Get Started
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
