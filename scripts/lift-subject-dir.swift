// Hapus latar SEMUA gambar di sebuah folder dengan "lift subject" macOS (Vision, macOS 14+).
// Ukuran kanvas tetap (tidak dipotong) → posisi karakter antar-frame tetap bisa dilacak.
// Pakai: swift scripts/lift-subject-dir.swift <folder-in> <folder-out>
import AppKit
import CoreImage
import Vision

let args = CommandLine.arguments
let inDir = args[1], outDir = args[2]
try? FileManager.default.createDirectory(atPath: outDir, withIntermediateDirectories: true)
let files = try FileManager.default.contentsOfDirectory(atPath: inDir).filter { $0.hasSuffix(".png") }.sorted()
let ctx = CIContext()
var ok = 0
for f in files {
  guard let img = NSImage(contentsOfFile: "\(inDir)/\(f)"),
        let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { continue }
  let handler = VNImageRequestHandler(cgImage: cg)
  let req = VNGenerateForegroundInstanceMaskRequest()
  try? handler.perform([req])
  let outURL = URL(fileURLWithPath: "\(outDir)/\(f)")
  if let obs = req.results?.first,
     let buf = try? obs.generateMaskedImage(ofInstances: obs.allInstances, from: handler, croppedToInstancesExtent: false) {
    let ci = CIImage(cvPixelBuffer: buf)
    if let out = ctx.createCGImage(ci, from: ci.extent) {
      try NSBitmapImageRep(cgImage: out).representation(using: .png, properties: [:])!.write(to: outURL)
      ok += 1
      continue
    }
  }
  // tidak ada subjek (mis. karakter sudah keluar layar) → frame kosong transparan
  let empty = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: cg.width, pixelsHigh: cg.height, bitsPerSample: 8,
                               samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
  try empty.representation(using: .png, properties: [:])!.write(to: outURL)
}
print("ok \(ok)/\(files.count)")
