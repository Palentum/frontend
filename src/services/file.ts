import API from "../middleware/Api";

export async function getDownloadURL(file: any, capToken?: string): Promise<any> {
    let reqURL = "";
    if (file.key) {
        const downloadPath =
            file.path === "/"
                ? file.path + file.name
                : file.path + "/" + file.name;
        reqURL =
            "/share/download/" +
            file.key +
            "?path=" +
            encodeURIComponent(downloadPath);
    } else {
        reqURL = "/file/download/" + file.id;
    }

    if (capToken) {
        return API.put(reqURL, undefined, {
            headers: {
                "X-Cap-Token": capToken,
            },
        });
    }

    return API.put(reqURL);
}
