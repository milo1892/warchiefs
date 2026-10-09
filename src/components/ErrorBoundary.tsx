import { Component, type ErrorInfo, type ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Warchiefs interface failed:', error, info); }
  render() {
    if (this.state.error) return <main className="app"><div role="alert" className="error">
      <h1>The interface stopped</h1><p>{this.state.error.message}</p>
      <p>Committed saves remain in browser storage. Reload to reopen a campaign.</p>
      <button onClick={() => window.location.reload()}>Reload</button>
    </div></main>;
    return this.props.children;
  }
}
