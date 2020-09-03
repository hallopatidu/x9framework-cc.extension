var Dispatcher = require("Dispatcher")

/**
 * Action class
 * - Gọi dispatcher dispatch các payload object gửi object đó tới các store được đăng ký với dispatcher. 
 * - Nên đặt các Command là duy nhất để tránh trùng lặp.
 * Lưu ý:
 * - Chỉ nên dùng một đối tượng duy nhất trên cùng một node.
 * - Mặc định sử dụng Dispatcher.instance cho đến khi được set dispatcher mới.
 */
cc.Class({
    extends: cc.Class,

    properties:{       
        __dispatchers: null,
    },

    ctor(){
        // cc.log(this.constructor.name + "::UUID : " + this.uuid);
    },
    
    /**
     * 
     */
    getDispatchers(){
        if(!this.__dispatchers ){
            this.__dispatchers = [];
        }
        return this.__dispatchers;
    },

    /**
     * 
     * @param {*} dispatcher 
     */
    setDispatcher(dispatcher){
        !(dispatcher && dispatcher instanceof Dispatcher) ? CC_DEBUG ? cc.error(this.constructor.name + ".setDispatcher(dispatcher): Dispatcher truyền vào phải khác là subclass của Dispatcher") : cc.error(false) : this.getDispatchers().push(dispatcher);        
    },

    /**
     * Hàm chuyên dụng để dispatch.
     * Dispatch với một hoặc nhiều dispatcher.
     * @param {*} payload 
     */
    dispatch(payload){
        var dispatchers = this.getDispatchers();        
        for (let index = 0; index < dispatchers.length; index++) {
            let dispatcher = dispatchers[index];
            // cc.log("Dispath to " + dispatcher.name);
            dispatcher.dispatch(payload);
        }
    },    

    onRemove(){
        if(this.__dispatchers){
            this.__dispatchers.length = 0;
        }
        this.__dispatchers = null;
    },

    destroy(){
        this.onRemove();
    },

})
