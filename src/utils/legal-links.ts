/**
 * Legal pages are maintained on hawconnect.de (repository hawconnect-docs) and
 * shared by every HAWConnect surface. The app only links to them.
 */
export type LegalPage = 'privacy' | 'imprint' | 'terms'

export const LEGAL_PAGES: readonly LegalPage[] = ['privacy', 'imprint', 'terms']

/** German pages for German app languages, English for everything else. */
export function legalUrl(page: LegalPage, language?: string): string {
	const lang = language?.toLowerCase().startsWith('de') ? 'de' : 'en'
	return `https://hawconnect.de/${lang}/legal/${page}`
}
