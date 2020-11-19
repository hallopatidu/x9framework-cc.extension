
const DATA_URI = 'x9data://';
const DATA_NODE_NAME = 'share-data';
/**
 * Tính năng save và share data cho X9Cmd và X9Com.
 * Auto Save : tự động save data vào local stogare
 * Auto Share : chia sẻ data trên root 
 * Sẽ bổ sung tính năng encrypt dữ liệu sau.
 * 
 */
const X9LocalData = cc.Class({
    extends: cc.Class,

    statics:{
        SEPARATE : '::',
    },
    

    /**
     * Lấy share data trước. Nếu không có sẽ lấy vào từ localStorage.
     * Lưu ý:
     * - Muốn lấy data từ localStorage phải biết thêm chính xác uuid của X9Component đó. Ví dụ: X9Component::Com.61
     * @param {String} id // X9 component class name
     */
    getData(id){        
        let dataURIArr = this._splitDataIdToArray(id);
        let uuid = dataURIArr[1];
        let dataId = dataURIArr[0];
        let dataNode = this._getDataNode()
        let data = dataNode[dataId];
        if(uuid && data){
            data = data[uuid]
            if(!data){
                let classDataId = dataId.replace(DATA_URI,'');
                return (classDataId != id) ? this.getData(classDataId) : null;
            }
        }else if(data && typeof data === 'object'){
            let keys = Object.keys(data);
            data = keys.length == 1 ? data[keys[0]] : data;
        }
        // Khong co moi lay tu storage.
        let storageData = cc.sys.localStorage.getItem(dataId);
            storageData = storageData ? JSON.parse( storageData ) : null;
        data = storageData ? (data ? Object.assign( data, storageData ) : storageData) : data;
        // 
        return data;
    },


    _splitDataIdToArray(id){
        let uuid = null;
        let dataId = this._validateId(id);
            dataId = id ? dataId : (dataId + X9LocalData.SEPARATE + this.uuid) ;
        if(dataId.indexOf(X9LocalData.SEPARATE) !== -1){
            let dataIdArr = dataId.split(X9LocalData.SEPARATE);
            dataId = dataIdArr[0];
            uuid = dataIdArr[1];
        }
        return [dataId, uuid]; 
    },
 
    _validateId(id){        
        // Do not encript uri by Hash
        let className = this.__className || cc.js.getClassName(this.constructor);
        return DATA_URI + (id ? id : className);
    },
    
    _validateData(data, keyPass){
        let dataObj = data ? data : this.getState();
        return JSON.stringify(dataObj);
    },

    _getDataNode(){
        // if(!this._shareDataNode){
        var shareDataNode = cc.find(DATA_NODE_NAME);
        // cc.log("state node:: " + shareDataNode)
        if(!shareDataNode){            
            shareDataNode = new cc.Node(DATA_NODE_NAME);
            shareDataNode.name = DATA_NODE_NAME;
            cc.game.addPersistRootNode(shareDataNode);
            shareDataNode.addComponent = function(typeOrClassName) {
                if(CC_EDITOR) {Editor.error("Không add bất cứ thứ gì vào node " + shareDataNode.name) }
                else {throw new Error("Không add bất cứ thứ gì vào node " + shareDataNode.name);}
                return null
            }
        }
        // this._shareDataNode = shareDataNode;
        // }
        // return this._shareDataNode;
        return shareDataNode
    },

})