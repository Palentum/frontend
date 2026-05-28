import API from "../middleware/Api";

export async function getDownloadURL(file: any): Promise<any> {
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

    return API.put(reqURL);
}
