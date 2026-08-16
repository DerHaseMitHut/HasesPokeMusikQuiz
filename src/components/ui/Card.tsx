import type { HTMLAttributes } from 'react'

export default function Card({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`holo-border rounded-2xl p-px ${className}`}
    >
      <div className="rounded-[15px] bg-stage-800/90 backdrop-blur-sm h-full">{children}</div>
    </div>
  )
}
