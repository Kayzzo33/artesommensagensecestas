import React from "react";
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#FFF9F0] group-[.toaster]:text-[#1A1A1A] group-[.toaster]:border-[#E4E3E0] group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-sans",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground font-sans",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
