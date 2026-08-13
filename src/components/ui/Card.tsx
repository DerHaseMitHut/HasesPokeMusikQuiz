import type { HTMLAttributes } from 'react'

export default function Card({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`rounded-2xl p-px bg-gradient-to-br from-poke-yellow-400/35 via-poke-red-500/20 to-poke-blue-500/35 ${className}`}
    >
      <div className="rounded-[15px] bg-stage-800/90 backdrop-blur-sm h-full">{children}</div>
    </div>
  )
}
