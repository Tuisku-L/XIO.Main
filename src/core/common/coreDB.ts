import LocalDB from "./../utils/localDB";

class CoreDB {
    private _db: LocalDB | null = null;
    private _pluginCache: Array<XIOEntity.IPluginInfo> = [];
    private _pluginCodes: Array<XIOEntity.IPluginCode> = [];

    get coreDB() {
        return this._db;
    }

    constructor() {
    }

    async init(path: string = "/home/chronos/user/.XIO/XIO_core.db") {
        this._db = new LocalDB(path);
        await this._db.initDB("XIO_Core");
    }

    async installPlugin(plugInfo: XIOEntity.IPluginInfo) {
        if (this._db) {
            let plugins: Array<XIOEntity.IPluginInfo> = this._db.get("plugins") || [];
            // 相同 Id 插件覆盖
            if (plugins.find(plugin => plugin.id === plugInfo.id)) {
                plugins = plugins.filter(plugin => plugin.id !== plugInfo.id);
            }
            plugins.push(plugInfo);
            await this._db.insert("plugins", plugins);
            this.refreshPluginCache(plugins)
        }
    }

    async uninstallPlugin(id: string) {
        if (this._db) {
            let plugins: Array<XIOEntity.IPluginInfo> | null = this._db.get("plugins");
            if (plugins) {
                plugins = plugins.filter(plugin => plugin.id !== id);
                await this._db.insert("plugins", plugins);
                this.refreshPluginCache(plugins)
            }
        }
    }

    async refreshPluginCache(plugins: Array<XIOEntity.IPluginInfo>) {
        if (plugins) {
            this._pluginCache = plugins;
            return;
        }

        if (this._db) {
            let pluginCache: Array<XIOEntity.IPluginInfo> = this._db.get("plugins") || [];
            this._pluginCache = pluginCache;
            return;
        }

        throw new Error("db error")
    }

    async getAllPlugin() {
        return this._pluginCache;
    }

    async getPluginById(id: string) {
        const plugin = this._pluginCache.find(x => x.id === id);
        return plugin;
    }
}

export default new CoreDB();
