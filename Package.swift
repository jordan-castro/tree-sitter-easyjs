// swift-tools-version:5.3
import PackageDescription

let package = Package(
    name: "TreeSitterEasyJS",
    products: [
        .library(name: "TreeSitterEasyJS", targets: ["TreeSitterEasyJS"]),
    ],
    dependencies: [
        .package(url: "https://github.com/ChimeHQ/SwiftTreeSitter", from: "0.8.0"),
    ],
    targets: [
        .target(
            name: "TreeSitterEasyJS",
            dependencies: [],
            path: ".",
            sources: [
                "src/parser.c",
                // NOTE: if your language has an external scanner, add it here.
            ],
            resources: [
                .copy("queries")
            ],
            publicHeadersPath: "bindings/swift",
            cSettings: [.headerSearchPath("src")]
        ),
        .testTarget(
            name: "TreeSitterEasyJSTests",
            dependencies: [
                "SwiftTreeSitter",
                "TreeSitterEasyJS",
            ],
            path: "bindings/swift/TreeSitterEasyJSTests"
        )
    ],
    cLanguageStandard: .c11
)
