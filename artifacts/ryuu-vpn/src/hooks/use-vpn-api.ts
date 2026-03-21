import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Simulated hook for user registration / plan purchase 
// since the full backend API is not provided yet.
export function useRegister() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: { email: string, plan: string }) => {
      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true, ...data };
    },
    onSuccess: (data) => {
      toast({
        title: "Connection Established",
        description: `Welcome to RYUU VPN. Your ${data.plan.toUpperCase()} protocol is ready.`,
        className: "bg-background border-primary text-primary shadow-[0_0_20px_-5px_rgba(168,85,247,0.5)]",
      });
    },
    onError: () => {
      toast({
        title: "Connection Failed",
        description: "Unable to establish secure link. Please try again.",
        variant: "destructive",
      });
    }
  });
}
