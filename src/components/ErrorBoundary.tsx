import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600">
            <AlertCircle className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-neutral-900">Algo salió mal</h2>
            <p className="text-neutral-500 max-w-md mx-auto">
              Ocurrió un error inesperado. Por favor, intenta recargar la página.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white font-bold rounded-2xl hover:bg-neutral-800 transition-all"
          >
            <RefreshCcw className="w-5 h-5" />
            Recargar Página
          </button>
          {process.env.NODE_ENV === "development" && (
            <pre className="mt-8 p-4 bg-neutral-100 rounded-xl text-left text-xs text-red-600 overflow-auto max-w-full">
              {this.state.error?.message}
            </pre>
          )}
        </div>
      );
    }

    return (this as any).props.children;
  }
}
