"use strict";

const path = require("path");

// for-editor 0.3.5 内联了 marked 0.6.3(sanitize: false),预览区把渲染结果直接写入
// dangerouslySetInnerHTML,打开任意 md/txt/html 文件或分享页 README 即可执行脚本。
// 打包时给渲染结果套上 sanitizeHtml;for-editor 变动导致匹配失败时直接报错,避免补丁静默失效。
const TARGET = "dangerouslySetInnerHTML:{__html:u.default(f)}";
const SANITIZER = JSON.stringify(
    path.resolve(__dirname, "../src/utils/sanitizeHtml.js")
);

module.exports = function forEditorSanitizeLoader(source) {
    if (source.split(TARGET).length !== 2) {
        throw new Error(
            "forEditorSanitizeLoader: patch target not found exactly once in for-editor, re-check it after upgrading for-editor"
        );
    }
    return source.replace(
        TARGET,
        `dangerouslySetInnerHTML:{__html:require(${SANITIZER}).default(u.default(f))}`
    );
};
