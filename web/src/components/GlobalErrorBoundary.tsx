import React from "react";

interface GlobalErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class GlobalErrorBoundary extends React.Component<React.PropsWithChildren, GlobalErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, message: "Unexpected UI error" };
  }

  static getDerivedStateFromError(error: Error): GlobalErrorBoundaryState {
    return { hasError: true, message: error.message || "Unexpected UI error" };
  }

  componentDidCatch(error: Error): void {
    // Keep logging centralized and non-blocking for production diagnostics.
    console.error("Global UI error", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="card w-full max-w-xl text-center">
            <h1 className="text-xl font-semibold text-red-300">Application Error</h1>
            <p className="mt-2 text-sm text-slate-300">{this.state.message}</p>
            <button className="btn mt-4" onClick={() => window.location.reload()}>
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
