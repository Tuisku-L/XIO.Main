import { app, BrowserView, ipcMain, webContents, screen, desktopCapturer, IpcMain } from "electron";
import * as fs from "fs";

import getCopiedFiles from "./utils/getCopiedFiles";
import CoreDB from "./common/coreDB";

import { XIO_CONFIG } from "./common/constans/config";

import MainWnd from "./components/mainWnd";
import pluginManager from "./common/pluginManager";

class XIOMain {
    private mainWnd: typeof MainWnd | null = null;

    constructor() {
        this.mainWnd = MainWnd;

        const singleInstanceLock = app.requestSingleInstanceLock();
        if (singleInstanceLock) {
            this.XIO_WillReady();
            this.XIO_OnRunning();
            this.XIO_DidExit();
        } else {
            app.quit();
        }
    }

    createXIOWnd() {
        this.mainWnd?.initialize();
    }

    async initXIOConfig() {
        const isFirstInit = !fs.existsSync(XIO_CONFIG.MainPath);
        if (isFirstInit) {
            // 主文件夹
            fs.mkdirSync(XIO_CONFIG.MainPath);
            // 插件安装文件夹
            fs.mkdirSync(`${XIO_CONFIG.MainPath}/${XIO_CONFIG.PluginDir}`);
        } else {
            console.info("is already init config.");
        }

        // 核心数据库
        const coreDBPath = `${XIO_CONFIG.MainPath}/${XIO_CONFIG.CoreDBName}`;
        if (!fs.existsSync(coreDBPath)) {
            fs.writeFileSync(coreDBPath, "{}");
        }

        await CoreDB.init(`${XIO_CONFIG.MainPath}/${XIO_CONFIG.CoreDBName}`);
    }

    XIO_WillReady() {
        const readyFunc = async () => {
            await this.initXIOConfig();
            this.createXIOWnd();

            ipcMain.handle(
                "DESKTOP_CAPTURER_GET_SOURCES",
                (event, opts) => desktopCapturer.getSources(opts)
            );

            ipcMain.handle(
                "SCREEN_GET_PRIMARY_DISPLAY",
                () => screen.getPrimaryDisplay()
            );

            // 安装插件消息
            ipcMain.on("xio-install-plugin", async (e, { path }) => {
                const result = await pluginManager.installPlugin(path);
                e.sender.send("xio-install-plugin-done", { success: result });
            });
        }

        if (!app.isReady()) {
            app.on("ready", readyFunc);
        } else {
            readyFunc();
        }
    }

    XIO_OnRunning() {
        app.on("second-instance", () => {
            const mainWnd = this.mainWnd?.instance;
            if (mainWnd) {
                if (mainWnd.isMinimized()) {
                    mainWnd.restore();
                }
                mainWnd.focus();
            }
        });

        app.on("activate", () => {
            if (this.mainWnd?.instance == null) {
                this.createXIOWnd();
            }
        });

        // 检测剪贴板文件, 判断是否要安装插件
        app.on("browser-window-focus", () => {
            const files = getCopiedFiles();
            // plugin.json
            // *.xpk
            if (files) {
                let pluginConfOrFile = files.find(x => x.endsWith("plugin.json") || x.endsWith("*.xpk"));
                if (pluginConfOrFile) {
                    pluginConfOrFile = pluginConfOrFile.replace("/mnt/chromeos", "/home/chronos/user");
                    console.info("pluginConfOrFile", pluginConfOrFile)
                    const type = pluginConfOrFile.endsWith("*.xpk") ? "package" : "unpackage";
                    let pluginInfo: any = {};
                    if (type === "unpackage") {
                        // 读取插件信息, 加载
                        const jsonFile = fs.readFileSync(pluginConfOrFile).toString();
                        pluginInfo = JSON.parse(jsonFile);
                        console.info("pluginInfo", pluginInfo)
                        if (!pluginInfo.name || (!pluginInfo.entry || !pluginInfo.preload)) {
                            return;
                        }
                    } else {
                        // TODO: 解压插件包到指定位置, 安装, 加载
                    }

                    const listView = new BrowserView({
                        webPreferences: {
                            // @ts-ignore
                            enableRemoteModule: true,
                            webSecurity: false,
                            nodeIntegration: true,
                            contextIsolation: false,
                            devTools: true,
                            webviewTag: true,
                            // session: subSession,
                            // preload: `${pluginConfOrFile.substring(0, pluginConfOrFile.lastIndexOf("/"))}/${pluginInfo.preload}`,
                        }
                    });

                    this.mainWnd?.instance?.setBrowserView(listView);
                    listView.webContents.loadURL(`http://localhost:3000/#/list`)
                    listView.webContents.once("dom-ready", () => {
                        this.mainWnd?.instance?.setSize(800, 660);
                        listView.setBounds({ x: 0, y: 60, width: 800, height: 600 });
                        listView.webContents.openDevTools();

                        if (pluginConfOrFile) {
                            listView.webContents.send("xio-show-list", {
                                type: "xio-plugin-install",
                                list: [
                                    {
                                        icon: pluginInfo.icon && `${pluginConfOrFile!.substring(0, pluginConfOrFile!.lastIndexOf("/"))}/${pluginInfo.icon}`,
                                        title: `安装插件 ${pluginInfo.name}`,
                                        content: pluginInfo.description,
                                        defaultIcon: pluginInfo.name[0],
                                        action: `xio-install-plugin ${pluginConfOrFile}`
                                    },
                                    {
                                        icon: "",
                                        title: "复制文件路径",
                                        content: pluginConfOrFile,
                                        action: "xio-copy-path"
                                    }
                                ]
                            });
                        }
                    });
                }
            }
        });
    }

    XIO_DidExit() {
        process.on("SIGTERM", () => {
            app.quit();
        });
    }
}

new XIOMain();
