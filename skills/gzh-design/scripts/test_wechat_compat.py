"""微信兼容性回归：真实触发结构、误报边界及命令退出码。"""

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from validate_gzh_html import validate
from component_lint import lint_file
from wechat_compat import check_compatibility

ROOT = Path(__file__).resolve().parent.parent


class CompatibilityTests(unittest.TestCase):
    def test_logical_align_is_error_even_on_nested_span(self):
        for value in ("start", "end", "START !important"):
            with self.subTest(value=value):
                result = check_compatibility(
                    f'<section style="text-align:left"><span style="text-align:{value}">中文</span></section>')
                self.assertEqual([level for level, _ in result], ["ERROR"])
                self.assertIn("text-align-logical", result[0][1])

    def test_missing_root_alignment_warns_only_for_article(self):
        html = '<!--注释--><section><p style="text-align:left">中文</p></section>'
        self.assertEqual(check_compatibility(html), [])
        self.assertIn("root-text-align", check_compatibility(html, check_root=True)[0][1])

    def test_physical_alignment_and_centered_title_are_allowed(self):
        for value in ("left", "right", "center", "justify"):
            with self.subTest(value=value):
                self.assertEqual(check_compatibility(
                    f'<section style="text-align:{value}"><p style="text-align:center">标题</p></section>',
                    check_root=True), [])

    def test_gradient_detects_descendant_text_in_any_language(self):
        for gradient in ("linear-gradient(transparent 73%,#F2DFC5 73%)",
                         "radial-gradient(white, blue)",
                         "repeating-linear-gradient(white, blue)"):
            with self.subTest(gradient=gradient):
                result = check_compatibility(
                    f'<section style="background-image:{gradient}"><br><span>AI</span></section>')
                self.assertEqual(len(result), 1)
                self.assertIn("darkmode-no-gradient", result[0][1])

    def test_empty_gradient_before_text_is_not_a_text_background(self):
        html = ('<section style="text-align:left">'
                '<span style="background:linear-gradient(white,blue)"><span leaf=""><br></span></span>'
                '<p>正文</p></section>')
        self.assertEqual(check_compatibility(html, check_root=True), [])

    def test_html_void_and_self_closing_tags_do_not_leak_ancestry(self):
        html = ('<section style="text-align:left">'
                '<img style="background:linear-gradient(white,blue)" src="demo">'
                '<span style="background:linear-gradient(white,blue)"/>'
                '<p>正文</p></section>')
        self.assertEqual(check_compatibility(html, check_root=True), [])

    def test_comments_script_and_attribute_text_are_not_visible_text(self):
        html = ('<section style="background:linear-gradient(white,blue)">'
                '<!--说明--><script>demo()</script><img alt="说明" src="demo"></section>')
        self.assertEqual(check_compatibility(html), [])

    def test_css_final_value_and_important_are_respected(self):
        for style in ("text-align:start;text-align:left",
                      "text-align:left!important;text-align:start",
                      "background:linear-gradient(white,blue);background:white",
                      "background-image:linear-gradient(white,blue);background-image:none"):
            with self.subTest(style=style):
                self.assertEqual(check_compatibility(f'<section style="{style}">中文</section>'), [])
        result = check_compatibility(
            '<section style="background-image:linear-gradient(white,blue)!important;background:white">中文</section>')
        self.assertIn("darkmode-no-gradient", result[0][1])

    def test_article_validation_includes_compatibility_findings(self):
        errors, warnings, _ = validate(
            '<section style="text-align:start;background:linear-gradient(white,blue)">'
            '<span leaf="">中文</span></section>')
        self.assertTrue(any("text-align-logical" in item for item in errors))
        self.assertTrue(any("darkmode-no-gradient" in item for item in warnings))

    def test_strict_cli_fails_warnings_and_default_preserves_exit_code(self):
        script = str(ROOT / "scripts" / "validate_gzh_html.py")
        html = '<section><span leaf="">中文</span></section>'
        for flags, expected in (([], 0), (["--strict"], 1)):
            with self.subTest(flags=flags):
                result = subprocess.run([sys.executable, script, "--stdin", *flags],
                                        input=html, text=True, capture_output=True)
                self.assertEqual(result.returncode, expected, result.stdout + result.stderr)
                self.assertIn("root-text-align", result.stdout)

    def test_component_lint_checks_html_blocks_not_documentation(self):
        source = ('说明里可提及text-align:start。\n```html\n'
                  '<section style="text-align:end;background:linear-gradient(white,blue)">中文</section>\n```')
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "theme-test.md"
            path.write_text(source)
            _, findings = lint_file(path)
        self.assertEqual([level for level, _ in findings], ["ERROR", "WARN"])
        self.assertIn("text-align-logical", findings[0][1])
        self.assertIn("darkmode-no-gradient", findings[1][1])

    def test_zero_width_spacer_in_gradient_line_is_ignored(self):
        html = ('<section style="text-align:left">'
                '<section style="height:1px;overflow:hidden;background:linear-gradient(to right,#2563EB,transparent)">'
                '<span leaf="">&#8203;</span></section><p>正文</p></section>')
        self.assertEqual(check_compatibility(html, check_root=True), [])

    def test_wechat_width_overflow_patterns(self):
        self.assertIn("width-overflow", check_compatibility(
            '<section style="width:100%;margin:0 20px">正文</section>')[0][1])
        self.assertIn("width-border-box", check_compatibility(
            '<section style="width:100%;padding:12px">正文</section>')[0][1])
        self.assertEqual(check_compatibility(
            '<section style="width:100%;padding:12px;box-sizing:border-box">正文</section>'), [])
        self.assertIn("width-fixed-large", check_compatibility(
            '<section style="display:inline-block;width:150px;padding:14px">卡片</section>')[0][1])
        self.assertEqual(check_compatibility(
            '<section style="display:inline-block;width:auto;min-width:144px;box-sizing:border-box">卡片</section>'), [])


if __name__ == "__main__":
    unittest.main()
