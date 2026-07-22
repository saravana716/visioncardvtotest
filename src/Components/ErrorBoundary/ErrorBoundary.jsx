import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          fontFamily: 'Poppins, system-ui, sans-serif',
          background: '#fafafa',
        }}>
          <div style={{
            maxWidth: '480px',
            textAlign: 'center',
            background: '#fff',
            padding: '40px 32px',
            borderRadius: '12px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}>
            <h1 style={{ fontSize: '22px', margin: '0 0 12px', color: '#001529' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#666', fontSize: '14px', margin: '0 0 24px', lineHeight: 1.5 }}>
              An unexpected error stopped this page from rendering. You can reload
              the page or head back to the homepage.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '10px 20px',
                  background: '#001529',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Reload page
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  padding: '10px 20px',
                  background: '#fff',
                  color: '#001529',
                  border: '1px solid #001529',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Go home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
