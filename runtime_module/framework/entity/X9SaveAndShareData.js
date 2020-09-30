
const X9LocalData = require('X9LocalData');

/**
 * Tính năng save và share data cho X9Cmd và X9Com.
 * Auto Save : tự động save data vào local stogare
 * Auto Share : chia sẻ data trên root 
 * Sẽ bổ sung tính năng encrypt dữ liệu sau.
 * 
 */
const X9SaveAndShareData = cc.Class({
    extends: cc.Class,
    mixins:[X9LocalData],
    
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
        let dataNode = this._getDataNode();      
        if(uuid){
            if(!dataNode[dataId]){
                dataNode[dataId] = Object.create(null);
            }
            let nodeData = dataNode[dataId]; // class
            nodeData[uuid] = Object.assign(nodeData[uuid] || Object.create(null), JSON.parse( JSON.stringify( data || this.getState() ) ) );
        }else{
            // hiem khi xay ra.
            dataNode()[dataId] = JSON.parse( JSON.stringify(data || this.getState()) ) ;
        }
    },

    /**
     * 
     */
    unshare(){
        let dataURIArr = this._splitDataIdToArray();// className::uuid
        let uuid = dataURIArr[1];
        let dataId = dataURIArr[0];
        let nodeData = this._getDataNode()[dataId];
        if(uuid && nodeData[uuid]){
            nodeData[uuid] = null;
        }else{
            this._getDataNode()[dataId] = null;
            delete this._getDataNode()[dataId];
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

    /**
     * 
     */
    unsave(){
        let dataURIArr = this._splitDataIdToArray();
        let dataId = dataURIArr[0];
        cc.sys.localStorage.removeItem(dataId);
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


})