import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="glass-panel"
          style={{
            padding: '36px',
            borderRadius: '24px',
            maxWidth: '680px',
            margin: '40px auto',
            textAlign: 'center',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(254, 242, 242, 0.85))',
            boxShadow: '0 12px 36px rgba(239, 68, 68, 0.12)'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}
          >
            <AlertTriangle size={28} />
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 850, color: 'var(--text-dark, #0f172a)', margin: '0 0 8px' }}>
            {this.props.title || 'Unable to display this view'}
          </h2>

          <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '13.5px', margin: '0 0 20px', lineHeight: 1.5 }}>
            {this.state.error?.message || 'A temporary rendering issue occurred. Please retry or navigate back.'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {this.props.onBack && (
              <button
                className="btn-secondary"
                onClick={this.props.onBack}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', fontWeight: 700 }}
              >
                <ArrowLeft size={16} /> Back to Reports
              </button>
            )}

            <button
              className="btn-primary"
              onClick={this.handleReset}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', fontWeight: 700 }}
            >
              <RefreshCw size={16} /> Retry View
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
