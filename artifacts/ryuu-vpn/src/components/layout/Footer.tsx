import { Link } from "wouter";

export function Footer() {
  const logoUrl =
    "https://assets.streamlinehq.com/image/private/w_300,h_300,ar_1/f_auto/v1/icons/interface-essential/check-badge-89c8o2nllxjypnppfmi9xm.png/check-badge-t05f9l6xba1iwy9pjudt.png?_a=DATAiZAAZAA0";

  return (
    <footer className="border-t border-white/5 bg-black/50 pt-20 pb-8 relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-3 mb-6 opacity-80 hover:opacity-100 transition-opacity">
              <img src={logoUrl} alt="RYUU VPN Logo" className="w-8 h-8 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
              <span className="font-display font-bold text-xl tracking-widest text-foreground">
                RYUU <span className="text-primary">VPN</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your privacy. Our mission.
            </p>
          </div>

          <div className="flex flex-wrap gap-16">
            <div>
              <h4 className="font-display font-bold text-white mb-6 uppercase tracking-widest text-sm">Quick Links</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-primary transition-colors hover:translate-x-1 inline-block transform duration-200">Features</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors hover:translate-x-1 inline-block transform duration-200">Pricing</a></li>
                <li><a href="#faq" className="hover:text-primary transition-colors hover:translate-x-1 inline-block transform duration-200">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-bold text-white mb-6 uppercase tracking-widest text-sm">Contact Us</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors hover:translate-x-1 inline-block transform duration-200">Telegram</a></li>
                <li><a href="#" className="hover:text-primary transition-colors hover:translate-x-1 inline-block transform duration-200">Facebook</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-muted-foreground">
          <p>© {new Date().getFullYear()} RYUU VPN. All rights reserved.</p>
          <div className="flex items-center gap-3 bg-card/50 px-4 py-2 rounded-full border border-white/5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 shadow-[0_0_8px_#22c55e]"></span>
            </span>
            <span className="uppercase tracking-wider">Network: Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
