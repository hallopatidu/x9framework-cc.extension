
const Dispatcher = require('Dispatcher');


var X9Dispatcher = cc.Class({
    extends: Dispatcher,
    statics:{
        __instance: null,
        instance(){            
            if(!this.__instance){
                this.__instance = new X9Dispatcher();
                this.__instance._isGlobal = true;
                this.__instance.name = 'global';
            }
            return this.__instance;
        }
    },

    continue(){
        
    },

     /**
     * Call the callback stored with the given id. Also do some internal
     * bookkeeping.
     *
     * @internal
     */
    // _invokeCallback(id) {
    //     this._isPending[id] = true;
    //     // thay the bang chuoi promise 
    //     this._callbacks[id](this._pendingPayload);
    //     // 
    //     this._isHandled[id] = true;
    // },

     /**
     * Set up bookkeeping needed when dispatching.
     *
     * @internal
     */
    // _startDispatching(payload) {
    //     this._super(payload);
    // },

    /**
     * Clear bookkeeping used for dispatching.
     *
     * @internal
     */
    _stopDispatching() {
        // 
        this._super();

    }

    // cap nhat data truoc

 })