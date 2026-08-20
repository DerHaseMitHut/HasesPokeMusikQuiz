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

    // &muted ist entscheidend, nicht nur Geschmackssache: Audio läuft ohnehin separat über
    // Discord, und ohne &muted blockieren Browser Autoplay-mit-Ton ohne Nutzergeste -- VDO.Ninja
    // fällt dann auf eine manuelle "Klick zum Abspielen"-UI zurück, die wir mit &controls=0 aber
    // gerade ausblenden, sodass das Bild ohne &muted an einem Standbild hängen bleibt.
    return `https://vdo.ninja/?view=${encodeURIComponent(streamId)}&cleanoutput&transparent&autoplay&controls=0&muted`
  } catch {
    return url
  }
}
