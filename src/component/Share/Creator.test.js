import React from "react";
import ReactDOM from "react-dom";
import { act, Simulate } from "react-dom/test-utils";
import Creator from "./Creator";

const mockPush = jest.fn();
const mockReact = React;

jest.mock("react-router", () => ({
    useHistory: () => ({ push: mockPush }),
}));

jest.mock("../../utils/datetime", () => ({
    formatLocalTime: (time) => time,
}));

jest.mock("react-i18next", () => ({
    Trans: ({ values, components }) => {
        if (components && components[0]) {
            return mockReact.cloneElement(components[0], {}, values.nick);
        }

        return values.nick;
    },
    useTranslation: () => ({
        t: (key, values = {}) => {
            if (key === "statistics") {
                return `${values.views}/${values.downloads}/${values.time}`;
            }

            return key;
        },
    }),
}));

const share = {
    creator: {
        key: "creator-key",
        nick: "Alice",
    },
    create_date: "2026-05-28T00:00:00Z",
    downloads: 2,
    expire: 0,
    views: 1,
};

describe("Share Creator", () => {
    let container;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
        mockPush.mockClear();
    });

    afterEach(() => {
        ReactDOM.unmountComponentAtNode(container);
        container.remove();
        container = null;
    });

    const renderCreator = (props = {}) => {
        act(() => {
            ReactDOM.render(<Creator share={share} {...props} />, container);
        });
    };

    it("does not navigate when the avatar is clicked", () => {
        const onClose = jest.fn();
        renderCreator({ onClose });

        const avatar = container.querySelector(".MuiAvatar-root");
        expect(avatar).not.toBeNull();

        act(() => {
            Simulate.click(avatar);
        });

        expect(mockPush).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
    });

    it.each([
        ["file share", false],
        ["folder share", true],
    ])("renders the creator name without a profile link on %s", (name, isFolder) => {
        const onClose = jest.fn();
        renderCreator({ isFolder, onClose });

        const creatorName = Array.from(container.querySelectorAll("span, a")).find(
            (node) => node.textContent === share.creator.nick
        );
        expect(creatorName).not.toBeUndefined();
        expect(creatorName.tagName).toBe("SPAN");
        expect(container.querySelector("a")).toBeNull();

        act(() => {
            Simulate.click(creatorName);
        });

        expect(mockPush).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
    });
});
