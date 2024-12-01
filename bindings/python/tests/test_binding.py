from unittest import TestCase

import tree_sitter, tree_sitter_easyjs


class TestLanguage(TestCase):
    def test_can_load_grammar(self):
        try:
            tree_sitter.Language(tree_sitter_easyjs.language())
        except Exception:
            self.fail("Error loading EasyJS grammar")
