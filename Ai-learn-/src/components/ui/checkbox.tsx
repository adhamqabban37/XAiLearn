"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

type NativeCheckboxProps = React.ComponentPropsWithoutRef<"input"> & {
  onCheckedChange?: (checked: boolean) => void
}

// Lightweight, stable checkbox to avoid Radix ref composition loops in React 19
export const Checkbox = React.forwardRef<HTMLInputElement, NativeCheckboxProps>(
  ({ className, onChange, onCheckedChange, checked, defaultChecked, ...props }, ref) => {
    return (
      <span className={cn("inline-flex items-center", className)}>
        <input
          ref={ref}
          type="checkbox"
          className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none data-[state=checked]:bg-primary",
            "checked:bg-primary checked:text-primary-foreground"
          )}
          checked={checked}
          defaultChecked={defaultChecked}
          onChange={(e) => {
            onChange?.(e)
            onCheckedChange?.(e.currentTarget.checked)
          }}
          {...props}
        />
        {/* Visual check indicator */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none -ml-4 flex h-4 w-4 items-center justify-center text-current",
            "opacity-0 peer-checked:opacity-100 transition-opacity"
          )}
        >
          <Check className="h-4 w-4" />
        </span>
      </span>
    )
  }
)
Checkbox.displayName = "Checkbox"

export default Checkbox
