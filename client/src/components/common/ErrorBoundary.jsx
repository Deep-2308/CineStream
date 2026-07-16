import { Component } from 'react';
import ErrorState from '../ui/ErrorState.jsx';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          title="Something went wrong"
          message="An unexpected error occurred. Please try refreshing the page."
          onRetry={this.handleReset}
        />
      );
    }
    return this.props.children;
  }
}
