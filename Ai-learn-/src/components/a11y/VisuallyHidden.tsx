import * as React from "react";

// Visually hide content while keeping it accessible to screen readers
// Similar to Tailwind's sr-only but as a component for dynamic content
export const VisuallyHidden = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ style, className, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={className}
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: 0,
        ...style,
      }}
      {...props}
    />
  );
});
VisuallyHidden.displayName = "VisuallyHidden";
