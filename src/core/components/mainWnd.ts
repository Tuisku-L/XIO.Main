import { BrowserWindow } from "electron";

class MainWnd {
    private _instance: BrowserWindow | null = null;

    get instance() {
        return this._instance;
    }

    initialize() {
        this.createMainWnd();
    }

    private createMainWnd() {
        this._instance = new BrowserWindow({
            height: 60,
            width: 800,
            resizable: false,
            frame: false,
            show: true,
            skipTaskbar: true,
            alwaysOnTop: true,
            webPreferences: {
                webSecurity: false,
                backgroundThrottling: false,
                contextIsolation: false,
                webviewTag: true,
                nodeIntegration: true,
                preload: "/home/chronos/user/MyFiles/XIO/src/core/preload.js"
            },
        });

        // TODO: 开发环境判断
        if (1 === 1/** process.env.NODE_ENV === "development" */) {
            this._instance.loadURL("http://localhost:3000/#")
        } else {
            this._instance.loadFile("app://./index.html");
        }

        this._instance.on("close", () => {
            this._instance = null;
        });

        // this._instance.on("blur", () => {
        //     this._instance?.minimize();
        // });

        this._instance.webContents.openDevTools({ mode: "detach" });
    }
};

export default new MainWnd();
