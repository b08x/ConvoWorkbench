import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/src/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const variants = {
      default: "bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90",
      outline: "border border-zinc-200 bg-white hover:bg-zinc-100 hover:text-zinc-900",
      ghost: "hover:bg-zinc-100 hover:text-zinc-900",
      secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-100/80",
    }
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2",
          variants[variant],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
