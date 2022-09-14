import { ipcRenderer } from "electron";

const desktopCapturer = {
    getSources: (opts: any) => ipcRenderer.invoke('DESKTOP_CAPTURER_GET_SOURCES', opts)
}

const screen = {
    getPrimaryDisplay: () => ipcRenderer.invoke('SCREEN_GET_PRIMARY_DISPLAY')
}

window.desktopCapturer = desktopCapturer;
window.electronScreen = screen;

window.xio = {
    hooks: {},
    onPluginLoad(callback: Function) {
        if (typeof callback === "function") {
            window.xio.hooks.onPluginLoad = callback;
        }
    },
    onPluginReady(callback) {
        if (typeof callback === "function") {
            window.xio.hooks.onPluginLoad = callback;
        }
    },
    onPluginExit(callback) {
        if (typeof callback === "function") {
            window.xio.hooks.onPluginLoad = callback;
        }
    }
};