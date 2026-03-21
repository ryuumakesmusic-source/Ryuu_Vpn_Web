import { useState } from "react";
import { X } from "lucide-react";
import { useLang } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

export function AnnouncementBanner() {
  const { t } = useLang();
  const [dismissed, setDismissed] = useState(false);

  return (
    <AnimatePresence>
      {!dismissed && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
            onClick={() => setDismissed(true)}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[101] flex items-center justify-center px-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-lg relative rounded-2xl overflow-hidden shadow-2xl border border-purple-500/30">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#0e0018] via-[#130928] to-[#050d1a]" />
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-700/20 via-transparent to-cyan-700/15 pointer-events-none" />
              <div className="absolute -top-20 -right-20 w-56 h-56 bg-purple-600/20 blur-[60px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-600/15 blur-[50px] rounded-full pointer-events-none" />

              {/* Dismiss button */}
              <button
                onClick={() => setDismissed(true)}
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white/60 hover:text-white transition-all"
                aria-label={t("ann.dismiss")}
              >
                <X className="w-4 h-4" />
              </button>

              {/* Content */}
              <div className="relative z-10 p-6 sm:p-8">
                {/* Title */}
                <h2 className="text-white font-bold text-lg sm:text-xl leading-snug mb-4 pr-8">
                  {t("ann.title")}
                </h2>

                {/* Body text */}
                <p className="text-purple-200/80 text-sm leading-relaxed mb-5">
                  {t("ann.body")}
                </p>

                {/* Plan highlights */}
                <div className="space-y-2 mb-6">
                  {t("ann.plans").split("   ").map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                      <span className="text-cyan-200/90 font-medium">{item.trim()}</span>
                    </div>
                  ))}
                </div>

                {/* Dismiss button */}
                <button
                  onClick={() => setDismissed(true)}
                  className="w-full py-3 rounded-xl bg-primary/20 hover:bg-primary/30 border border-primary/40 hover:border-primary/70 text-primary font-bold text-sm tracking-widest uppercase transition-all"
                >
                  {t("ann.dismiss")}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
