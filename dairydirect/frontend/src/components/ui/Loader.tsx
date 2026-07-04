import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export interface LoaderProps extends React.SVGAttributes<SVGSVGElement> {
  size?: number | string;
}

function Loader({ className, size = 24, ...props }: LoaderProps) {
  return (
    <Loader2
      size={size}
      className={cn("animate-spin text-primary", className)}
      {...props}
    />
  )
}

export { Loader }
