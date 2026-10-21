import DOMPurify from "dompurify";

// 净化待写入 DOM 的 HTML;保留 target,使 Markdown 链接仍在新标签页打开
export default function sanitizeHtml(html) {
    return DOMPurify.sanitize(html, { ADD_ATTR: ["target"] });
}
