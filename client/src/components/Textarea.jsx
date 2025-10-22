import { cn } from '@/lib/utils'
import { useEffect, useRef } from 'react'

export function Textarea({ className, value, autoResize = true, ...props }) {
  const textareaRef = useRef(null)

  useEffect(() => {
    if (autoResize && textareaRef.current) {
      // Скидаємо висоту для правильного розрахунку
      textareaRef.current.style.height = 'auto'
      // Встановлюємо нову висоту на основі scrollHeight
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [value, autoResize])

  return (
    <textarea
      ref={textareaRef}
      value={value}
      className={cn(
        'flex min-h-[80px] w-full rounded-lg glass-strong px-3 py-2 text-sm',
        'placeholder:text-muted-foreground',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'resize-none overflow-hidden',
        className
      )}
      {...props}
    />
  )
}
