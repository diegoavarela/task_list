import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-slate-900 text-white shadow-lg hover:bg-slate-800 hover:shadow-xl backdrop-blur-sm border border-slate-200/20",
        destructive:
          "bg-red-500 text-white shadow-lg hover:bg-red-600 hover:shadow-xl backdrop-blur-sm border border-red-200/20",
        outline:
          "border border-slate-200 bg-white/80 backdrop-blur-sm hover:bg-white hover:text-slate-900 hover:border-slate-300 shadow-sm hover:shadow-md",
        secondary:
          "bg-slate-100 text-slate-900 hover:bg-slate-200 shadow-sm hover:shadow-md backdrop-blur-sm border border-slate-200/50",
        ghost: "hover:bg-slate-100/80 hover:text-slate-900 backdrop-blur-sm",
        link: "text-slate-600 underline-offset-4 hover:underline hover:text-slate-900",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
