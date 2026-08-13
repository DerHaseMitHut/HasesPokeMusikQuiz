// Wandelt einen VDO.Ninja-Push-Link (den die Person selbst beim Einrichten ihrer Kamera
// auf vdo.ninja bekommt) in den passenden View-Link zum Einbetten um. Ist bereits ein
// View-Link (oder irgendeine andere URL) eingetragen, wird sie unverändert übernommen.
export function normalizeVdoUrl(url: string | null | undefined): string {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('vdo.ninja') && !parsed.searchParams.has('view') && parsed.searchParams.has('push')) {
      return `https://vdo.ninja/?view=${encodeURIComponent(parsed.searchParams.get('push')!)}&cleanoutput&transparent&autoplay`
    }
    return url
  } catch {
    return url
  }
}
