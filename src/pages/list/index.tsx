import React, { useEffect, useState } from "react";
import classnames from "classnames";
import { ipcRenderer, clipboard } from "electron";

import { ListItem } from "./../../@types/listPage";

import styles from "./styles.less";

const List = () => {
    const [listItems, setListItems] = useState<Array<ListItem>>([]);
    const [tabIndex, setTabIndex] = useState(0);

    useEffect(() => {
        ipcRenderer.on("xio-show-list", (e, { list }) => {
            setListItems(list);
        });

        ipcRenderer.on("xio-install-plugin-done", (e, data) => console.info("xio-install-plugin-done", data))

        console.info("init")

        window.addEventListener("keydown", e => console.info(e))
    }, []);

    const actionSelectListItem = () => {

    }

    const actionSendPluginInstall = (path: string) => {
        ipcRenderer.send("xio-install-plugin", { path });
    }

    useEffect(() => {
        setTabIndex(0);
    }, [listItems]);

    return <div className={styles.listPageBox}>
        {
            listItems.map((listItem, index) =>
                <div
                    className={classnames(styles.listItemLine, tabIndex === index && styles.active)}
                    onClick={() => {
                        console.info("listItem.action", listItem.action)
                        if (typeof listItem.action === "string") {
                            switch (listItem.action.split(" ")[0]) {
                                case "xio-install-plugin": {
                                    console.info("send install")
                                    actionSendPluginInstall(listItem.action.split(" ")[1])
                                    break;
                                }
                                case "xio-copy-path": {
                                    clipboard.writeText(listItem.content);
                                    console.info("copy path done");
                                    break;
                                }
                            }
                        }
                    }}
                >
                    <div className={styles.icon}>
                        {
                            listItem.icon ?
                                <img src={`file://${listItem.icon}`} /> :
                                <div className={styles.defaultIcon}>{listItem.defaultIcon || listItem.title[0]}</div>
                        }
                    </div>
                    <div className={styles.text}>
                        <div className={styles.title}>{listItem.title}</div>
                        <div className={styles.subTitle}>{listItem.content}</div>
                    </div>
                    <div className={styles.action}></div>
                </div>
            )
        }
    </div>
};

export default List;
