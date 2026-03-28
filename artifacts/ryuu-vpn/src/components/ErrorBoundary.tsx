// ─────────────────────────────────────────────────────────────────
//  artifacts/ryuu-vpn/src/components/ErrorBoundary.tsx  (NEW FILE)
//
//  Wrap App.tsx content in this so unhandled runtime errors show
//  a friendly message instead of a blank white screen.
//
//  Usage in App.tsx:
//    import { ErrorBoundary } from "@/components/ErrorBoundary";
//    // wrap <Router /> inside <ErrorBoundary>
// ─────────────────────────────────────────────────────────────────

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // pino-style — replace with your logger if available
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white/[0.03] border border-red-500/30 rounded-2xl p-8 text-center">
            <h1 className="font-display text-2xl font-bold text-red-400 mb-3">
              Something went wrong
            </h1>
            <p className="text-white/50 text-sm mb-6">
              An unexpected error occurred. Please refresh the page.
            </p>
            {this.state.message && (
              <pre className="text-left text-xs text-white/30 bg-black/30 rounded-xl p-4 mb-6 overflow-auto">
                {this.state.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
