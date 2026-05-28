import API from "../middleware/Api";

export async function getDownloadURL(file: any, capToken?: string): Promise<any> {
    let reqURL = "";
    if (file.key) {
        reqURL = "/share/download/" + file.key;
        if (file.path != null && file.name != null) {
            const downloadPath =
                file.path === "/"
                    ? file.path + file.name
                    : file.path + "/" + file.name;
            reqURL += "?path=" + encodeURIComponent(downloadPath);
        }
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
