import fs from "fs";
import sanitizeHtml from "./sanitizeHtml";
import forEditorSanitizeLoader from "../../config/forEditorSanitizeLoader";

describe("sanitizeHtml", () => {
    it("strips event handlers and script elements", () => {
        const html = sanitizeHtml(
            '<p><img src="x" onerror="window.x=1"></p><svg><script>window.x=1</script></svg>'
        );

        expect(html).toBe('<p><img src="x"></p><svg></svg>');
    });

    it("drops javascript: links and attributes injected via unquoted title", () => {
        // for-editor 的链接渲染器输出不带引号的 href / title
        const html = sanitizeHtml(
            "<a href=javascript:window.x=1\n title=a onmouseover=window.x=1\n target='_blank'\n }>t</a>"
        );

        expect(html).not.toMatch(/javascript:window|onmouseover/);
    });

    it("keeps markdown output and link target", () => {
        const html =
            '<h1>t</h1><pre><code class="language-js"><span class="hljs-keyword">const</span></code></pre>' +
            '<a href="https://example.com" target="_blank">l</a>';

        expect(sanitizeHtml(html)).toBe(html);
    });
});

describe("forEditorSanitizeLoader", () => {
    it("wraps the installed for-editor preview HTML with sanitizeHtml", () => {
        const source = fs.readFileSync(
            require.resolve("for-editor/dist/index.js"),
            "utf8"
        );

        const patched = forEditorSanitizeLoader(source);

        expect(patched).toMatch(
            /__html:require\(".*sanitizeHtml\.js"\)\.default\(u\.default\(f\)\)/
        );
        expect(patched).not.toContain("__html:u.default(f)}");
    });

    it("fails loudly when the patch target is missing", () => {
        expect(() => forEditorSanitizeLoader("module.exports = {}")).toThrow(
            /patch target not found/
        );
    });
});
