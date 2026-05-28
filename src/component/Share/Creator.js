import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Avatar, Typography } from "@material-ui/core";
import { formatLocalTime } from "../../utils/datetime";
import { Trans, useTranslation } from "react-i18next";

const useStyles = makeStyles((theme) => ({
    boxHeader: {
        textAlign: "center",
        padding: 24,
    },
    avatar: {
        backgroundColor: theme.palette.secondary.main,
        margin: "0 auto",
        width: 50,
        height: 50,
    },
    shareDes: {
        marginTop: 12,
    },
    shareInfo: {
        color: theme.palette.text.disabled,
        fontSize: 14,
    },
}));

export default function Creator(props) {
    const { t } = useTranslation("application", { keyPrefix: "share" });
    const classes = useStyles();

    const getSecondDes = () => {
        if (props.share.expire > 0) {
            if (props.share.expire >= 24 * 3600) {
                return t("expireInXDays", {
                    num: Math.round(props.share.expire / (24 * 3600)),
                });
            }

            return t("expireInXHours", {
                num: Math.round(props.share.expire / 3600),
            });
        }
        return formatLocalTime(props.share.create_date);
    };

    return (
        <div className={classes.boxHeader}>
            <Avatar
                className={classes.avatar}
                alt={props.share.creator.nick}
                src={"/api/v3/user/avatar/" + props.share.creator.key + "/l"}
            />
            <Typography variant="h6" className={classes.shareDes}>
                {props.isFolder && (
                    <Trans
                        i18nKey="share.createdBy"
                        values={{
                            nick: props.share.creator.nick,
                        }}
                        components={[<span key={0} />]}
                    />
                )}
                {!props.isFolder && (
                    <Trans
                        i18nKey="share.sharedBy"
                        values={{
                            num: 1,
                            nick: props.share.creator.nick,
                        }}
                        components={[<span key={0} />]}
                    />
                )}
            </Typography>
            <Typography className={classes.shareInfo}>
                {t("statistics", {
                    views: props.share.views,
                    downloads: props.share.downloads,
                    time: getSecondDes(),
                })}
            </Typography>
        </div>
    );
}
