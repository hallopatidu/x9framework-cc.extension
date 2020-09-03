
const SAVEANDSHARE_URI = 'x9data://';
const DATA_NODE_NAME = 'share-data';
/**
 * Tính năng save và share data cho X9Cmd và X9Com.
 * Auto Save : tự động save data vào local stogare
 * Auto Share : chia sẻ data trên root 
 * Sẽ bổ sung tính năng encrypt dữ liệu sau.
 * 
 */
cc.Class({
    extends: cc.Class,

    ctor(){
        this._state = Object.create(null);
        this.encryptKey = null;
        // setTimeout(this.sync.bind(this), 200);
        // this.sync();
    },
    
    //----------------
    // Override
    //----------------

    /**
     * 
     * @param {*} data 
     */
    share(data){
        this._getStateNode()[this._validateId()] = this._validateData(data);
    },

    unshare(){
        this._getStateNode()[this._validateId()] = null;
    },

    /**
     * Truoc khi lưu vào storage, sẽ share data trước.
     * @param {*} data 
     */
    save(data){
        cc.sys.localStorage.setItem(this._validateId(), this._validateData(data));
    },

    unsave(){
        cc.sys.localStorage.removeItem(this._validateId());
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
        let currentClass = cc.js.getClassByName(this.constructor.name);
        let classChainList = mergeAllSubClassData ? [currentClass].concat(cc.Class.getInheritanceChain(currentClass)) : [currentClass];
        for (let index = 0; index < classChainList.length; index++) {
            const klass = classChainList[index];
            if(klass){
                let className = cc.js.getClassName(klass);
                let data = this.getData(className);
                if(data){
                    state = Object.assign(state, data);
                }
            }
        }
        this._state = state;
    },

    /**
     * Lấy share data trước. Nếu không có sẽ lấy vào từ localStorage.
     * @param {String} id // X9 component class name
     */
    getData(id){        
        // Tim share data truoc.
        let dataId = this._validateId(id);
        let data = this._getDataNode()[id];
        // Khong co moi lay tu storage
        data = data ? data : cc.sys.localStorage.getItem(dataId);
        return data;
    },
 
    _validateId(id){
        return SAVEANDSHARE_URI + (id ? id : this.constructor.name);
    },

    
    _validateData(data, keyPass){
        return data ? data : JSON.stringify(this.getState());
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