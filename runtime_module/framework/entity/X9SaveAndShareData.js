
const SAVEANDSHARE_URI = 'x9data://';
const DATA_NODE_NAME = 'share-data';
/**
 * Tính năng save và share data cho X9Cmd và X9Com.
 * Auto Save : tự động save data vào local stogare
 * Auto Share : chia sẻ data trên root 
 * Sẽ bổ sung tính năng encrypt dữ liệu sau.
 * 
 */
const X9SaveAndShareData = cc.Class({
    extends: cc.Class,

    statics:{
        SEPARATE : '::',
    },

    ctor(){
        this._state = Object.create(null);
        this.encryptKey = null;
    },

    /**
     * Constructs the initial state for this store. This is called once during
     * construction of the store.
     */
    getInitialState() {
        this.sync();
        return this._state ? this._state : Object.create(null);
    },
    
    //----------------
    // Override
    //----------------

    /**
     * 
     * @param {*} data 
     */
    share(data){
        let dataURIArr = this._splitDataIdToArray();// className::uuid
        let uuid = dataURIArr[1];
        let dataId = dataURIArr[0];        
        if(uuid){
            if(!this._getDataNode()[dataId]){
                this._getDataNode()[dataId] = {};
            }
            let nodeData = this._getDataNode()[dataId]; // class             
            nodeData[uuid] = Object.assign(nodeData[uuid] || {}, (data || this.getState()) );
        }else{
            // hiem khi xay ra.
            this._getDataNode()[dataId] = Object.assign({}, (data || this.getState()) );
        }
    },

    unshare(){
        let dataURIArr = this._splitDataIdToArray();// className::uuid
        let uuid = dataURIArr[1];
        let dataId = dataURIArr[0];
        let nodeData = this._getDataNode()[dataId];
        if(uuid && nodeData[uuid]){
            nodeData[uuid] = null;
        }else{
            this._getDataNode()[dataId] = null;
        }
    },

    /**
     * Truoc khi lưu vào storage, sẽ share data trước.
     * Việc lưu vào storage sẽ lưu tổng hợp theo class.
     * @param {*} data 
     */
    save(data){
        let dataURIArr = this._splitDataIdToArray();// className::uuid        
        let dataId = dataURIArr[0];
        let saveData = data || this.getState();
        let lastSave = cc.sys.localStorage.getItem(dataId);
        lastSave = lastSave ? JSON.parse(lastSave) : null;
        saveData = lastSave ? Object.assign(lastSave, saveData) : saveData;
        cc.sys.localStorage.setItem(dataId, this._validateData(saveData));
    },

    unsave(){
        let dataURIArr = this._splitDataIdToArray();// className::uuid
        // let uuid = dataURIArr[1];
        let dataId = dataURIArr[0];
        // let jsonData = 
        // let saveData = JSON.parse(cc.sys.localStorage.getItem(dataId));
        // let saveData = JSON.parse(cc.sys.localStorage.getItem(dataId) || Object.create(null))
        // if(saveData && uuid){
        //     delete saveData[uuid];
        // }
        // if(saveData && Object.keys(saveData).length){
        //     cc.sys.localStorage.setItem(dataId, this._validateData(saveData));            
        // }else{            
        //     cc.sys.localStorage.removeItem(dataId);
        // }
        cc.sys.localStorage.removeItem(dataId);
        // 
    },

    /**
     * Đồng bộ data của scene trước với scene sau nếu cùng Component cấu thành.
     * Việc đồng bộ xảy ra cả ở share lẫn lấy từ localstorage.
     * @param {Boolean} mergeAllSubClassData Nếu true sẽ lấy toàn bộ data của các Class là subclass của component này.
     * Lưu ý:
     * Lấy cả dữ liệu save vào localStorage.
     */
    sync(mergeAllSubClassData){
        let state = this.getState();
        if(mergeAllSubClassData){
            let currentClass = cc.js.getClassByName(this.constructor.name);
            let classChainList = [currentClass].concat(cc.Class.getInheritanceChain(currentClass));
            for (let index = 0; index < classChainList.length; index++) {
                const klass = classChainList[index];
                if(klass){
                    let className = cc.js.getClassName(klass);
                    let data = this._getDataNode()[className];
                    if(data){
                        // sync toan bo data[uuid] vao state.
                        for (const uuid in data) {
                            if (data.hasOwnProperty(uuid)) {
                                const compData = data[uuid];
                                if(compData){
                                    state = Object.assign(state, compData);
                                }
                            }
                        }
                    }                    
                }
            }           

        }else{
            let data = this.getData();
            // data = data && data[this.uuid] ? data[this.uuid] : data; 
            state = data ? Object.assign(state, data) : state;            
        }

        this._state = state;
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
        
        let data = this._getDataNode()[dataId];
        if(uuid && data){
            data = data[uuid]
        }else if(data && typeof data === 'object'){
            let keys = Object.keys(data);
            data = keys.length == 1 ? data[keys[0]] : data;
        }
        // Khong co moi lay tu storage
        if(!data){
            // Luôn lưu trực tiếp vào class.
            data = cc.sys.localStorage.getItem(dataId) 
            data = data ? JSON.parse( data ) : null;            
            // data = (data && uuid) ? data[uuid] : data;
        }
        // 
        return data;
    },


    _splitDataIdToArray(id){
        let uuid = null;
        let dataId = this._validateId(id);
        if(dataId.indexOf(X9SaveAndShareData.SEPARATE) !== -1){
            let dataIdArr = dataId.split(X9SaveAndShareData.SEPARATE);
            dataId = dataIdArr[0];
            uuid = dataIdArr[1];
        }
        return [dataId, uuid];
    },
 
    _validateId(id){        
        // Do not encript uri by Hash
        return SAVEANDSHARE_URI + (id ? id : (this.constructor.name + X9SaveAndShareData.SEPARATE + this.uuid));
    },

    
    _validateData(data, keyPass){
        let dataObj = data ? data : this.getState();
        return JSON.stringify(dataObj);
    },

    _getDataNode(){
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
        return shareDataNode;
    },

})