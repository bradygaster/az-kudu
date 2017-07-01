const ROOT_DIRECTORY = "site/wwwroot";

module.exports = class KuduClient {
    constructor(credentials, subscriptionId, webAppName) {
        this._kuduApiUrl = `https://${webAppName}.scm.azurewebsites.net/api`; 

        const accessToken = credentials.tokenCache._entries[0].accessToken;
        const defaults = {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        };
        
        this._requestPromise = require("request-promise-native").defaults(defaults);
        this._requestStream = require("request").defaults(defaults);
    }

    deleteFile(fileName, directory = ROOT_DIRECTORY) {
        return this._requestPromise.delete(`${this._kuduApiUrl}/vfs/${directory}/${fileName}`);
    }

    getFileContents(filePath, directory = ROOT_DIRECTORY) {
        return this._requestPromise(`${this._kuduApiUrl}/vfs/${directory}/${filePath}`);
    }

    openLogStream() {
        return this._requestStream(`${this._kuduApiUrl}/logstream`);
    }

    runCommand(command, cwd = "site\\wwwroot") {
        return this._requestPromise.post({
            url: `${this._kuduApiUrl}/command`, 
            json: true,                     
            body: {
                command,
                dir: cwd
            }
        });
    }

    uploadZip(directory = process.cwd(), remoteDirectory = ROOT_DIRECTORY) {
        return new Promise((resolve, reject) => {
            const archive = require("archiver")("zip");          
            archive.pipe(this._requestStream.put(`${this._kuduApiUrl}/zip/${remoteDirectory}/`, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            }));
            archive.glob("**/*", { dot: true, ignore: "node_modules{,/**}" }).finalize();
        });
    }
};