import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    
    // TODO: Send to error tracking service (Sentry)
    // Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-400" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-3">
              Oops! Something went wrong
            </h1>
            
            <p className="text-white/60 mb-6">
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>

            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-white/40 text-sm cursor-pointer hover:text-white/60 transition-colors">
                  Technical details
                </summary>
                <pre className="mt-2 p-3 bg-black/20 rounded-lg text-xs text-red-300 overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <button
              onClick={this.handleReset}
              className="w-full bg-gradient-to-r from-primary to-cyan-500 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Reload Application
            </button>

            <p className="mt-4 text-xs text-white/40">
              If this problem persists, please contact support
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
