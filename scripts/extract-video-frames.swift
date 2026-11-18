// Mengambil SEMUA frame dari sebuah video (bahan mentah untuk frame sequence).
// Pakai: swift scripts/extract-video-frames.swift <video> <folder-output>
// Hasil: <folder-output>/v0000.png, v0001.png, ...
import AVFoundation
import AppKit

let args = CommandLine.arguments
guard args.count >= 3 else { print("Pakai: swift extract-video-frames.swift <video> <folder-output>"); exit(1) }
let url = URL(fileURLWithPath: args[1])
let out = args[2]
try? FileManager.default.createDirectory(atPath: out, withIntermediateDirectories: true)

let asset = AVURLAsset(url: url)
guard let track = asset.tracks(withMediaType: .video).first else { print("tidak ada video track"); exit(1) }
let fps = Double(track.nominalFrameRate)
let dur = CMTimeGetSeconds(asset.duration)
let size = track.naturalSize
print(String(format: "durasi %.2f s, %.2f fps, %.0fx%.0f", dur, fps, size.width, size.height))

let reader = try! AVAssetReader(asset: asset)
let output = AVAssetReaderTrackOutput(track: track, outputSettings: [
  kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
])
reader.add(output)
reader.startReading()
var i = 0
let ctx = CIContext()
while let sample = output.copyNextSampleBuffer() {
  guard let pb = CMSampleBufferGetImageBuffer(sample) else { continue }
  let ci = CIImage(cvPixelBuffer: pb)
  if let cg = ctx.createCGImage(ci, from: ci.extent) {
    let rep = NSBitmapImageRep(cgImage: cg)
    let data = rep.representation(using: .png, properties: [:])!
    try! data.write(to: URL(fileURLWithPath: String(format: "%@/v%04d.png", out, i)))
  }
  i += 1
}
print("frame:", i)
