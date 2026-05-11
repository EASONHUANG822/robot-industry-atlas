"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type MapErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
};

type MapErrorBoundaryState = {
  hasError: boolean;
};

export class MapErrorBoundary extends Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  state: MapErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): MapErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Map rendering failed", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
