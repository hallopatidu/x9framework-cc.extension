var Dispatcher = cc.Class({    
    extends: cc.Class,
    properties:{
        _callbacks : {
            type: Object,
            default: null
        },
        _isDispatching :false,
        _isHandled : {
            type: Object,
            default: null
        },
        _isPending : {
            type: Object,
            default: null
        },
        _lastID: 1,
        _prefix: "x9store_"
        
    },

    statics:{
        __instance: null,
        instance(){            
            if(!this.__instance){
                this.__instance = new Dispatcher();
                this.__instance._isGlobal = true;
                this.__instance.name = 'global';
            }
            return this.__instance;
        }
    },

    ctor(){        
        this.__className = this.constructor.name;
        this._callbacks = Object.create(null);
        this._isDispatching = false;
        this._isHandled = Object.create(null);
        this._isPending = Object.create(null);
        this._lastID = 1;
        this._count = 0;
    },


    /**
     * Registers a callback to be invoked with every dispatched payload. Returns
     * a token that can be used with `waitFor()`.
     */
    register(callback) {
        var id = this._prefix + this._lastID++;
        this._callbacks[id] = callback;
        CC_DEBUG && this._count ++;
        return id;
    },

    /**
     * 
     * @param {*} id 
     */
    hasRegister(id){
        return this._callbacks[id] ? true : false;
    },

    /**
     * Removes a callback based on its token.
     */
    unregister(id) {
        !this._callbacks[id] ? CC_DEBUG ? cc.error( this.constructor.name + ".unregister(...): Bỏ đăng ký thất bại. Không tìm được callback nào tương ứng " + id) : cc.error(false) : undefined;
        delete this._callbacks[id];
        if(CC_DEBUG){
            if(this._count < 0) throw new Error("Đã xóa hết store trước đó !");
            this._count --;
            cc.log("-------- Unregister token : " + id + " - con lai " + this._count + " store.");
        }
    },

    /**
     * Waits for the callbacks specified to be invoked before continuing execution
     * of the current callback. This method should only be used by a callback in
     * response to a dispatched payload.
     */
    waitFor(ids) {
        !this._isDispatching ? CC_DEBUG ? cc.error( this.constructor.name + ".waitFor(...): Hàm chỉ sử dụng trong lúc dispatch. Ví dụ: trong hàm callback trả về payload") : cc.error(false) : undefined;
        for (var ii = 0; ii < ids.length; ii++) {
            var id = ids[ii];
            if (this._isPending[id]) {                
                !this._isHandled[id] ? CC_DEBUG ? cc.error( this.constructor.name + ".waitFor(...): Phát hiện lỗi lặp vòng tròn (A đợi B, B đợi A) ' + 'trong lức chờ `" + id + "`.") : cc.error(false) : undefined;
                continue;
            }
            !this._callbacks[id] ? CC_DEBUG ? cc.error( this.constructor.name + ".waitFor(...): Không tìm được callback nào tương ứng `" + id + "`.") : cc.error(false) : undefined;
            this._invokeCallback(id);
        }
    },

    /**
     * Dispatches a payload to all registered callbacks.
     */
    dispatch(payload) {        
        !!this._isDispatching ? CC_DEBUG ? cc.error( this.constructor.name + ".dispatch(...): Không thể xen giữa khi sự kiện dispatch trước đó chưa kết thúc.") : cc.error(false) : undefined;        
        this._startDispatching(payload);
        try {
            for (var id in this._callbacks) {
                if (this._isPending[id]) {
                    continue;
                }
                this._invokeCallback(id);
            }
        } finally {
            this._stopDispatching();
        }
    },

    /**
     * Is this Dispatcher currently dispatching.
     */
    isDispatching() {
        return this._isDispatching;
    },

     /**
     * Call the callback stored with the given id. Also do some internal
     * bookkeeping.
     *
     * @internal
     */
    _invokeCallback(id) {
        this._isPending[id] = true;
        this._callbacks[id](this._pendingPayload);
        this._isHandled[id] = true;
    },

     /**
     * Set up bookkeeping needed when dispatching.
     *
     * @internal
     */
    _startDispatching(payload) {
        for (var id in this._callbacks) {
            this._isPending[id] = false;
            this._isHandled[id] = false;
        }
        this._pendingPayload = payload;
        this._isDispatching = true;
    },


    /**
     * Clear bookkeeping used for dispatching.
     *
     * @internal
     */
    _stopDispatching() {
        delete this._pendingPayload;
        this._isDispatching = false;
    }



});

