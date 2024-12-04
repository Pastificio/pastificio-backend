import * as React from "react";
import { ToastProvider as RadixToastProvider } from "@radix-ui/react-toast";

export function ToastProvider({ children }) {
  return (
    <RadixToastProvider swipeDirection="right">
      {children}
      <ToastViewport />
    </RadixToastProvider>
  );
}

const ToastViewport = React.forwardRef(({ className, ...props }, ref) => (
  <RadixToastProvider.Viewport
    ref={ref}
    className="fixed bottom-0 right-0 p-6 gap-2 flex flex-col z-50"
    {...props}
  />
));