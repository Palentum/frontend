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

const cloudflareChallengeReloadKey = "cloudreve_cloudflare_challenge_reload";
let reloadingForCloudflareChallenge = false;

function hasSessionFlag(key: string): boolean {
    try {
        return window.sessionStorage.getItem(key) === "1";
    } catch (_) {
        return false;
    }
}

function setSessionFlag(key: string): void {
    try {
        window.sessionStorage.setItem(key, "1");
    } catch (_) {
        // Ignore storage errors; the in-memory guard still prevents duplicate reloads.
    }
}

function clearSessionFlag(key: string): void {
    try {
        window.sessionStorage.removeItem(key);
    } catch (_) {
        // Ignore storage errors.
    }
}

export function isCloudflareChallengeResponse(response: any): boolean {
    if (!response || !response.headers) {
        return false;
    }

    const headers = response.headers;
    if (headers.get) {
        return headers.get("cf-mitigated") === "challenge";
    }

    return (
        headers["cf-mitigated"] === "challenge" ||
        headers["CF-Mitigated"] === "challenge"
    );
}

function createCloudflareChallengeError(): AppError {
    return new AppError(
        "Cloudflare security challenge required.",
        "cf_challenge",
        undefined
    );
}

function clearCloudflareChallengeReload(): void {
    if (!reloadingForCloudflareChallenge) {
        clearSessionFlag(cloudflareChallengeReloadKey);
    }
}

function reloadForCloudflareChallenge(): boolean {
    if (
        reloadingForCloudflareChallenge ||
        hasSessionFlag(cloudflareChallengeReloadKey)
    ) {
        return false;
    }

    reloadingForCloudflareChallenge = true;
    setSessionFlag(cloudflareChallengeReloadKey);

    const reload = () => {
        window.location.reload();
    };
    const serviceWorker =
        "serviceWorker" in navigator ? navigator.serviceWorker : undefined;

    if (serviceWorker && serviceWorker.getRegistration) {
        serviceWorker
            .getRegistration()
            .then((registration) => {
                if (!registration) {
                    reload();
                    return;
                }

                registration.unregister().then(reload).catch(reload);
            })
            .catch(reload);
        return true;
    }

    reload();
    return true;
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
        if (isCloudflareChallengeResponse(response)) {
            reloadForCloudflareChallenge();
            return Promise.reject(createCloudflareChallengeError());
        }

        clearCloudflareChallengeReload();
        response.rawData = response.data;
        response.data = response.data.data;
        handleResponseError(response.rawData);
        return response;
    },
    function (error: any) {
        if (isCloudflareChallengeResponse(error.response)) {
            reloadForCloudflareChallenge();
            return Promise.reject(createCloudflareChallengeError());
        }

        // 非 2xx 响应：从 error.response.data 中提取错误信息
        if (error.response && error.response.data) {
            handleResponseError(error.response.data);
        }
        return Promise.reject(error);
    }
);

export default instance;
