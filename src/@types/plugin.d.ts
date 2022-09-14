declare namespace XIOEntity {
    interface IPluginInfo {
        id: string;
        name: string;
        description?: string;
        version: string;
        icon?: string;
        preload?: string;
        entry?: string;
        multiple?: boolean;
        detachable?: boolean;
        codes?: Array<IPluginCode>;
    }

    interface IPluginCode {
        type: "default" | "text" | "any" | "file" | "regexp" | "img";
        code: string;
        description?: string;
        icon?: string;

        // XIO 内部逻辑使用
        pluginName: string;
        pluginId: string;
    }
}
