'use strict';

const Fs = require('fs');
const VersionBuilder = require('./version_builder');

/**
 * Tính năng
 * - Thay đổi được chỗ lưu storage 'X9ProjectPaths'
 * 
 */
class HotupdateModule{
    constructor(){
        Editor.log("X9 Project Builder");
        this._storageItem = "X9ProjectPaths";
        // this.versionBuilder = new VersionBuilder(true);
        this.versionBuilder = new VersionBuilder(false);
    }

    get injectScript(){
        return "!function(){if('object'==typeof window.jsb){var e=localStorage.getItem('" + this._getMd5(this._storageItem) + "');if(e){var i=JSON.parse(e);jsb.fileUtils.setSearchPaths(i);var t=[],s=i[0]||'',l=s+'_temp/',c=l.length;jsb.fileUtils.isDirectoryExist(l)&&!jsb.fileUtils.isFileExist(l+'project.manifest.temp')&&(jsb.fileUtils.listFilesRecursively(l,t),t.forEach(e=>{var i=e.substr(c),t=s+i;'/'==e[e.length]?cc.fileUtils.createDirectory(t):(cc.fileUtils.isFileExist(t)&&cc.fileUtils.removeFile(t),cc.fileUtils.renameFile(e,t))}),cc.fileUtils.removeDirectory(l))}}}();";
    }
    

    load(){
        Editor.Builder.on('build-finished', this.__onBeforeBuildFinish.bind(this));
        Editor.Builder.on('build-start', this.__onStartBuild.bind(this));
    }

    unload(){
        Editor.Builder.removeListener('build-finished', this.__onBeforeBuildFinish.bind(this));
        Editor.Builder.removeListener('build-start', this.__onStartBuild.bind(this));
    }

    //----------------
    // Message IPC Handler
    //----------------

    // __assetsCreatedMessage(event, assets){
    //     Editor.log('>> Asset Created !!!!')
    //     // var r = new Regex(@"(?:\(Lock\))(.*?)(?:\(Unlock\))");
    //     // prefix\/(.+?)\/?(?:suffix|$)
    //     assets.forEach(asset => {
    //         let assetPath = encodeURI(asset.path.replace(/\\/g, '/'))
    //         // Editor.log('>> ' + JSON.stringify(asset)) 
            
    //         let content = Fs.readFileSync(assetPath)
    //         Editor.log("\n " + content);
    //         //{"path":"E:\\PROJECT\\MAIN\\X9.SESAME\\x9default\\assets\\script\\app\\sesame\\UnlockScene.js","url":"db://assets/script/app/sesame/UnlockScene.js","uuid":"3c881846-6101-4062-b5cb-437236ab33e4","parentUuid":"a231c092-c087-465f-8e1d-a04b56725685","type":"javascript","hidden":false,"readonly":false}
    //         // asset.path
    //         // asset.url
    //         // asset.uuid
    //         // asset.parentUuid
    //         // asset.type //"javascript",
    //         // asset.hidden //false,
    //         // asset.readonly //false
    //     });
    // }

    //----------------
    // 
    //----------------
    
    /**
     * 
     * @param {*} content 
     */
    _getMd5(content){
        return content; // sua sau
        // return crypto.createHash('md5').update(content).digest('hex');
    }

    /**
     * 
     * @param {*} dest 
     * @param {*} done 
     */
    _addInjectScript(dest, done){
        var _this = this;
        var root = Path.normalize(dest);
        var url = Path.join(root, "main.js");
        Fs.readFile(url, "utf8", (err, data)=>{
            if (err) {
                throw err;
            }

            var newStr = _this.injectScript + data;
            Fs.writeFile(url, newStr, (error)=>{
                if (err) {
                    throw err;
                }
                Editor.log("SearchPath đã được thêm vào main.js cho tính năng hotupdate");
            });
        });

        done();
    }
    //----------------
    // 
    //----------------

    /**
     * 
     * @param {*} options 
     * @param {*} callback 
     */
    __onStartBuild(options, callback){
        Editor.log('X9 Project Builder');
        //        
        let platfrom = options.actualPlatform;
        let remoteServerRoot = options[platfrom] ? options[platfrom].REMOTE_SERVER_ROOT : 'http://127.0.0.1:8080';
        let packageName = options[platfrom] ? options[platfrom].packageName : options.packageName;
        let projectName = options.projectName;
        let buildPath = options.buildPath;
        let destPath = options.dest;
        // 
        this.versionBuilder.setProjectName(projectName);
        if(options.actualPlatform.indexOf("web") == -1){
            Editor.log("Bắt đầu quá trình build.");
            this.versionBuilder.onReady = callback;
            this.versionBuilder.initNewVersion(packageName, remoteServerRoot, buildPath, destPath);
        }else{
            callback();
        }
    }

    /**
     * 
     * @param {*} options 
     * @param {*} callback 
     */
    __onBeforeBuildFinish(options, callback){        
        // Them ma vao main.js
        if(options.actualPlatform.indexOf("web") == -1){
            // Editor.log("Tao ban hotupdate !")
            this._addInjectScript(options.dest, ()=>{
                this.versionBuilder.generateVersion(callback);
            });
            
        }else{            
            callback();
        }        
        // 
        
    }

    strictMode(){
        return {
            load : this.load.bind(this),
            unload : this.unload.bind(this)
            // messages:{
            //     'asset-db:assets-created' : this.__assetsCreatedMessage.bind(this)
            // }
        }
    }
}

module.exports = (new HotupdateModule()).strictMode();
