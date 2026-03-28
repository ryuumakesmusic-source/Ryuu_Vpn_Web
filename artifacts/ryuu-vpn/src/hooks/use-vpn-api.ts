import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

/**
 * Hook for user registration.
 * Previously this was a stub that simulated the API call — now it calls the real backend.
 */
export function useRegister() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      api.register(username, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast({
        title: "Account Created",
        description: "Welcome to RYUU VPN. You are now logged in.",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Registration Failed",
        description: err.message || "Unable to create account. Please try again.",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook for purchasing a plan.
 */
export function useBuyPlan() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) => api.buyPlan(planId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["purchaseStatus"] });
      toast({
        title: "Plan Activated",
        description: `${data.planName} has been activated. New balance: ${data.newBalance.toLocaleString()} Ks.`,
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Purchase Failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook for gifting a plan to another user.
 */
export function useGiftPlan() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipientUsername, planId }: { recipientUsername: string; planId: string }) =>
      api.giftPlan(recipientUsername, planId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["purchaseStatus"] });
      toast({
        title: "Plan Gifted",
        description: `${data.planName} has been gifted to @${data.recipientUsername}.`,
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Gift Failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook for fetching the current user's dashboard stats.
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: () => api.stats(),
    staleTime: 30_000, // 30 seconds
  });
}

/**
 * Hook for fetching the current user's subscription info.
 */
export function useSubscription() {
  return useQuery({
    queryKey: ["subscription"],
    queryFn: () => api.subscription(),
    staleTime: 60_000, // 1 minute
  });
}

/**
 * Hook for fetching the monthly purchase status.
 */
export function usePurchaseStatus() {
  return useQuery({
    queryKey: ["purchaseStatus"],
    queryFn: () => api.purchaseStatus(),
    staleTime: 30_000,
  });
}
