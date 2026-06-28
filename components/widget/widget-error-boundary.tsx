"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class WidgetErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      const invalidKey = this.state.error.message.includes("Invalid embed key");
      return (
        <div className="flex h-full items-center justify-center p-6 text-center text-sm">
          <div className="max-w-sm space-y-2">
            <p className="font-medium">
              {invalidKey ? "This chat widget is misconfigured" : "Something went wrong"}
            </p>
            <p className="text-muted-foreground text-xs">
              {invalidKey
                ? "The embed key in your site snippet does not match your Zencom workspace. Copy the current key from Dashboard → Install and update the data-key attribute."
                : this.state.error.message}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
