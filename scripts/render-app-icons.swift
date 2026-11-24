// Regenerates the app icon, launch screen and web icon PNGs from the HAWConnect mark.
// Usage: swift scripts/render-app-icons.swift   (run from the repository root)
import AppKit

let mark = """
<path d="M10 37V20a10 10 0 0 1 20 0v8c-8 1-15 4-20 9Z" fill="currentColor"/>\
<path d="M20 80V58c0-17 15-20 30-12s30 9 30-13V20" fill="none" stroke="currentColor" stroke-width="20" stroke-linecap="round"/>\
<path d="M70 68c8-2 15-6 20-12v24a10 10 0 0 1-20 0Z" fill="currentColor"/>
"""

/// Renders the mark at `scale` (1 = 80% of the canvas, as in the splash) centred in a square PNG.
func render(_ path: String, px: Int, color: String, background: String? = nil, scale: Double) throws {
	let offset = 50 - 50 * scale
	let bg = background.map { "<rect width=\"100\" height=\"100\" fill=\"\($0)\"/>" } ?? ""
	let svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\(bg)<g transform=\"translate(\(offset) \(offset)) scale(\(scale))\" color=\"\(color)\">\(mark)</g></svg>"
	let tmp = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent("mark-\(UUID().uuidString).svg")
	try svg.write(to: tmp, atomically: true, encoding: .utf8)
	defer { try? FileManager.default.removeItem(at: tmp) }
	guard let image = NSImage(contentsOf: tmp),
		let rep = NSBitmapImageRep(
			bitmapDataPlanes: nil, pixelsWide: px, pixelsHigh: px, bitsPerSample: 8,
			samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
			colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)
	else { throw NSError(domain: "render", code: 1) }
	NSGraphicsContext.saveGraphicsState()
	NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
	NSColor.clear.set()
	NSRect(x: 0, y: 0, width: px, height: px).fill()
	image.draw(in: NSRect(x: 0, y: 0, width: px, height: px))
	NSGraphicsContext.restoreGraphicsState()
	try rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: path))
}

let assets = "src/assets/hawconnect"
let purple = "#40296C", lilac = "#AC97D3", night = "#141019"
// iOS icons are opaque: light = mark on purple, dark = lilac mark on night, tinted = grayscale.
try render("\(assets)/icon.png", px: 1024, color: "#FFFFFF", background: purple, scale: 0.76)
try render("\(assets)/icon-dark.png", px: 1024, color: lilac, background: night, scale: 0.76)
try render("\(assets)/icon-tinted.png", px: 1024, color: "#FFFFFF", background: "#202020", scale: 0.76)
// Android adaptive foreground: transparent, mark inside the safe zone, on the #40296C background colour.
try render("\(assets)/foreground.png", px: 1024, color: "#FFFFFF", scale: 0.6)
// Launch screens: transparent mark; light screen uses the purple mark, dark screen the lilac mark.
try render("\(assets)/splash-light.png", px: 1024, color: purple, scale: 1)
try render("\(assets)/splash-dark.png", px: 1024, color: lilac, scale: 1)
try render("\(assets)/logo-transparent.png", px: 1024, color: purple, scale: 1)
// Web favicon/PWA icons: white mark on purple, matching the website icon.
try render("public/hawconnect-icon-512.png", px: 512, color: "#FFFFFF", background: purple, scale: 0.76)
try render("public/hawconnect-icon-192.png", px: 192, color: "#FFFFFF", background: purple, scale: 0.76)
