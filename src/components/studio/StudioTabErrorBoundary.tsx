import * as React from 'react';
import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { StudioTab } from './types';

interface StudioTabErrorBoundaryProps {
  children: ReactNode;
  activeTab: StudioTab;
  onResetTab?: () => void;
  onReturnToApp?: () => void;
}

interface StudioTabErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Resilient Error Boundary for Studio workspace tabs.
 * Traps runtime exceptions within active tab views without unmounting StudioLayout,
 * ensuring the top header, navigation sidebar, and "Back to App" button remain fully accessible.
 */
export class StudioTabErrorBoundary extends Component<
  StudioTabErrorBoundaryProps,
  StudioTabErrorBoundaryState
> {
  constructor(props: StudioTabErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): StudioTabErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[StudioTabErrorBoundary] Trapped error in Studio tab:', error, errorInfo);
  }

  componentDidUpdate(prevProps: StudioTabErrorBoundaryProps): void {
    // Automatically clear error state when user switches tabs in sidebar
    if (prevProps.activeTab !== this.props.activeTab && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-2xl mx-auto my-8 p-6 sm:p-8 bg-white border border-[#E5E3DB] rounded-3xl shadow-sm space-y-5 font-sans">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF8E1] border border-[#FFE082] flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-[#C5A059]" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1E2E20]">
                Workspace Module Notice
              </h3>
              <p className="text-xs font-mono text-[#8C8A7D]">
                Tab [{this.props.activeTab}] encountered an unexpected view error.
              </p>
            </div>
          </div>

          <div className="p-4 bg-[#FAF9F5] border border-[#E5E3DB] rounded-2xl font-mono text-xs text-[#8C8A7D] break-words">
            <p className="text-[#1E2E20] font-bold mb-1">Recoverable Session:</p>
            <p className="line-clamp-3 text-[11px]">
              {this.state.error?.message || 'An unexpected rendering error occurred in this module.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={this.handleRetry}
              className="px-4 py-2.5 rounded-xl bg-[#23251E] hover:bg-[#32352B] active:bg-[#1E2E20] text-white font-mono text-xs font-bold uppercase flex items-center gap-2 cursor-pointer transition-all shadow-xs"
            >
              <RotateCcw size={14} className="text-[#C5A059]" />
              <span>Retry Tab</span>
            </button>

            {this.props.onResetTab && (
              <button
                type="button"
                onClick={this.props.onResetTab}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF9F5] active:bg-[#F2EFE9] text-[#1E2E20] border border-[#E5E3DB] font-mono text-xs font-bold uppercase flex items-center gap-2 cursor-pointer transition-all"
              >
                <LayoutDashboard size={14} className="text-[#8C8A7D]" />
                <span>Return to Dashboard</span>
              </button>
            )}

            {this.props.onReturnToApp && (
              <button
                type="button"
                onClick={this.props.onReturnToApp}
                className="px-4 py-2.5 rounded-xl bg-[#800020] hover:bg-[#660019] text-white font-mono text-xs font-bold uppercase flex items-center gap-2 cursor-pointer transition-all shadow-xs"
              >
                <ArrowLeft size={14} />
                <span>Back to App</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
