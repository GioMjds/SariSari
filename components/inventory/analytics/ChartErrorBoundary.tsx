import React from 'react';
import { View } from 'react-native';
import { StyledText } from '@/components/elements';

/**
 * Error boundary for `react-native-gifted-charts` renders.
 *
 * Why: this library mounts SVG `<foreignObject>` trees that, in combination
 * with `react-native-pager-view`'s view recycling on Android, have been
 * observed to crash during tab swipe transitions. Isolating the chart renders
 * behind a boundary converts a hard JS crash into a recoverable empty state.
 *
 * Usage:
 *   <ChartErrorBoundary>
 *     <BarChart data={...} />
 *   </ChartErrorBoundary>
 *
 * On error, the boundary renders the same `ChartEmptyState` UI used by the
 * analytics screen for the no-data case so the surrounding layout stays
 * intact and the user can recover by switching tabs and back.
 */
interface ChartErrorBoundaryProps {
  children: React.ReactNode;
  message?: string;
}

interface ChartErrorBoundaryState {
  hasError: boolean;
}

export class ChartErrorBoundary extends React.Component<
  ChartErrorBoundaryProps,
  ChartErrorBoundaryState
> {
  override state: ChartErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ChartErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    if (__DEV__) {
      console.warn(
        '[ChartErrorBoundary] Chart render failed:',
        error.message,
        info.componentStack,
      );
    }
  }

  override render() {
    if (this.state.hasError) {
      return (
        <View className="py-6 items-center">
          <StyledText
            variant="regular"
            className="text-xs text-ink-500 text-center"
          >
            {this.props.message ?? 'Chart unavailable. Pull to retry.'}
          </StyledText>
        </View>
      );
    }
    return this.props.children;
  }
}