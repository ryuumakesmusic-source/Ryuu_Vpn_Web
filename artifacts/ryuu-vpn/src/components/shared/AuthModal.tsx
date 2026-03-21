import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegister } from "@/hooks/use-vpn-api";

export function AuthModal({ 
  children, 
  defaultPlan = "annual" 
}: { 
  children: React.ReactNode, 
  defaultPlan?: string 
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const { mutate: register, isPending } = useRegister();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    register({ email, plan: defaultPlan }, {
      onSuccess: () => {
        setOpen(false);
        setEmail("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border-primary/30 bg-background/95 backdrop-blur-2xl shadow-[0_0_50px_-15px_rgba(168,85,247,0.4)]">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider text-3xl text-white uppercase">
            Initialize <span className="text-primary">Sequence</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-base">
            Establish a secure connection with RYUU VPN. Enter your email to begin.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-3">
            <Label htmlFor="email" className="text-muted-foreground font-medium uppercase tracking-wider text-xs">
              Operator Email
            </Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="netrunner@system.net" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-card/50 border-white/10 text-white h-12 px-4 focus-visible:border-primary focus-visible:ring-primary/30 transition-all"
            />
          </div>
          <Button 
            type="submit" 
            disabled={isPending} 
            className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold tracking-widest text-lg shadow-[0_0_20px_-5px_rgba(168,85,247,0.6)] transition-all"
          >
            {isPending ? "CONNECTING..." : "SECURE CONNECTION"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
