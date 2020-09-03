var X9Command = require("X9Cmd");
// var CodeStyle = require("X9AutoReduceStyle");
/**
 * Command sử dụng để Hot Update.
 * - Sử dụng trực tiếp kéo thả và config trên editor
 * - Sử dụng khai báo trong code
 * ex:
 * // 1. Khởi tạo
 * // Sử dụng độc lập
 * this.hotupdateCommand = new require('HotupdateCommand');
 * 
 * // Sử dụng trong X9 Component
 * this.hotupdateCommand = use('HotupdateCommand');
 * 
 * //2. Khai bao manifest
 * this.hotupdateCommand.setLocalManifest(this.manifestUrl);
 * // Kiểm tra phiên bản
 * this.hotupdateCommand.checkUpdate()
 */
var HotupdateCommand = cc.Class({
    extends: X9Command,

    statics:{
        SHOW_MESSAGE: "show_message",
        START_UPDATING: "start_updating",
        RETRY_UPDATING: "retry_updating",
        UPDATE_PROGRESS: "update_progress",
        ERROR_NO_LOCAL_MANIFEST: "ERROR_NO_LOCAL_MANIFEST",
        ERROR_MANIFEST: "ERROR_MANIFEST",    
        NEW_VERSION_FOUND: "NEW_VERSION_FOUND",

        HOTUPDATE_SKIPPED: "HOTUPDATE_SKIPPED",
        ALREADY_UP_TO_DATE: "ALREADY_UP_TO_DATE",
        UPDATE_FINISHED: "UPDATE_FINISHED",
        UPDATE_FAILED: "UPDATE_FAILED",
    },

    properties: {
        manifestUrl: {
            type: cc.Asset,
            default: null
        },
        _updating: false,
        _canRetry: false,
        _storagePath: ''
    },

    ctor(){
        if(!this.manifestUrl){
            // throw new Error("Không có file quản lý version trong bản cài !")
        }
    },
    
    test(){
        this.cmd({
            msg: "Test !!!",
        }, HotupdateCommand.SHOW_MESSAGE);
        // }, HotupdateCommand.SHOW_MESSAGE, 'HotupdateComponent');
        // this.dispatch({
        //     __type__: HotupdateCommand.SHOW_MESSAGE,
        //     msg: "Test 2 !!!!"
        // })
    },

    /**
     * 
     * @param {cc.Asset} manifestUrl  Optional | json config mặc định của AssetManager điều khiển quá trình hotupdate
     */
    checkUpdate(manifestUrl) {
        if (this._updating) {
            // this.panel.info.string = 'Checking or updating ...';
            this.cmd({msg:'Checking or updating ...'}, HotupdateCommand.SHOW_MESSAGE);            
            return;
        }
        // 
        var assetManager = this.getAssetManager();        
        if(manifestUrl){
            this.setLocalManifest(manifestUrl);
        }
        // 
        if(assetManager){
            if (assetManager.getState() === jsb.AssetsManager.State.UNINITED) {
                // Resolve md5 url
                var url = this._getNativeURL();
                url = this._transformURL(url);
                assetManager.loadLocalManifest(url);
            }
            
            if (!assetManager.getLocalManifest() || !assetManager.getLocalManifest().isLoaded()) {
                // this.panel.info.string = 'Failed to load local manifest ...';
                this.cmd({msg:'Failed to load local manifest ...'}, HotupdateCommand.SHOW_MESSAGE);
                return;
            }

            assetManager.setEventCallback(this.__onCheckUpdateHandler.bind(this));            
            assetManager.checkUpdate();
            this._updating = true;
        }
    },

    /**
     * 
     * @param {cc.Asset} manifestUrl  json config mặc định của AssetManager điều khiển quá trình hotupdate
     */
    setLocalManifest(manifestUrl){
        if(manifestUrl && manifestUrl instanceof cc.Asset){
            this.manifestUrl = manifestUrl;            
        }else{
            return false
        }
        return true;
    },


    
    /**
     * 
     * @param {cc.Asset} manifestUrl  Optional | json config mặc định của AssetManager điều khiển quá trình hotupdate
     */
    startUpdate(manifestUrl) {
        var assetManager = this.getAssetManager();
        if(manifestUrl){
            this.setLocalManifest(manifestUrl);
        }

        if (assetManager && !this._updating) {
            assetManager.setEventCallback(this.__onUpdateHandler.bind(this));

            if (assetManager.getState() === jsb.AssetsManager.State.UNINITED) {
                // Resolve md5 url                
                var url = this._getNativeURL();
                url = this._transformURL(url);
                assetManager.loadLocalManifest(url);
            }

            this._failCount = 0;
            assetManager.update();
            // 
            this.cmd({msg: 'Starting...'}, HotupdateCommand.START_UPDATING);
            this._updating = true;
        }
    },

    /**
     * 
     */
    restart(){
        this.cmd({msg: 'Restarting...'}, HotupdateCommand.SHOW_MESSAGE);
        cc.audioEngine.stopAll();
        cc.game.restart();
    },
    
    /**
     * 
     */
    retry(){
        var assetManager = this.getAssetManager();
        if (assetManager && !this._updating && this._canRetry) {
            // this.panel.retryBtn.active = false;
            this._canRetry = false;            
            // this.panel.info.string = 'Retry failed Assets...';
            this.cmd({msg:'Retry failed Assets...'}, HotupdateCommand.RETRY_UPDATING);            
            assetManager.downloadFailedAssets();
        }
    },

    /**
     * 
     */
    getAssetManager(){
        if(!this._am){
            // Hot update is only available in Native build
            if (!cc.sys.isNative) {
                CC_DEBUG && cc.log("Không phải native !");
                this.cmd({msg:'Only support for native devices.'}, HotupdateCommand.HOTUPDATE_SKIPPED);
                return;
            }
            // 
            this._storagePath = ((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'x9project-remote-asset');
            cc.log('Storage path for remote asset : ' + this._storagePath);

            // Init with empty manifest url for testing custom manifest
            this._am = new jsb.AssetsManager('', this._storagePath, this.__versionCompareHandle.bind(this));
            this._am.setVerifyCallback(this.__assetVerifyHanlder.bind(this));
            
            // this.cmd({msg:'Hot update is ready, please check or directly update.'}, HotupdateCommand.SHOW_MESSAGE);

            if (cc.sys.os === cc.sys.OS_ANDROID) {
                // Some Android device may slow down the download process when concurrent tasks is too much.
                // The value may not be accurate, please do more test and find what's most suitable for your game.
                this._am.setMaxConcurrentTask(2);
                // 
                // this.cmd({msg:'Max concurrent tasks count have been limited to 2'}, HotupdateCommand.SHOW_MESSAGE);               
            }         
            
        }
        return this._am;
    },
    
    /**
     * 
     */
    onRemove(){
        if (this._updateListener) {
            this._am.setEventCallback(null);
            this._updateListener = null;
        }
    },

    //-----------------------
    // 
    //-----------------------

    /**
     * 
     * @param {*} url 
     */
    _transformURL (url) {
        url = url.replace(/.*[/\\][0-9a-fA-F]{2}[/\\]([0-9a-fA-F-]{8,})/, function (match, uuid) {
            var bundle = cc.assetManager.bundles.find(function (bundle) {
                return bundle.getAssetInfo(uuid);
            });
            let hashValue = '';
            if (bundle) {
                var info = bundle.getAssetInfo(uuid);
                if (url.startsWith(bundle.base + bundle._config.nativeBase)) {
                    hashValue = info.nativeVer;
                }
                else {
                    hashValue = info.ver;
                }
            }
            return hashValue ? match + '.' + hashValue : match;
        });
        return url;
    },


    /**
     * 
     */
    _getNativeURL(){
        if(!this.manifestUrl) {
            throw new Error(this.constructor.name + ": Chưa khai báo đường dẫn file project manifest !")
        }else if(!(this.manifestUrl instanceof cc.Asset)){
            throw new Error(this.constructor.name + ": Sai kiểu manifest, phải là cc.Asset !")
        }        
        return this.manifestUrl.nativeUrl;
    },


    /**
     * 
     * @param {*} event 
     */
    __onCheckUpdateHandler(event){
        var assetManager = this.getAssetManager();
        var dispatchType;
        if(assetManager){
            switch (event.getEventCode())
            {
                case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                    // this.panel.info.string = "No local manifest file found, hot update skipped.";
                    this.cmd({msg: 'No local manifest file found, hot update skipped.'}, HotupdateCommand.SHOW_MESSAGE);                    
                    dispatchType = HotupdateCommand.ERROR_NO_LOCAL_MANIFEST                    
                    break;
                case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
                case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                    this.cmd({msg: 'Fail to download manifest file, hot update skipped.'}, HotupdateCommand.SHOW_MESSAGE);
                    dispatchType = HotupdateCommand.ERROR_MANIFEST;
                    break;
                case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:                    
                    this.cmd({msg: 'Already up to date with the latest remote version.'}, HotupdateCommand.SHOW_MESSAGE);
                    dispatchType = HotupdateCommand.ALREADY_UP_TO_DATE;
                    break;

                case jsb.EventAssetsManager.NEW_VERSION_FOUND:
                    // this.panel.info.string = 'New version found, please try to update. (' + this._am.getTotalBytes() + ')';
                    this.cmd({msg: 'New version found, please try to update. (' + assetManager.getTotalBytes() + ')' }, HotupdateCommand.SHOW_MESSAGE);
                    dispatchType = HotupdateCommand.NEW_VERSION_FOUND,
                    this.cmd({
                                files:{percent: 0, total: assetManager.getTotalFiles()},
                                bytes:{percent: 0, total: assetManager.getTotalBytes()},                                
                            }, HotupdateCommand.UPDATE_PROGRESS);
                    break;

                default:
                    cc.log(assetManager + "Default " + event.getEventCode() + " : " + event.getMessage())
                    return;
            }
            
            assetManager.setEventCallback(null);
            this._checkListener = null;
            this._updating = false;

            if(dispatchType){
                this.cmd({}, dispatchType);
            }
            
        }
    },


    
    /**
     * 
     * @param {*} event 
     */
    __onUpdateHandler(event){
        var needRestart = false;
        var failed = false;
        var assetManager = this.getAssetManager();
        var dispatchType;
        if(assetManager){
            switch (event.getEventCode())
            {
                case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:                    
                    this.cmd({msg: 'No local manifest file found, hot update skipped.'}, HotupdateCommand.SHOW_MESSAGE);
                    failed = true;
                    dispatchType = HotupdateCommand.HOTUPDATE_SKIPPED;
                    break;

                case jsb.EventAssetsManager.UPDATE_PROGRESSION:
                    this.cmd({
                        files:{
                            percent: event.getPercentByFile(),
                            desc: event.getDownloadedFiles() + ' / ' + event.getTotalFiles(),
                        },
                        bytes:{
                            percent: event.getPercent(),
                            desc:  event.getDownloadedBytes() + ' / ' + event.getTotalBytes()
                        }
                    }, HotupdateCommand.UPDATE_PROGRESS);
                    var msg = event.getMessage();
                    if (msg) {
                        // this.panel.info.string = 'Updated file: ' + msg;
                        this.cmd({msg: 'Updated file: ' + msg}, HotupdateCommand.SHOW_MESSAGE);                        
                        // cc.log(event.getPercent()/100 + '% : ' + msg);
                    }
                    break;

                case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
                case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                    // this.panel.info.string = 'Fail to download manifest file, hot update skipped.';
                    this.cmd({msg: 'Fail to download manifest or did\'nt parse manifest file, hot update skipped.'}, HotupdateCommand.SHOW_MESSAGE);
                    failed = true;
                    dispatchType = HotupdateCommand.HOTUPDATE_SKIPPED;
                    break;

                case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                    // this.panel.info.string = 'Already up to date with the latest remote version.';
                    this.cmd({msg: 'Already up to date with the latest remote version.'}, HotupdateCommand.SHOW_MESSAGE);
                    failed = true;
                    dispatchType = HotupdateCommand.ALREADY_UP_TO_DATE;
                    break;

                case jsb.EventAssetsManager.UPDATE_FINISHED:
                    // this.panel.info.string = 'Update finished. ' + event.getMessage();
                    this.cmd({msg: 'Update finished. ' + event.getMessage()}, HotupdateCommand.SHOW_MESSAGE);                   
                    needRestart = true;
                    dispatchType = HotupdateCommand.UPDATE_FINISHED;
                    break;

                case jsb.EventAssetsManager.UPDATE_FAILED:
                    // this.panel.info.string = 'Update failed. ' + event.getMessage();
                    this.cmd({msg: 'Update failed. ' + event.getMessage()}, HotupdateCommand.SHOW_MESSAGE);                   
                    // this.panel.retryBtn.active = true;
                    this._updating = false;
                    this._canRetry = true;
                    dispatchType = HotupdateCommand.UPDATE_FAILED;
                    break;

                case jsb.EventAssetsManager.ERROR_UPDATING:
                    this.cmd({msg: 'Asset update error: ' + event.getAssetId() + ", " + event.getMessage()}, HotupdateCommand.SHOW_MESSAGE);
                    dispatchType = HotupdateCommand.ERROR_UPDATING;
                    break;

                case jsb.EventAssetsManager.ERROR_DECOMPRESS:
                    // this.panel.info.string = event.getMessage();
                    this.cmd({msg: 'Asset decompress error: ' + event.getMessage()}, HotupdateCommand.SHOW_MESSAGE);                    
                    dispatchType = HotupdateCommand.ERROR_UPDATING;
                    break;

                default:
                    break;

            }
        }
        if (failed) {
            assetManager.setEventCallback(null);
            this._updateListener = null;
            this._updating = false;
        }

        if (needRestart) {
            assetManager.setEventCallback(null);
            this._updateListener = null;
            // Prepend the manifest's search path
            var searchPaths = jsb.fileUtils.getSearchPaths();
            var newPaths = assetManager.getLocalManifest().getSearchPaths();
            // console.log(JSON.stringify(newPaths));
            Array.prototype.unshift.apply(searchPaths, newPaths);
            // This value will be retrieved and appended to the default search path during game startup,
            // please refer to samples/js-tests/main.js for detailed usage.
            // !!! Re-add the search paths in main.js is very important, otherwise, new scripts won't take effect.
            cc.sys.localStorage.setItem('X9ProjectPaths', JSON.stringify(searchPaths));
            jsb.fileUtils.setSearchPaths(searchPaths);

            this.restart();
            // cc.audioEngine.stopAll();
            // cc.game.restart();
        }

        if(dispatchType){
            this.cmd({}, dispatchType);
        }

    },

    /**
     * 
     * @param {*} versionA 
     * @param {*} versionB 
     */
    __versionCompareHandle(versionA, versionB){
        cc.log("JS Custom Version Compare: version A is " + versionA + ', version B is ' + versionB);
        var vA = versionA.split('.');
        var vB = versionB.split('.');

        for (var i = 0; i < vA.length; ++i) {
            var a = parseInt(vA[i]);
            var b = parseInt(vB[i] || 0);
            if (a === b) {
                continue;
            }
            else {
                return a - b;
            }
        }
        if (vB.length > vA.length) {
            return -1;
        }
        else {
            return 0;
        }

    },

    /**
     * 
     * @param {*} path 
     * @param {*} asset 
     */
    __assetVerifyHanlder(path, asset){
        // When asset is compressed, we don't need to check its md5, because zip file have been deleted.
        var compressed = asset.compressed;
        // Retrieve the correct md5 value.
        var expectedMD5 = asset.md5;
        // asset.path is relative path and path is absolute.
        var relativePath = asset.path;
        // The size of asset file, but this value could be absent.
        var size = asset.size;
        if (compressed) {
            // panel.info.string = "Verification passed : " + relativePath;
            this.cmd({msg: 'Verification passed :  ' + relativePath}, HotupdateCommand.SHOW_MESSAGE);
            return true;

        }else {
            // panel.info.string = "Verification passed : " + relativePath + ' (' + expectedMD5 + ')';
            this.cmd({msg: 'Verification passed :  ' + relativePath + '(' + expectedMD5 + ')'}, HotupdateCommand.SHOW_MESSAGE);
            return true;
        }
        return true;
    },

})