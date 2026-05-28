import React, { useEffect, useRef, useState } from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    makeStyles,
} from "@material-ui/core";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import capScriptURL from "!!file-loader!cap-widget/cap.min.js";

const capWasmURL = "/static/cap/cap_wasm_bg.wasm";

const capScriptID = "cap-widget-script";

const useStyles = makeStyles((theme) => ({
    content: {
        minWidth: 300,
    },
    widget: {
        "--cap-widget-width": "100%",
        "--cap-background": theme.palette.background.paper,
        "--cap-border-color": theme.palette.divider,
        "--cap-color": theme.palette.text.primary,
        "--cap-focus-ring": theme.palette.secondary.main,
        display: "block",
        marginTop: theme.spacing(2),
        width: "100%",
    },
    error: {
        color: theme.palette.error.main,
        marginTop: theme.spacing(1),
    },
}));

function getCapWidgetReady() {
    return Boolean(
        typeof window !== "undefined" &&
            window.customElements &&
            window.customElements.get("cap-widget")
    );
}

export default function ShareCaptcha() {
    const { t } = useTranslation();
    const classes = useStyles();
    const widgetRef = useRef(null);
    const [ready, setReady] = useState(getCapWidgetReady());
    const [error, setError] = useState("");
    const captcha = useSelector((state) => state.viewUpdate.modals.shareCaptcha);

    useEffect(() => {
        if (typeof window === "undefined" || getCapWidgetReady()) {
            setReady(getCapWidgetReady());
            return undefined;
        }

        window.CAP_CUSTOM_WASM_URL = capWasmURL;
        let script = document.getElementById(capScriptID);
        if (!script) {
            script = document.createElement("script");
            script.id = capScriptID;
            script.async = true;
            script.src = capScriptURL;
            document.head.appendChild(script);
        }

        const handleLoad = () => {
            setReady(getCapWidgetReady());
        };
        const handleError = () => {
            setError(t("modals.shareCaptchaError"));
        };

        script.addEventListener("load", handleLoad);
        script.addEventListener("error", handleError);
        return () => {
            script.removeEventListener("load", handleLoad);
            script.removeEventListener("error", handleError);
        };
    }, [t]);

    useEffect(() => {
        if (!captcha || !captcha.open || !ready || !widgetRef.current) {
            return undefined;
        }

        setError("");
        const widget = widgetRef.current;
        const handleSolve = (event) => {
            captcha.callback(event.detail.token);
        };
        const handleError = (event) => {
            const message = event.detail && event.detail.message;
            setError(message || t("modals.shareCaptchaError"));
        };

        widget.addEventListener("solve", handleSolve);
        widget.addEventListener("error", handleError);
        return () => {
            widget.removeEventListener("solve", handleSolve);
            widget.removeEventListener("error", handleError);
        };
    }, [captcha, ready, t]);

    const open = Boolean(captcha && captcha.open);

    return (
        <Dialog
            open={open}
            onClose={captcha && captcha.onClose}
            aria-labelledby="share-captcha-title"
        >
            <DialogTitle id="share-captcha-title">
                {t("modals.shareCaptchaTitle")}
            </DialogTitle>
            <DialogContent dividers className={classes.content}>
                <DialogContentText>
                    {t("modals.shareCaptchaDescription")}
                </DialogContentText>
                {open && ready && (
                    <cap-widget
                        ref={widgetRef}
                        className={classes.widget}
                        data-cap-api-endpoint="/api/v3/cap/"
                        data-cap-i18n-initial-state={t(
                            "modals.shareCaptchaInitial"
                        )}
                        data-cap-i18n-verifying-label={t(
                            "modals.shareCaptchaVerifying"
                        )}
                        data-cap-i18n-solved-label={t(
                            "modals.shareCaptchaSolved"
                        )}
                        data-cap-i18n-error-label={t(
                            "modals.shareCaptchaWidgetError"
                        )}
                    />
                )}
                {open && !ready && !error && (
                    <DialogContentText>
                        {t("modals.shareCaptchaLoading")}
                    </DialogContentText>
                )}
                {error && (
                    <DialogContentText className={classes.error}>
                        {t("modals.shareCaptchaErrorWithMessage", {
                            message: error,
                        })}
                    </DialogContentText>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={captcha && captcha.onClose}>
                    {t("cancel", { ns: "common" })}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
