import { cn } from '@/lib/utils'

export function Card({ children, className, ...props }) {
  return (
    <div
      className={cn('glass-strong rounded-xl p-6 shadow-xl', className)}
      {...props}
    >
      {children}
    </div>
  )
}
