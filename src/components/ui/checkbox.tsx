"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

type NativeCheckboxProps = Omit<React.ComponentPropsWithoutRef<"input">, "size"> & {
  onCheckedChange?: (checked: boolean) => void
  size?: "default" | "large"
}

// Lightweight, stable checkbox to avoid Radix ref composition loops in React 19
export const Checkbox = React.forwardRef<HTMLInputElement, NativeCheckboxProps>(
  ({ className, onChange, onCheckedChange, checked, defaultChecked, size = "default", ...props }, ref) => {
    const sizeClasses = size === "large" 
      ? "h-6 w-6 sm:h-7 sm:w-7" 
      : "h-4 w-4"
    const checkSizeClasses = size === "large"
      ? "h-6 w-6 sm:h-7 sm:w-7"
      : "h-4 w-4"
    const iconSizeClasses = size === "large"
      ? "h-4 w-4 sm:h-5 sm:w-5"
      : "h-4 w-4"

    return (
      <span className={cn("inline-flex items-center justify-center relative", className)}>
        <input
          ref={ref}
          type="checkbox"
          className={cn(
            "peer shrink-0 rounded-md border-2 border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer relative z-10",
            "checked:bg-primary checked:border-primary checked:text-primary-foreground",
            "hover:border-primary/80 hover:bg-primary/10 transition-all duration-200",
            "active:scale-95 touch-manipulation",
            sizeClasses
          )}
          checked={checked}
          defaultChecked={defaultChecked}
          onChange={(e) => {
            e.stopPropagation()
            onChange?.(e)
            onCheckedChange?.(e.currentTarget.checked)
          }}
          onClick={(e) => {
            e.stopPropagation()
          }}
          {...props}
        />
        {/* Visual check indicator - positioned absolutely over the checkbox */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 flex items-center justify-center text-primary-foreground",
            "opacity-0 peer-checked:opacity-100 transition-opacity duration-200 z-20"
          )}
        >
          <Check className={cn("stroke-[3]", iconSizeClasses)} />
        </span>
      </span>
    )
  }
)
Checkbox.displayName = "Checkbox"

export default Checkbox
