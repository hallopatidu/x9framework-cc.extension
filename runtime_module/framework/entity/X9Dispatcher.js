
const Dispatcher = require('Dispatcher');


const X9Dispatcher = cc.Class({
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

    dispatch(payload) {
        if(this._isDispatching){
            if(!this.__payloadQueue){
                this.__payloadQueue = [];
            }
            this.__payloadQueue.push(payload);
        }else{
            this._super(payload)
        }
    },

    /**
     * Clear bookkeeping used for dispatching.
     *
     * @internal
     */
    _stopDispatching() {
        // 
        this._super();
        if(this.__payloadQueue && this.__payloadQueue.length){
            let payload = this.__payloadQueue.shift();
            this.dispatch(payload);
        }else{
            delete this.__payloadQueue;
        }
    }


 })