import API from "../middleware/Api";
import { getDownloadURL } from "./file";

jest.mock("../middleware/Api", () => ({
    __esModule: true,
    default: {
        put: jest.fn(() => Promise.resolve({ data: "" })),
    },
}));

describe("getDownloadURL", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("adds the Cap token header for shared downloads", async () => {
        await getDownloadURL(
            {
                key: "shareKey",
                path: "/folder",
                name: "file name.txt",
            },
            "cap-token"
        );

        expect(API.put).toHaveBeenCalledWith(
            "/share/download/shareKey?path=%2Ffolder%2Ffile%20name.txt",
            undefined,
            {
                headers: {
                    "X-Cap-Token": "cap-token",
                },
            }
        );
    });

    it("keeps existing requests unchanged when no Cap token is provided", async () => {
        await getDownloadURL({ id: "fileID" });

        expect(API.put).toHaveBeenCalledWith("/file/download/fileID");
    });
});
