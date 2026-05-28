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

    it("constructs correct URL for shared downloads", async () => {
        await getDownloadURL({
            key: "shareKey",
            path: "/folder",
            name: "file name.txt",
        });

        expect(API.put).toHaveBeenCalledWith(
            "/share/download/shareKey?path=%2Ffolder%2Ffile%20name.txt"
        );
    });

    it("omits path parameter for single-file shares", async () => {
        await getDownloadURL({
            key: "shareKey",
            source: { name: "report.pdf" },
        });

        expect(API.put).toHaveBeenCalledWith("/share/download/shareKey");
    });

    it("constructs correct URL for non-shared files", async () => {
        await getDownloadURL({ id: "fileID" });

        expect(API.put).toHaveBeenCalledWith("/file/download/fileID");
    });
});
