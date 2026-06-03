jest.mock("../i18n", () => ({
    __esModule: true,
    default: {
        exists: jest.fn(() => false),
        t: jest.fn((key) => key),
    },
}));

jest.mock("./Auth", () => ({
    __esModule: true,
    default: {
        signout: jest.fn(),
    },
}));

import { isCloudflareChallengeResponse } from "./Api";

describe("isCloudflareChallengeResponse", () => {
    it("detects Cloudflare challenge responses", () => {
        expect(
            isCloudflareChallengeResponse({
                headers: { "cf-mitigated": "challenge" },
            })
        ).toBe(true);
    });

    it("handles canonical header casing", () => {
        expect(
            isCloudflareChallengeResponse({
                headers: { "CF-Mitigated": "challenge" },
            })
        ).toBe(true);
    });

    it("handles Headers-like objects", () => {
        expect(
            isCloudflareChallengeResponse({
                headers: {
                    get: jest.fn((header) =>
                        header === "cf-mitigated" ? "challenge" : null
                    ),
                },
            })
        ).toBe(true);
    });

    it("ignores non-challenge responses", () => {
        expect(
            isCloudflareChallengeResponse({
                headers: { "cf-mitigated": "block" },
            })
        ).toBe(false);
        expect(isCloudflareChallengeResponse({ headers: {} })).toBe(false);
        expect(isCloudflareChallengeResponse(undefined)).toBe(false);
    });
});
