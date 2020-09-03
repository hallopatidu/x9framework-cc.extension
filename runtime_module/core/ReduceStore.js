var Store = require("Store");

cc.Class({
        extends: Store,

        /**
         * 
         */
        onInit(){ 
            // this._super();
            this._state = this.getInitialState();
        },

        /**
         * 
         * @param {*} newState 
         */
        onChange(newState){
            // override 
        },

        /**
         * 
         */
        onRemove(){
            this._super();
            this._state = null;
        },

        
        /**
         * Getter that exposes the entire state of this store. If your state is not
         * immutable you should override this and not expose _state directly.
         */
        getState() { 
            return this._state;
        },

        /**
         * Constructs the initial state for this store. This is called once during
         * construction of the store.
         */
        getInitialState() {
            // return abstractMethod('ReduceStore', 'getInitialState');
            try{             
                throw new Error( this.constructor.name + ".getInitialState :: Cần có thủ tục khởi tạo State ban đầu.")
            }catch(error){
                cc.error(error);
            }
            return null;
        },

        
        /**
         * Used to reduce a stream of actions coming from the dispatcher into a
         * single state object.
         */
        reduce(state, payload) {
            // return abstractMethod('ReduceStore', 'reduce');                       
            throw new Error( this.constructor.name + ".reduce :: Override hàm này để có thủ tục reduce các trạng thái của Store.")            
            return state;
        },

        /**
         * Checks if two versions of state are the same. You do not need to override
         * this if your state is immutable.
         */
        areEqual(one, two) {
            return one === two;
        },

        /**
         * 
         * @param {*} payload 
         */
        _prepareInvokeOnDispatch(payload){
            // 
        },

        /**
         * This method override super.__invokeOnDispatch and encapsulates all logic for invoking __onDispatch. It should
         * be used for things like catching changes and emitting them after the
         * subclass has handled a payload.
         */
        __invokeOnDispatch(payload) {
            this._prepareInvokeOnDispatch(payload);
            this._super(payload);
        },

                
        /**
         * The callback that will be registered with the dispatcher during
         * instantiation. Subclasses must override this method. This callback is the
         * only way the store receives new data.
         */
        __onDispatch(payload) {        
            // Reduce the stream of incoming payload to state, update when necessary.
            var startingState = this._state;
            var endingState = this.reduce(startingState, payload);
        
            // This means your ending state should never be undefined.            
            !(endingState !== undefined) ? CC_DEBUG ? cc.error(this.constructor.name + '.reduce(...) trả về giá trị chưa xác định, phải chăng đồng chí có quên trả về giá trị state trong trường hợp mặc định ? (nếu không thích trả về thì nên để là return null)') : cc.error(false) : undefined;
        
            if (!this.areEqual(startingState, endingState)) {
              this._state = endingState;
        
              // `__emitChange()` sets `this.__changed` to true and then the actual
              // change will be fired from the emitter at the end of the dispatch, this
              // is required in order to support methods like `hasChanged()`
              this.__emitChange();
            }
        },

        /**
         * 
         */
        __emitChange() {
            this._super();
            this.onChange(this.getState());
        },

})