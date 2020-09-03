var Dispatcher = require("Dispatcher");
cc.Class({
    extends: cc.Class,
    properties:{
        __className: "",
        __changed: false,
        __dispatcher: null,        
        _dispatchToken:null
    },

    //------------------
    //  Life Circle
    //------------------
    ctor(){        
        this.__className = this.constructor.name;
    },

    /**
     * 
     */
    onInit(){        
        cc.error(this.constructor.name + ".onInit(): Cần override trong sử dụng hàm này.")
    },

    /**
     * 
     */
    onRemove(){
        if(this.__dispatcher && this._dispatchToken){
            cc.log('Unregister Dispatcher ' + this.constructor.name)
            this.__dispatcher.unregister(this._dispatchToken);            
        } 
        this.__dispatcher = null;
        this._dispatchToken = null;
    },

    
    //----------------------------
    // Feature Function
    //----------------------------

    /**
     * 
     */
    getDispatcher(){
        if(!this.__dispatcher ){
            this.__dispatcher = Dispatcher.instance();
        }
        return this.__dispatcher;
    },

    /**
     * 
     * @param {*} target 
     */
    setDispatcher(dispatcher, isForce){
        // 
        if(dispatcher){
            !(dispatcher instanceof Dispatcher) ? CC_DEBUG ? cc.error(this.constructor.name + ".setDispatcher(dispatcher): Dispatcher truyền vào phải khác là subclass của Dispatcher") : cc.error(false) : undefined;
            if(!this._dispatchToken){                
                this.__dispatcher = dispatcher;
                cc.log('Dang ky dispatcher '+ this.__dispatcher.name +' cho ' + this.constructor.name)
                this._dispatchToken = this.__dispatcher.register((payload)=>{
                    this.__invokeOnDispatch(payload);
                });

            }else{
                if(isForce){
                    // Gỡ dispatcher cũ.
                    cc.log('Gỡ dispatcher cũ: ' + this.constructor.name)
                    if(this.__dispatcher){
                        this.__dispatcher.unregister(this._dispatchToken);
                    } 
                    this._dispatchToken = null;
                    // Gán lại dispatcher
                    this.setDispatcher(dispatcher);
                }
            } 
            // dispatcher.test();                   
        }else{
            (!dispatcher && this.__dispatcher) ? CC_DEBUG ? cc.log(this.constructor.name + ".setDispatcher(dispatcher): Sử dụng Dispatcher mặc định.") : cc.error(false) : undefined;
        }        
    },

    /**
     * This exposes a unique string to identify each store's registered callback.
     * This is used with the dispatcher's waitFor method to declaratively depend
     * on other stores updating themselves first.
     */
    getDispatchToken(){
        return this._dispatchToken;
    },

    /**
     * Returns whether the store has changed during the most recent dispatch.
     */
    hasChanged(){
        !this.getDispatcher().isDispatching() ? CC_DEBUG ? cc.error( this.constructor.name + ".hasChanged(): Hàm này chỉ được gọi lúc đang dispatching.") : cc.error(false) : undefined;
        return this.__changed;
    },

    waitFor(token){
        this.getDispatcher().waitFor([token])
    },

    // ------------------------------------------------------------------------
    // Internal Function
    //  _  : Tiền tố dành cho các function gọi trực tiếp trong class.
    //  __ : Tiền tố dành cho các function dạng gọi bất thường hoặc handler.
    // ------------------------------------------------------------------------

    __emitChange() {        
        !this.getDispatcher().isDispatching() ? CC_DEBUG ? cc.error( this.constructor.name + ".__emitChange(): Hàm này chỉ được gọi lúc đang dispatching.") : cc.error(false) : undefined;
        this.__changed = true;
    },


     /**
     * This method encapsulates all logic for invoking __onDispatch. It should
     * be used for things like catching changes and emitting them after the
     * subclass has handled a payload.
     */
    __invokeOnDispatch(payload) {
        this.__changed = false;
        this.__onDispatch(payload);
    },

    /**
     * The callback that will be registered with the dispatcher during
     * instantiation. Subclasses must override this method. This callback is the
     * only way the store receives new data.
     */
    __onDispatch(payload) {        
        !false ? CC_DEBUG ? cc.error( this.constructor.name + ' đồng chí đã quên overridden hàm __onDispatch(), việc làm này là bắt buộc') : cc.error(false) : undefined;
    }

});