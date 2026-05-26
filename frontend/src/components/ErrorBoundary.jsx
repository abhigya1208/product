import { Component } from 'react';

/**
 * ErrorBoundary – catches rendering errors in child components and shows
 * a friendly fallback UI instead of a blank white page.
 *
 * Usage:  <ErrorBoundary>  <YourComponent />  </ErrorBoundary>
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              An unexpected error occurred while rendering this section.
              You can try reloading or contact support if the problem persists.
            </p>

            {/* Show error details in development */}
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                <summary className="cursor-pointer text-sm font-semibold text-red-700">
                  Error Details (Dev Only)
                </summary>
                <pre className="mt-2 text-xs text-red-600 whitespace-pre-wrap overflow-auto max-h-48">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
