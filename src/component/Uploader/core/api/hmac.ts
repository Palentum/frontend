const SHA256_BLOCK_SIZE = 64;
const SHA256_DIGEST_SIZE = 32;
const BASE64_URL_TABLE =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

const SHA256_K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b,
    0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01,
    0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7,
    0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152,
    0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
    0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819,
    0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08,
    0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f,
    0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

const SHA256_H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f,
    0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
];

export async function hmacSign(
    secret: string,
    message: string
): Promise<string> {
    const cryptoAPI = typeof crypto === "undefined" ? undefined : crypto;
    if (cryptoAPI && cryptoAPI.subtle) {
        const encoder = new TextEncoder();
        const key = await cryptoAPI.subtle.importKey(
            "raw",
            encoder.encode(secret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );
        const sig = await cryptoAPI.subtle.sign(
            "HMAC",
            key,
            encoder.encode(message)
        );
        return base64UrlEncode(new Uint8Array(sig));
    }

    return hmacSha256Base64Url(secret, message);
}

export function hmacSha256Base64Url(secret: string, message: string): string {
    return base64UrlEncode(hmacSha256(utf8Bytes(secret), utf8Bytes(message)));
}

function hmacSha256(key: Uint8Array, message: Uint8Array): Uint8Array {
    const normalizedKey = key.length > SHA256_BLOCK_SIZE ? sha256(key) : key;
    const keyBlock = new Uint8Array(SHA256_BLOCK_SIZE);
    keyBlock.set(normalizedKey);

    const innerPad = new Uint8Array(SHA256_BLOCK_SIZE);
    const outerPad = new Uint8Array(SHA256_BLOCK_SIZE);
    for (let i = 0; i < SHA256_BLOCK_SIZE; i++) {
        innerPad[i] = keyBlock[i] ^ 0x36;
        outerPad[i] = keyBlock[i] ^ 0x5c;
    }

    const innerHash = sha256(concatBytes(innerPad, message));
    return sha256(concatBytes(outerPad, innerHash));
}

function sha256(message: Uint8Array): Uint8Array {
    const blocks = paddedBlocks(message);
    const words = new Uint32Array(64);
    const hash = SHA256_H.slice();
    const view = new DataView(blocks.buffer);

    for (let offset = 0; offset < blocks.length; offset += SHA256_BLOCK_SIZE) {
        fillMessageSchedule(words, view, offset);
        compressBlock(hash, words);
    }

    return hashToBytes(hash);
}

function paddedBlocks(message: Uint8Array): Uint8Array {
    const lengthWithTerminator = message.length + 1 + 8;
    const blockCount = Math.ceil(lengthWithTerminator / SHA256_BLOCK_SIZE);
    const blocks = new Uint8Array(blockCount * SHA256_BLOCK_SIZE);
    blocks.set(message);
    blocks[message.length] = 0x80;

    const view = new DataView(blocks.buffer);
    view.setUint32(blocks.length - 4, message.length * 8, false);
    return blocks;
}

function fillMessageSchedule(
    words: Uint32Array,
    view: DataView,
    offset: number
) {
    for (let i = 0; i < 16; i++) {
        words[i] = view.getUint32(offset + i * 4, false);
    }

    for (let i = 16; i < 64; i++) {
        const s0 =
            rotr(words[i - 15], 7) ^
            rotr(words[i - 15], 18) ^
            (words[i - 15] >>> 3);
        const s1 =
            rotr(words[i - 2], 17) ^
            rotr(words[i - 2], 19) ^
            (words[i - 2] >>> 10);
        words[i] = (words[i - 16] + s0 + words[i - 7] + s1) >>> 0;
    }
}

function compressBlock(hash: number[], words: Uint32Array) {
    let [a, b, c, d, e, f, g, h] = hash;

    for (let i = 0; i < 64; i++) {
        const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const temp1 = (h + s1 + ch + SHA256_K[i] + words[i]) >>> 0;
        const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (s0 + maj) >>> 0;
        h = g;
        g = f;
        f = e;
        e = (d + temp1) >>> 0;
        d = c;
        c = b;
        b = a;
        a = (temp1 + temp2) >>> 0;
    }

    const values = [a, b, c, d, e, f, g, h];
    for (let i = 0; i < hash.length; i++) {
        hash[i] = (hash[i] + values[i]) >>> 0;
    }
}

function hashToBytes(hash: number[]): Uint8Array {
    const bytes = new Uint8Array(SHA256_DIGEST_SIZE);
    const view = new DataView(bytes.buffer);
    hash.forEach((value, index) => view.setUint32(index * 4, value, false));
    return bytes;
}

function base64UrlEncode(bytes: Uint8Array): string {
    let encoded = "";
    for (let i = 0; i < bytes.length; i += 3) {
        const b1 = bytes[i];
        const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
        const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;
        encoded += BASE64_URL_TABLE[b1 >> 2];
        encoded += BASE64_URL_TABLE[((b1 & 3) << 4) | (b2 >> 4)];
        encoded +=
            i + 1 < bytes.length
                ? BASE64_URL_TABLE[((b2 & 15) << 2) | (b3 >> 6)]
                : "=";
        encoded += i + 2 < bytes.length ? BASE64_URL_TABLE[b3 & 63] : "=";
    }
    return encoded;
}

function concatBytes(left: Uint8Array, right: Uint8Array): Uint8Array {
    const result = new Uint8Array(left.length + right.length);
    result.set(left);
    result.set(right, left.length);
    return result;
}

function utf8Bytes(value: string): Uint8Array {
    if (typeof TextEncoder !== "undefined") {
        return new TextEncoder().encode(value);
    }

    const bytes: number[] = [];
    for (let i = 0; i < value.length; i++) {
        let codePoint = value.charCodeAt(i);
        if (isHighSurrogate(codePoint) && i + 1 < value.length) {
            const next = value.charCodeAt(i + 1);
            if (isLowSurrogate(next)) {
                codePoint =
                    0x10000 +
                    ((codePoint - 0xd800) << 10) +
                    (next - 0xdc00);
                i++;
            }
        }
        appendUtf8CodePoint(bytes, codePoint);
    }
    return new Uint8Array(bytes);
}

function rotr(value: number, shift: number): number {
    return (value >>> shift) | (value << (32 - shift));
}

function appendUtf8CodePoint(bytes: number[], codePoint: number) {
    if (codePoint < 0x80) {
        bytes.push(codePoint);
        return;
    }

    if (codePoint < 0x800) {
        bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
        return;
    }

    if (codePoint < 0x10000) {
        bytes.push(
            0xe0 | (codePoint >> 12),
            0x80 | ((codePoint >> 6) & 0x3f),
            0x80 | (codePoint & 0x3f)
        );
        return;
    }

    bytes.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f)
    );
}

function isHighSurrogate(codePoint: number): boolean {
    return codePoint >= 0xd800 && codePoint <= 0xdbff;
}

function isLowSurrogate(codePoint: number): boolean {
    return codePoint >= 0xdc00 && codePoint <= 0xdfff;
}
