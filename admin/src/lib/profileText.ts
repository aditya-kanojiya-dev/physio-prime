// Shared by the doctor profile form (ProfilePage) and the admin doctor ledger
// so both round-trip the exact same on-disk shape instead of inventing a second
// format: lists are comma separated, experience is "Role | Institution | Period"
// per line.
export function splitList(value: string): string[] {
  return value.split(',').map((s) => s.trim()).filter(Boolean)
}

export function splitLines(value: string): string[] {
  return value.split('\n').map((s) => s.trim()).filter(Boolean)
}

type LooseEntry = { role?: string | null; institution?: string | null; period?: string | null }

export function experienceToText(entries: readonly unknown[] | null | undefined): string {
  return (entries ?? []).map((raw) => {
    const e = (raw ?? {}) as LooseEntry
    return `${e.role ?? ''} | ${e.institution ?? ''} | ${e.period ?? ''}`
  }).join('\n')
}

export interface ExperienceEntry {
  role: string
  institution: string
  period: string
}

export function experienceFromText(text: string): ExperienceEntry[] {
  return splitLines(text).map((line) => {
    const [role, institution, period] = line.split('|').map((s) => s.trim())
    return { role: role || '', institution: institution || '', period: period || '' }
  })
}
