import React, { type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error: error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });

    if (import.meta.env.MODE !== "production") {
      console.error("ErrorBoundary caught an error:", error);
      console.error("ErrorBoundary stack trace:", errorInfo.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h1>Something went wrong!</h1>
          <p>Please try again later.</p>
          {this.state.error && (
            <pre
              style={{
                color: "red",
                textAlign: "left",
                maxWidth: "600px",
                margin: "0 auto",
              }}
            >
              <strong>Error:</strong> {this.state.error.toString()}
            </pre>
          )}
          {this.state.errorInfo && (
            <details
              style={{
                whiteSpace: "pre-wrap",
                textAlign: "left",
                maxWidth: "600px",
                margin: "1rem auto",
              }}
            >
              <summary style={{ cursor: "pointer" }}>Stack Trace</summary>
              {this.state.errorInfo.componentStack}
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
