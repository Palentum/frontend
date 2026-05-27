import { hmacSha256Base64Url } from "./hmac";

describe("hmacSha256Base64Url", () => {
    it("matches HMAC-SHA256 base64url output with padding", () => {
        const cases = [
            {
                secret: "key",
                message: "The quick brown fox jumps over the lazy dog",
                signature: "97yD9DBThCSxMpjmqm-xQ-9NWaFJRhdZl0edvC0aPNg=",
            },
            {
                secret: "",
                message: "",
                signature: "thNnmggU2ex3L5XXeMNfxf8Wl8STcVZTxscSFEKSxa0=",
            },
            {
                secret: "a".repeat(100),
                message: "unicode-你好-🙂",
                signature: "ue3gIdUlnFEXygYxiSwn7W-CSGBSKO_zB5BiurhWWKg=",
            },
            {
                secret: "secret",
                message: "",
                signature: "-eZuF5tnR65UEI-C-K3os8Jddv0wr95sOVgixTAZYWk=",
            },
        ];

        cases.forEach((testCase) => {
            expect(
                hmacSha256Base64Url(testCase.secret, testCase.message)
            ).toBe(testCase.signature);
        });
    });
});
