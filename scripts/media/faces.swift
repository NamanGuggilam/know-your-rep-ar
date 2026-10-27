import AVFoundation
import Foundation
import Vision

// Prints JSON samples [{ "t": seconds, "x": normalized center x or null }] of the main speaker's face,
// falling back to the upper body when no face is found (turned away, motion blur).
// Usage: swift faces.swift <video> [stepSeconds]

let arguments = CommandLine.arguments
guard arguments.count >= 2 else {
  FileHandle.standardError.write("usage: faces.swift <video> [stepSeconds]\n".data(using: .utf8)!)
  exit(2)
}
let asset = AVURLAsset(url: URL(fileURLWithPath: arguments[1]))
let step = arguments.count >= 3 ? Double(arguments[2])! : 0.2
let duration = CMTimeGetSeconds(asset.duration)

let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.maximumSize = CGSize(width: 960, height: 540)
generator.requestedTimeToleranceBefore = CMTime(seconds: 0.02, preferredTimescale: 600)
generator.requestedTimeToleranceAfter = CMTime(seconds: 0.02, preferredTimescale: 600)

func largest(_ boxes: [CGRect]) -> CGRect? {
  boxes.max { $0.width * $0.height < $1.width * $1.height }
}

var samples: [String] = []
var time = 0.0
while time < duration {
  var center = "null"
  if let image = try? generator.copyCGImage(at: CMTime(seconds: time, preferredTimescale: 600), actualTime: nil) {
    let faces = VNDetectFaceRectanglesRequest()
    let bodies = VNDetectHumanRectanglesRequest()
    bodies.upperBodyOnly = true
    try? VNImageRequestHandler(cgImage: image).perform([faces, bodies])
    let box = largest((faces.results ?? []).map(\.boundingBox)) ?? largest((bodies.results ?? []).map(\.boundingBox))
    if let box { center = String(format: "%.4f", box.midX) }
  }
  samples.append("{\"t\":\(String(format: "%.2f", time)),\"x\":\(center)}")
  time += step
}
print("[" + samples.joined(separator: ",") + "]")
