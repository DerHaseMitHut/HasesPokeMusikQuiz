// Wandelt einen VDO.Ninja-Push- oder View-Link (den die Person beim Einrichten ihrer Kamera
// auf vdo.ninja bekommt) in einen kanonischen, für das Einbetten passenden View-Link um.
// Immer neu mit unseren eigenen "clean"-Flags zusammengebaut (statt evtl. vorhandene Flags
// des eingefügten Links zu übernehmen) -- sonst zeigt VDO.Ninja je nach Link eigene
// Player-Controls (Play/Pause, Lautstärke, Vollbild) und ein "Video herausholen"-PiP-Overlay,
// die in einer eingebetteten Kamera-Kachel nur stören.
export function normalizeVdoUrl(url: string | null | undefined): string {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    if (!parsed.hostname.includes('vdo.ninja')) return url

    const streamId = parsed.searchParams.get('view') ?? parsed.searchParams.get('push')
    if (!streamId) return url

    return `https://vdo.ninja/?view=${encodeURIComponent(streamId)}&cleanoutput&transparent&autoplay&controls=0`
  } catch {
    return url
  }
}
