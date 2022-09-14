export { }

declare global {
    interface Window {
        xio: {
            hooks: {
                onPluginLoad?: Function;
                onPluginReady?: Function;
                onPluginExit?: Function;
            };
            onPluginLoad: (callback: Function) => void;
            onPluginReady: (callback: Function) => void;
            onPluginExit: (callback: Function) => void;
        };
        desktopCapturer: { getSources: Function; };
        electronScreen: { getPrimaryDisplay: Function };
    }
}
