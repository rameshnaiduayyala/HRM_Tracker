import React, { Component } from 'react';
import { AlertOctagon, RotateCw, Home } from 'lucide-react';
import Button from './Button';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an exception:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#111827] border border-gray-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
            
            {/* Warning Icon */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-red-950/40 border border-red-800 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/5">
              <AlertOctagon className="w-8 h-8" />
            </div>

            {/* Error Message Header */}
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Something went wrong</h2>
              <p className="text-sm text-gray-400">
                A system exception occurred while rendering this workspace interface.
              </p>
            </div>

            {/* Collapsible details wrapper */}
            {this.state.error && (
              <div className="text-left bg-gray-900 border border-gray-800 rounded-xl p-4 overflow-x-auto max-h-40">
                <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider block mb-1">
                  Exception Stack
                </span>
                <code className="text-xs font-mono text-gray-300 block leading-relaxed break-words">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            {/* Recovery actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button 
                onClick={this.handleReset} 
                className="flex-1 py-2.5 text-xs"
              >
                <RotateCw className="w-4 h-4" /> Reload Workspace
              </Button>
              <Button 
                variant="secondary"
                onClick={() => { window.location.href = '/'; }} 
                className="py-2.5 px-4 text-xs"
              >
                <Home className="w-4 h-4" /> Portal Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
