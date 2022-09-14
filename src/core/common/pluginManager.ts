import { BrowserView, BrowserWindow } from "electron";
import pinyin from "node-pinyin";

import coreDB from "./coreDB";
import * as fs from "fs";

import mainWnd from "../components/mainWnd";

import { copyFile } from "./../utils/copyDir";

import { XIO_CONFIG } from "./../common/constans/config";

class PluginManager {
    private _pluginList: Array<XIOEntity.IPluginInfo> = [];

    private _pluginCodes: Array<XIOEntity.IPluginCode> = [];

    private _pluginCodeMap: {
        default: Array<XIOEntity.IPluginCode>;
        text: Array<XIOEntity.IPluginCode>;
        any: Array<XIOEntity.IPluginCode>;
        img: Array<XIOEntity.IPluginCode>;
        file: Array<XIOEntity.IPluginCode>;
        regexp: Array<XIOEntity.IPluginCode>;
    } | null = null;

    private _runningPlugins: Array<
        {
            id: string;
            mode: "normal" | "detach" | "background";
            window?: BrowserWindow;
            view?: BrowserView;
        }
    > = [];

    get pluginList() {
        return this._pluginList;
    }

    constructor() {
        // TODO: 异步的工作放构造函数里很蠢, 懒得改, 暂时没大问题
        // 后期可以改成 static 方法 return 出去 new PluginManager
        this.initPluginManager();
    }

    private async initPluginManager() {
        const allPlugins = await coreDB.getAllPlugin();
        this._pluginList = allPlugins;
        this._pluginCodes = allPlugins.map(x => this.getPluginCode(x)).flat();
        // TODO: 生成 code map
    }

    getPluginList(): Array<XIOEntity.IPluginInfo> {
        return [];
    }

    getEnabeldPlugins(): Array<XIOEntity.IPluginInfo> {
        return [];
    }

    getDisabledPlugins(): Array<XIOEntity.IPluginInfo> {
        return [];
    }

    getPluginByCode(type: "text" | "any" | "file" | "regexp" | "img", data: any) {

    }

    async installPlugin(path: string): Promise<boolean> {
        let type = path.endsWith(".xpk") ? "package" : "unpackage";
        if (type === "package") {
            // 把 xpk 解压出去
            // path = 解压后的位置
            path = ""
        } else {
            path = path.substring(0, path.lastIndexOf("/"));
        }

        const pluginInfoFile = `${path}/plugin.json`;

        if (!fs.existsSync(pluginInfoFile)) {
            throw new Error("plugin info file not found.");
        }

        const pluginInfo: XIOEntity.IPluginInfo = JSON.parse(fs.readFileSync(`${path}/plugin.json`).toString());
        if (pluginInfo) {
            if (!pluginInfo.id) {
                throw new Error("plugin info error: id.");
            }

            if (!pluginInfo.name) {
                throw new Error("plugin info error: name.");
            }

            if (!pluginInfo.preload && !pluginInfo.entry) {
                throw new Error("plugin info error: preload/entry.");
            }

            const installPath = `${XIO_CONFIG.MainPath}/${XIO_CONFIG.PluginDir}/${pluginInfo.id}`;
            // TODO: 如果插件 id 一致, 安装前先判断插件是否在运行且退出, 提醒用户将覆盖数据
            if (fs.existsSync(installPath)) {
                fs.rmdirSync(installPath, { recursive: true });
            }
            fs.mkdirSync(installPath);
            copyFile(path, `${XIO_CONFIG.MainPath}/${XIO_CONFIG.PluginDir}/${pluginInfo.id}`);
            // 把插件信息写入核心数据库
            await coreDB.installPlugin(pluginInfo);
            const pluginCodes = this.getPluginCode(pluginInfo);
            this.addPluginCode(pluginCodes);

            // e.sender.send("xio-install-plugin-done", { success: true });
            return true;
        }

        throw new Error("read plugin info file failed.");
    }

    async uninstallPlugin(id: string): Promise<boolean> {
        // TODO: 退出正在运行的插件
        try {
            await coreDB.uninstallPlugin(id);
            fs.rmdirSync(`${XIO_CONFIG.MainPath}/${XIO_CONFIG.PluginDir}/${id}`);
            // TODO: 删除 plugin code 相关信息
            return true;
        } catch (error) {
            throw error;
        }
    }

    // data: 启动插件时传递的过去的数据
    // 插件应可初始化时获取
    async launchPlugin(id: string, data?: any) {
        // 启动插件时判断当前是否有此插件的实例
        // 如果有: 判断插件是否设置为允许多实例运行
        // 若不允许多实例, 将已存在的独立窗口唤出显示
        // 所有插件启动默认都为 normal 模式

        const mainWndIns = mainWnd.instance;
        if (!mainWndIns) {
            throw new Error("launch plugin failed: main window not found");
        }

        const pluginInfo = await coreDB.getPluginById(id);
        if (pluginInfo) {
            const isRunning = this._runningPlugins.find(x => x.id.includes(id));

            if (isRunning) {
                // 插件允许多实例
                if (pluginInfo.multiple) {
                    const hasDetachWindow = this._runningPlugins.find(x => x.id.includes(id) && x.mode === "detach");
                    if (hasDetachWindow) {
                        // 从当前运行的插件中找到已有独立窗口实例
                        const runningIns = this._runningPlugins.filter(x => x.id.includes(id) && x.mode === "detach");
                        if (runningIns.length > 0) {
                            runningIns.forEach(x => {
                                if (x.window) {
                                    x.window.show();
                                } else {
                                    this._runningPlugins = this._runningPlugins.filter(r => r.id === x.id);
                                }
                            });
                        }

                        return;
                    }
                } else {
                    const nowMainView = mainWndIns.getBrowserView();
                    if (nowMainView) {
                        mainWndIns.removeBrowserView(nowMainView);
                    }
                    const runningPluginView = this._runningPlugins.find(x => x.id.includes(id) && x.mode === "normal");
                    if (runningPluginView) {
                        if (!runningPluginView.view) {
                            this._runningPlugins = this._runningPlugins.filter(r => r.id === runningPluginView.id);
                        } else {
                            mainWndIns.setBrowserView(runningPluginView.view);
                            runningPluginView.view.webContents.once("dom-ready", () => {
                                mainWndIns.setSize(800, 660);
                                pluginView.setBounds({ x: 0, y: 60, width: 800, height: 600 });
                            });

                            return;
                        }
                    }
                }
            }

            // 以 normal 模式启动插件
            const pluginView = new BrowserView({
                webPreferences: {
                    // @ts-ignore
                    enableRemoteModule: true,
                    webSecurity: false,
                    nodeIntegration: true,
                    contextIsolation: false,
                    devTools: true,
                    webviewTag: true,
                    // session: subSession,
                    preload: pluginInfo.preload ? `${XIO_CONFIG.MainPath}/${XIO_CONFIG.PluginDir}/${id}/${pluginInfo.preload}` : undefined
                }
            });

            const nowMainView = mainWndIns.getBrowserView();
            if (nowMainView) {
                mainWndIns.removeBrowserView(nowMainView);
            }

            mainWndIns.setBrowserView(pluginView);
            if (pluginInfo.entry) {
                pluginView.webContents.loadFile(`${XIO_CONFIG.MainPath}/${XIO_CONFIG.PluginDir}/${id}/${pluginInfo.entry}`);
                // TODO: 把 data 传过去
                pluginView.webContents.once("dom-ready", () => {
                    mainWndIns.setSize(800, 660);
                    pluginView.setBounds({ x: 0, y: 60, width: 800, height: 600 });
                    pluginView.webContents.openDevTools();
                });
            }
            this._runningPlugins.push({
                id: `${id}|${Date.now()}`,
                mode: "normal",
                view: pluginView
            });
        } else {
            throw new Error("launch plugin failed: plugin not found.");
        }
    }

    // exit: 直接退出
    // background: 后台运行
    async exitPlugin(id: string, type: "exit" | "background") {

    }

    async restartPlugin(id: string) {

    }

    async updatePlugin(id: string, path: string) {
        // 升级的时候保留插件数据库文件, 删除其他所有文件
    }

    // size: 弹出窗口的尺寸
    // 默认是 800×600
    async detachPlugin(id: string, size: { width: number; height: number; } = { width: 800, height: 600 }) {
        // 将插件弹出为独立窗口
        // 需要将主输入框中的内容带到弹出窗口的子输入框中
    }

    private getPluginCode(plugin: XIOEntity.IPluginInfo) {
        let codes: Array<XIOEntity.IPluginCode> = [];
        if (plugin.codes) {
            codes = [...plugin.codes];
        }

        const defaultCodes: Array<XIOEntity.IPluginCode> = [];

        const initials = pinyin(plugin.name, { style: "initials" }).flat().join("");
        const firstLetter = pinyin(plugin.name, { style: "firstLetter" }).flat().join("")

        // 插件
        defaultCodes.push({
            type: "default",
            code: plugin.name,
            icon: plugin.icon,
            description: plugin.description,
            pluginName: plugin.name,
            pluginId: plugin.id
        });
        // chajian
        defaultCodes.push({
            type: "default",
            code: pinyin(plugin.name, { style: "normal" }).flat().join(""),
            icon: plugin.icon,
            description: plugin.description,
            pluginName: plugin.name,
            pluginId: plugin.id
        });
        // chj
        defaultCodes.push({
            type: "default",
            code: initials,
            icon: plugin.icon,
            description: plugin.description,
            pluginName: plugin.name,
            pluginId: plugin.id
        });
        if (initials !== firstLetter) {
            // cj
            defaultCodes.push({
                type: "default",
                code: firstLetter,
                icon: plugin.icon,
                description: plugin.description,
                pluginName: plugin.name,
                pluginId: plugin.id
            });
        }

        codes = [...codes, ...defaultCodes];

        return codes;
    }

    private addPluginCode(codes: Array<XIOEntity.IPluginCode>) {
        codes.forEach(code => this._pluginCodes.push(code));
        // TODO: 接着加到 codeMap 里
    }
}

export default new PluginManager();
