import XCTest
import SwiftTreeSitter
import TreeSitterEasyJS

final class TreeSitterEasyJSTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_easyjs())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading EasyJS grammar")
    }
}
