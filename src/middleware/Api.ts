import axios from "axios";
import Auth from "./Auth";
import i18next from "../i18n";

export const baseURL = "/api/v3";

export const getBaseURL = () => {
    return baseURL;
};

export const getPreviewURL = (
    isShare: boolean,
    shareID: any,
    fileID: any,
    path: any
): string => {
    return (
        getBaseURL() +
        (isShare
            ? "/share/preview/" +
              shareID +
              (path !== "" ? "?path=" + encodeURIComponent(path) : "")
            : "/file/preview/" + fileID)
    );
};

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
const instance = axios.create({
    baseURL: getBaseURL(),
    withCredentials: true,
});

export class AppError extends Error {
    constructor(message: string | undefined, public code: any, error: any) {
        super(message);
        this.code = code;
        if (i18next.exists(`errors.${code}`, { ns: "common" })) {
            this.message = i18next.t(`errors.${code}`, {
                ns: "common",
                message,
            });
        } else if (i18next.exists(`errors.${code}`, { ns: "dashboard" })) {
            this.message = i18next.t(`errors.${code}`, {
                ns: "dashboard",
                message,
            });
        } else {
            this.message =
                message || i18next.t("unknownError", { ns: "common" });
        }

        this.message +=
            error && !this.message.includes(error) ? ` (${error})` : "";
        this.stack = new Error().stack;
    }
}

// handleResponseError 从响应数据中提取错误信息并抛出 AppError。
// 同时支持 2xx（success handler 调用）和非 2xx（error handler 调用）响应。
function handleResponseError(data: any): void {
    if (
        data.code !== undefined &&
        data.code !== 0 &&
        data.code !== 203
    ) {
        // Login expired
        if (data.code === 401) {
            Auth.signout();
            window.location.href =
                "/login?redirect=" +
                encodeURIComponent(
                    window.location.pathname + window.location.search
                );
        }

        // Non-admin
        if (data.code === 40008) {
            window.location.href = "/home";
        }
        throw new AppError(
            data.msg,
            data.code,
            data.error
        );
    }
}

instance.interceptors.response.use(
    function (response: any) {
        response.rawData = response.data;
        response.data = response.data.data;
        handleResponseError(response.rawData);
        return response;
    },
    function (error: any) {
        // 非 2xx 响应：从 error.response.data 中提取错误信息
        if (error.response && error.response.data) {
            handleResponseError(error.response.data);
        }
        return Promise.reject(error);
    }
);

export default instance;
