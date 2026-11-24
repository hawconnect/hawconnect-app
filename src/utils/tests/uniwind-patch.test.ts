import { describe, expect, it } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = join(
	import.meta.dir,
	'..',
	'..',
	'..',
	'node_modules/uniwind/src/components/native'
)

describe('uniwind Outfit patch', () => {
	it('is applied to the installed package', () => {
		expect(existsSync(join(dir, 'outfit.ts'))).toBe(true)
		for (const file of ['Text.tsx', 'TextInput.tsx']) {
			const source = readFileSync(join(dir, file), 'utf8')
			expect(source).toContain('withOutfit')
			expect(source).toContain('useSystemFont()')
		}
		expect(readFileSync(join(dir, 'outfit.ts'), 'utf8')).toContain(
			"Symbol.for('hawconnect.interfaceFont')"
		)
	})
})
