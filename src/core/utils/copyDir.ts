import * as fs from "fs";
import * as path from "path";

const isExist = (path: string) => {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }
}

const copyFile = (sourcePath: string, targetPath: string) => {
    const sourceFile = fs.readdirSync(sourcePath, { withFileTypes: true });

    sourceFile.forEach(file => {
        const newSourcePath = path.resolve(sourcePath, file.name);
        const newTargetPath = path.resolve(targetPath, file.name);
        if (file.isDirectory()) {
            isExist(newTargetPath);
            copyFile(newSourcePath, newTargetPath);
        } else {
            fs.copyFileSync(newSourcePath, newTargetPath);
        }
    })
}

export {
    copyFile
}
