import React, { useEffect, useState } from "react";
import { ipcRenderer } from "electron";

import styles from "./styles.less";

const Main = () => {
    useEffect(() => {
    }, [])
    return <div className={styles.mainBox}>
        <div className={styles.mainInputBox}>
            <div className={styles.inputCover} onClick={() => document.getElementById("main_input")?.focus()} />
            <input placeholder="你好 · FydeOS" id="main_input" autoFocus onClick={() => console.info(12)} />
            <div className={styles.logo}>Fy</div>
        </div>
    </div>;
}

export default Main;
