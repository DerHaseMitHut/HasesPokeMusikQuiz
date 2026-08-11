export default function PagePlaceholder({ title, note }: { title: string; note: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-3xl font-700 mb-2">{title}</h1>
      <p className="text-white/50">{note}</p>
    </div>
  )
}
