import { Component } from "react";
import { Brain } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#0B0D12" }}>
          <div className="text-center max-w-sm">
            <div className="w-12 h-12 rounded-xl bg-red-900/20 flex items-center justify-center mx-auto mb-4">
              <Brain size={24} className="text-red-400" />
            </div>
            <h1 className="text-lg font-semibold text-[#F1F1F3] mb-2">Something went wrong</h1>
            <p className="text-sm text-[#5D616C] mb-4">An unexpected error occurred. Try refreshing the page.</p>
            <button onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm font-medium transition-colors">
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
