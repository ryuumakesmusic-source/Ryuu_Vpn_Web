import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ANNOUNCEMENT_TITLE = "📣 RYUU VPN SHOP - New Plan Updates! 🐉";

const ANNOUNCEMENT_BODY = `ကျွန်တော်တို့ RYUU VPN ကို အစဉ်တစိုက် အားပေးနေကြတဲ့ Customer များအတွက် ပိုမိုကောင်းမွန်တဲ့ Service နဲ့ ပိုမိုတန်ဆာရှိတဲ့ Plan အသစ်တွေကို မိတ်ဆက်ပေးလိုက်ပါပြီ။ 🚀
စင်ကာပူ Server အစစ်ကို အသုံးပြုထားလို့ Gaming, Streaming နဲ့ Social Media အားလုံးအတွက် လိုင်းဆွဲအား အကောင်းဆုံး ဖြစ်မှာပါ။ အခုပဲ ကိုယ်နဲ့ကိုက်ညီမယ့် Plan ကို ရွေးချယ်လိုက်ပါ!`;

const PLANS = [
  {
    label: "🔹 1. STARTER PLAN (Trial & Light User)",
    lines: [
      "အစမ်းသုံးကြည့်ချင်သူများနဲ့ စာပို့၊ ဖုန်းပြောရုံ သုံးမယ့်သူများအတွက်။",
      "• Data: 50 GB",
      "• Validity: 20 Days (ရက် ၂၀)",
      "• Price: 3,000 Ks",
      "• Special Benefit: သက်တမ်းမကုန်ခင် ပြန်တိုးပါက လက်ကျန် Data များအားလုံးကို ရှေ့လထဲ ပေါင်းထည့်ပေးပါသည်။ ✅",
    ],
  },
  {
    label: "🔹 2. PREMIUM VALUE (Most Popular) ✨",
    lines: [
      "ကျွန်တော်တို့ရဲ့ Best Seller Plan ပါ! ဈေးအသက်သာဆုံးနဲ့ အတန်ဆုံး သုံးချင်သူများအတွက်။",
      "• Data: 120 GB (Data ပမာဏ ၂ ဆကျော် ပိုရ!)",
      "• Validity: 30 Days (တစ်လအပြည့်)",
      "• Price: 5,000 Ks",
      "• Special Benefit: သက်တမ်းမကုန်ခင် ပြန်တိုးပါက လက်ကျန် Data များအားလုံးကို ရှေ့လထဲ ပေါင်းထည့်ပေးပါသည်။ ✅",
    ],
  },
  {
    label: "🔹 3. ULTRA PRO (Heavy User)",
    lines: [
      "Download ဆွဲမလား၊ 4K Video ကြည့်မလား စိတ်ကြိုက်သုံး။",
      "• Data: 250 GB",
      "• Validity: 30 Days",
      "• Price: 10,000 Ks",
      "• Special Benefit: လက်ကျန် Data ပေါင်းထည့်ခွင့် ရှိသည့်အပြင် High-Speed Priority ရရှိပါမည်။ ✅",
    ],
  },
];

export function AnnouncementBanner() {
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
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[101] flex items-center justify-center px-4 py-8 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-lg relative rounded-2xl overflow-hidden shadow-2xl border border-purple-500/30 max-h-[85vh] flex flex-col">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#0e0018] via-[#130928] to-[#050d1a]" />
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-700/20 via-transparent to-cyan-700/15 pointer-events-none" />
              <div className="absolute -top-20 -right-20 w-56 h-56 bg-purple-600/20 blur-[60px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-600/15 blur-[50px] rounded-full pointer-events-none" />

              {/* Scrollable content */}
              <div className="relative z-10 p-6 sm:p-8 overflow-y-auto flex-1">
                {/* Title */}
                <h2 className="text-white font-bold text-lg sm:text-xl leading-snug mb-4">
                  {ANNOUNCEMENT_TITLE}
                </h2>

                {/* Body */}
                <p className="text-purple-200/85 text-sm leading-relaxed mb-5 whitespace-pre-line">
                  {ANNOUNCEMENT_BODY}
                </p>

                {/* Plans */}
                <div className="space-y-4">
                  {PLANS.map((plan, i) => (
                    <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-4">
                      <p className="text-white font-semibold text-sm mb-2">{plan.label}</p>
                      <div className="space-y-1">
                        {plan.lines.map((line, j) => (
                          <p key={j} className="text-purple-200/80 text-xs leading-relaxed">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dismiss — sticky at bottom */}
              <div className="relative z-10 px-6 sm:px-8 pb-6 sm:pb-8 pt-3 shrink-0">
                <button
                  onClick={() => setDismissed(true)}
                  className="w-full py-3 rounded-xl bg-primary/20 hover:bg-primary/30 border border-primary/40 hover:border-primary/70 text-primary font-bold text-sm tracking-widest uppercase transition-all"
                >
                  DISMISS
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
