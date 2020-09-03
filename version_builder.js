const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const archiver = require('archiver');
const http = require('http');
const https = require('https');
// const { relative } = require('path');

// var destFolderName = 'remote-assets';
var destFolderName = '';

class VersionBuilder {
    constructor(exportToZip){        
        this.manifest = {
            packageUrl: 'http://127.0.0.1:8080/x9project/' + destFolderName,
            remoteManifestUrl: 'http://127.0.0.1:8080/x9project/' + destFolderName + '/project.manifest',
            remoteVersionUrl: 'http://127.0.0.1:8080/x9project/' + destFolderName + '/version.manifest',
            version: '1.0.0',
            assets: {},
            searchPaths: []
        };        
        this.exportToZip = exportToZip ? true : false;
    }

    setProjectName(projectName){        
        this.projectName = projectName ? projectName : 'x9project'
    }

    /**
     * 
     * @param {*} packageName 
     * @param {*} remoteServer 
     * @param {*} buildPath 
     * @param {*} destPath 
     */
    initNewVersion(packageName, remoteServer , buildPath, destPath){
        Editor.log("Khởi tạo version mới.");
        if(!packageName){
            throw new Error("Không có package name nên không build được.")
        }
        this.buildPath = buildPath;
        this.destPath = destPath;
        this.packageName = this._getMd5(packageName).substr(-8,8);//packageName;
        this.remoteAssetsRelativePath = this.packageName + (destFolderName.length ? '/' : '') + destFolderName;

        var hostURL = remoteServer || 'http://127.0.0.1:8080';
        var packageUrl = hostURL + '/' + this.remoteAssetsRelativePath;

        this.manifest = {
            packageUrl: packageUrl,
            remoteManifestUrl: packageUrl + '/project.manifest',
            remoteVersionUrl: packageUrl + '/version.manifest',
            version: '1.0.0',
            assets: {},
            searchPaths: []
        };

        Editor.log("Kiểm tra version trên remote server " + this.manifest.remoteVersionUrl);
        // Lấy version trên remote server về và so sánh tìm ra version mới hơn..
        this._loadAndCheckVersion(this.manifest.remoteVersionUrl ,(err, dataObj)=>{
            if(err){
                Editor.log("Không xác định được version trên remote server. " ,err);
            }else{
                let version = dataObj.version;
                if(version) {
                    Editor.log("Phiên bản hiện tại trên remote server là " + version);
                    this.manifest.version = this._nextVersion(version);
                }               
            }
            // 
            if(this.onReady){
                Editor.log("Vẫn đang build ...");
                this.onReady();
                this.onReady = null;
            }

        })
        
        return this;
    }

    /**
     * 
     */
    generateVersion(done){
        if(this.buildPath && this.destPath && this.packageName && this.manifest){            
            var archive;
            if(this.exportToZip){
                let zipPath = this.buildPath + '/'+ this.projectName + '_' + this.manifest.version + '.zip';
                try {
                    if(fs.existsSync(zipPath)){
                        fs.unlinkSync(zipPath);
                    }
                }catch(err){
                    throw err;
                }
                let output = fs.createWriteStream(zipPath);
                archive = archiver('zip', {
                    zlib: { level: 9 } // Sets the compression level.
                });

                // output.on('close', function() {
                //     Editor.log(archive.pointer() + ' total bytes');
                //     Editor.log('archiver has been finalized and the output file descriptor has closed.');
                // });
                output.on('close', done);

                // output.on('end', function() {
                //     Editor.log('Data has been drained');
                // });
                output.on('end', done);

                archive.on('warning', function(err) {
                    if (err.code === 'ENOENT') {
                      // log warning
                      Editor.log(err)
                    } else {
                      // throw error
                      throw err;
                    }
                });

                archive.on('error', function(err) {
                    throw err;
                })
                archive.pipe(output);
            }
            
            // Iterate assets and src folder
            let srcPath = path.join(this.destPath, 'src');
            let assetPath = path.join(this.destPath, 'assets');

            this._readDir(srcPath, this.manifest.assets, archive);
            this._readDir(assetPath, this.manifest.assets, archive);
            
            if(this.exportToZip){                
                // nen file          
                Editor.log("Đóng gói một bản .zip trong " + this.buildPath + " với phiên bản tiếp theo " + this.manifest.version);; 
                let projectManifest = Object.assign({}, this.manifest);                
                archive.append(JSON.stringify(projectManifest), {name: path.join(this.remoteAssetsRelativePath, 'project.manifest') });
                delete this.manifest.assets;
                delete this.manifest.searchPaths;
                archive.append(JSON.stringify(this.manifest), {name: path.join(this.remoteAssetsRelativePath, 'version.manifest') });                
                archive.finalize();
            }else{
                // tao file project manifest va version manifest
                let updatePackage = path.join(this.buildPath, this.packageName);            
                let hotupdatePath = path.join(updatePackage, destFolderName);
                var destManifest = path.join(hotupdatePath, 'project.manifest');
                var destVersion = path.join(hotupdatePath, 'version.manifest');
                
                this._mkdirSync(updatePackage, archive);
                this._mkdirSync(hotupdatePath, archive);

                fs.writeFile(destManifest, JSON.stringify(this.manifest), (err) => {
                    if (err) throw err;
                    console.log('Manifest successfully generated');

                });

                delete this.manifest.assets;
                delete this.manifest.searchPaths;
                fs.writeFile(destVersion, JSON.stringify(this.manifest), (err) => {
                    if (err) throw err;                    
                    if(done){
                        done();
                    }
                });
            }
            
        }
    }

    //------------------
    // 
    //------------------

    /**
     * 
     * @param {*} dir 
     * @param {*} obj 
     */
    _readDir (dir, obj, archive) {
        if(!this.destPath){
            throw new Error("Can co destPath de chay _readDir")
        }
        var stat = fs.statSync(dir);        
        if (!stat.isDirectory()) {            
            return;
        }
        
        var subpaths = fs.readdirSync(dir), subpath, size, md5, compressed, relative;              
        for (var i = 0; i < subpaths.length; ++i) {
            if (subpaths[i][0] === '.') {
                continue;
            }
            subpath = path.join(dir, subpaths[i]);
            stat = fs.statSync(subpath);           

            if (stat.isDirectory()) {
                this._readDir(subpath, obj, archive);
            }
            else if (stat.isFile()) {
                // Size in Bytes
                size = stat['size'];
                md5 = this._getMd5(fs.readFileSync(subpath));
                compressed = path.extname(subpath).toLowerCase() === '.zip';
    
                relative = path.relative(this.destPath, subpath);
                relative = relative.replace(/\\/g, '/');
                relative = encodeURI(relative);
                obj[relative] = {
                    'size' : size,
                    'md5' : md5
                };
                if (compressed) {
                    obj[relative].compressed = true;
                }

                if(archive){
                    archive.file(subpath, {name: path.join(this.remoteAssetsRelativePath, relative)});
                }

            }

        }
    }

    /**
     * 
     * @param {*} path 
     */
    _mkdirSync(path, archive) {
        try {
            fs.mkdirSync(path);
            
        } catch(e) {
            if ( e.code != 'EEXIST' ) throw e;
        }
    }

    /**
     * 
     * @param {*} content 
     */
    _getMd5(content){
        return crypto.createHash('md5').update(content).digest('hex');
    }


    /**
     * 
     * @param {*} url 
     * @param {*} done 
     */
    _loadAndCheckVersion(url, done){
        let isHttps = Boolean(url.indexOf("https") == 1);
        let requestHub = isHttps ? https : http; 
        requestHub.get(url, (response)=>{
            // response.pipe(file);
            var data = '';
            // A chunk of data has been recieved.
            response.on('data', (chunk) => {
                data += chunk;
            });
            // 
            response.on('end', () => {
                if(done){
                    try{
                        done(null, JSON.parse(data));
                    }catch(err){
                        err.message = "File " + jsonURL + " lỗi cú pháp json. Chi tiết: " + err.message;
                        done(err, null);
                    }                    
                };
            });
            //
        }).on("error", (err) => {
            if(done){
                done(err, null);
            }
        });
    }

    /**
     * 
     * @param {*} version 
     * @param {*} position 
     */
    _nextVersion(version, position) {        
        var vA = version.split('.');
        var editIndex = position ? position : (vA.length - 1);
        var lastIndex = parseInt(vA[editIndex] || 0 ) + 1;
        if(lastIndex > 99 && position > 0){
            vA[vA.length - 1] = 1;
            return this._nextVersion(vA.join('.'), position - 1);
        }
        vA[vA.length - 1] = lastIndex;
        return vA.join('.');
    }

}

module.exports = VersionBuilder;