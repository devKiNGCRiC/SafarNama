import React from "react";
import { Link, useLocation } from "react-router-dom";

class Boundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error("Page crashed:", error, info?.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div style={{ padding: "120px 20px", textAlign: "center" }}>
        <h2>Something went wrong on this page</h2>
        <p>The rest of the site is fine. Try again, or go back to the home page.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{ marginRight: 12, padding: "8px 18px", cursor: "pointer" }}
        >
          Reload
        </button>
        <Link to="/home">Go to Home</Link>
      </div>
    );
  }
}

// One page crashing must not blank the whole app. Keyed by path so moving to another
// page clears the error automatically.
const RoutedErrorBoundary = ({ children }) => {
  const { pathname } = useLocation();
  return <Boundary key={pathname}>{children}</Boundary>;
};

export default RoutedErrorBoundary;
