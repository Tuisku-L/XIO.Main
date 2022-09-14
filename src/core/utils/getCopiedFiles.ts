import { clipboard } from "electron";

export default function getCopiedFiles() {
    if (clipboard.has("text/uri-list")) {
        const filePaths = clipboard.read("text/uri-list").match(/^file:\/\/\/.*/gm);
        if (filePaths) {
            return filePaths.map(filePath => decodeURIComponent(filePath).replace(/^file:\/\//, ""));
        }

        return null;
    }

    return null;
}
