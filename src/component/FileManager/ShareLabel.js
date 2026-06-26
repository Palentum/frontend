import React from "react";
import ShareIcon from "@material-ui/icons/Share";
import { makeStyles, Tooltip } from "@material-ui/core";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles((theme) => ({
    icon: {
        fontSize: 15,
        verticalAlign: "middle",
        marginLeft: theme.spacing(0.5),
        color: theme.palette.text.secondary,
    },
}));

// ShareLabel 在已创建过分享链接的文件/目录旁显示一个图标
export default function ShareLabel({ shared }) {
    const classes = useStyles();
    const { t } = useTranslation("application", { keyPrefix: "fileManager" });

    if (!shared) {
        return null;
    }

    return (
        <Tooltip title={t("shared")}>
            <ShareIcon className={classes.icon} />
        </Tooltip>
    );
}
