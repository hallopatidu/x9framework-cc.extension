const Dispatcher = require("X9Dispatcher");
const ReduceStore = require("ReduceStore");
const Command = require("Command");
const X9Command = require("X9Cmd");
const Helper = require("X9Helper");
const CodingStyle = require("X9AutoReduceStyle");
const SaveAndShareData = require('X9SaveAndShareData');


/**
 * Đối tượng chuyển đổi, tính toán logic, lưu trữ mặt dữ liệu. Kể cả kết nối giao diện
 * Tự động kết nối với Dispatcher khi được load.
 * Có thể sử dụng hàm use để tạo command và các X9Componentkhác bằng code.
 * Thiết lập MainGame
 */
var X9Component= cc.Class({
    extends: cc.Component,
    mixins: [ReduceStore, CodingStyle, SaveAndShareData],

    properties:{
        isFacade: {
            default: false,
            displayName: "Create Private Data Flow",
            tooltip: "Thiết lập sử dụng hệ thống luồng dữ liệu riêng cho các component trong toàn bộ node con"
        },
    },

    // statics: {
    //     DISPATCHER_ARG: "__dispatcher__"
    // },

    ctor(){
        this._waitIds = [];
        this._compRefs = Object.create(null);
    },

    getInitialState(){
        return this._state ? this._state : Object.create(null);
    },
        
    onLoad(){        
        this.onInit();
        if(this.isFacade && this.node && !this.node[Helper.DISPATCHER_ARG]){
            this.node[Helper.DISPATCHER_ARG] = new Dispatcher();
        }
        // Các component trong một node facade có chung một Dispatcher;
        this.setDispatcher(Helper.findNearbyDispatcher(this.node));
        if(SaveAndShareData){
            this.sync();
        }
        cc.log('x9Com.onLoad::' + this.__className + ' token ' + this._dispatchToken);
    },

    onDestroy(){      
        if(this.onRemove){  
            this.onRemove();
        }
        if(this.isFacade && this.node){
            this.node[Helper.DISPATCHER_ARG] = null;
        }

        if(this._waitIds){
            this._waitIds.length = 0;
            this._waitIds = null;
        }
        // for (const key in this._compRefs) {
        //     if (this._compRefs.hasOwnProperty(key)) {
        //         delete this._compRefs[key];                
        //     }
        // }
        this._compRefs = null;
    },

    // reduce(state, payload){
    //     cc.log(' X9 com !!!')
    //     return this._super(state, payload);
    // },

    //------------------------------------
    // Feature Function
    //------------------------------------

    /**
     * - Sử dụng để tạo ra các X9 Command hoặc X9 Component
     * - Sử dụng để tham chiếu các Command hoặc Component có sẵn.
     * - Hàm use đảm bảo chỉ có 01 loại Command Class duy nhất được tạo trên cùng một node chứa logic.
     * - Các X9 component được tham chiếu qua this.use luôn được ưu tiên cập nhật payload trước.
     * - Các componet được 'use' trong code sẽ được ưu tiên dispatch trước component được gán trên creator.
     * - Tên của x9 component là duy nhất khi sử dụng. Mỗi Class name chỉ tương ứng với một component.
     * - Biến this._compRefs lưu tham chiếu các x9 component đã tham chiếu từ trước.
     * - Hàm use chỉ tìm kiếm các component trong cùng node. Riêng với node được tạo từ prefab sẽ tìm kiếm toàn bộ node trong prefab.
     * 
     * [Hàm này còn cần nâng cấp tốt hơn]
     * @param {string | class | instance} typeOrClassName     Đầu vào tham chiếu liên quan tới 
     * @param {*} targetNode                                  Node chứa component.
     * @return {*} Trả về instance của objectClass. 
     */
    use(typeOrClassName, targetNode){
        try{
            if(!typeOrClassName) {
                throw new Error(this.__className + ".use(typeOrClassName, connectToGlobal): typeOrClassName không được để null.");                
            }
            // 
            //
            let cachedComp;
            let instance;
            let node = targetNode && (targetNode instanceof cc.Node) ? targetNode : this.node;
            if(typeof typeOrClassName == "string"){
                cachedComp = this._useCache(typeOrClassName, node);
                if(cachedComp){
                    return cachedComp; 
                }
                instance = this._getRepresentComponent(typeOrClassName, node);
                // Nếu không lấy được instance, chuyển đổi thành CCClass qua hàm require.
                if(instance){
                    instance = this.use(instance, node);
                }else{
                    let targetClass = require(typeOrClassName);
                    instance = this.use(targetClass);
                }
                // instance = instance ? this.use(instance, node) : this.use( require(typeOrClassName));
                
            }else if(cc.js.isChildClassOf(typeOrClassName, cc.Component)){
                //
                let className = cc.js.getClassName(typeOrClassName);
                cachedComp = this._useCache(className, node);
                if(cachedComp){
                    return cachedComp;
                }
                instance = this._getRepresentComponent(typeOrClassName, node);
                if(!instance){
                    instance = node ? node.addComponent(typeOrClassName) : this.node.addComponent(typeOrClassName);
                }
                instance = this.use(instance, node);

            }else{                
                // truong hop truyen vao instance.
                let className = cc.js.getClassName(typeOrClassName.constructor);
                // cachedComp = this._useCache(typeOrClassName.__className, node);
                cachedComp = this._useCache(className, node);
                if(cachedComp){
                    return cachedComp;
                }
                instance =  this._implementX9Component(typeOrClassName);
                this._cached(instance);

            }
            return instance;

        }catch(err){
            cc.error(err);
        }
    },

    /**
     * 
     * @param {*} className 
     * @param {*} targetNode 
     */
    _useCache(className, targetNode){
        let node = targetNode && (targetNode instanceof cc.Node) ? targetNode : this.node;
        let refName = node.name + "::" + className;
        return this._compRefs[refName] ? this._compRefs[refName] : null;
    },

    /**
     * 
     * @param {*} instance 
     */
    _cached(instance){
        if(!instance || !instance.node){
            throw new Error("Component không tồn tại hoặc chưa xác định node.")
        }        
        let refName = instance.node.name + "::" + instance.__className;
        this._compRefs[refName] = instance;
        
        if(instance instanceof X9Component){
            var dispatcher = this.getDispatcher();
            var token = instance.getDispatchToken();
            this._compRefs[token] = refName;
            var referInstance = instance;
            // inject onDestroy to clearn reference
            // Here
            if(instance.onDestroy){
                instance.onDestroy = (_super => {
                    return ()=>{
                        if(_super) _super();
                        // cc.log('customize onDestroy 7 !!!')
                        if(!dispatcher.hasRegister(token) ){
                            if(this._waitIds && this._waitIds.length){
                                let index = this._waitIds.indexOf(token);
                                this._waitIds.splice(index, 1);
                            }
                            if(this._compRefs){                            
                                delete this._compRefs[token];
                                delete this._compRefs[refName];
                            }
                        }
                        
                    }
                })(instance.onDestroy.bind(referInstance))
            }
            //
        }
        //
    },
    
    
    /**
     * Thủ tục gắn vào framework bao gồm:
     * - Gắn dispatcher
     * - Gắn thứ tự ưu tiên cập nhật state.
     * @param {*} x9comp 
     */
    _implementX9Component(x9comp){
        if(x9comp instanceof X9Component){
            x9comp.setDispatcher(this.getDispatcher());
            // Set ưu tiên các gameCoponent này dispatch trước.
            this.waitFor(x9comp.getDispatchToken());
        }else if((x9comp instanceof X9Command) || (x9comp instanceof Command)){            
            x9comp.setDispatcher(this.getDispatcher());
        }else{
            CC_DEBUG && cc.error(this.__className + "._implementX9Component(x9comp): x9comp truyền vào phải là một trong những thành phần của framework");                
        }
        return x9comp;
    },

    // update: function (dt) {

    // },

    /**
     * Tìm kiếm component trong một Node. Thường thì chỉ lấy trong node đó. Không tìm trong children.
     * Riêng với node được tạo từ prefab sẽ tìm kiếm trong children cho đến khi tìm thấy component tương ứng.
     * @param {String or Class} typeOrClassName 
     * @param {cc.Node} targetNode 
     */
    _getRepresentComponent(typeOrClassName, targetNode){
        //
        if(targetNode && !(targetNode instanceof cc.Node)){
            CC_DEBUG && cc.error(this.__className + "._getRepresentComponent(typeOrClassName, targetNode): targetNode phải là một cc.Node'");
        }
        let node = targetNode && (targetNode instanceof cc.Node) ? targetNode : this.node;
        let compClass = (typeof typeOrClassName == "string") ? cc.js.getClassByName(typeOrClassName) : typeOrClassName;
        if(compClass && (cc.js.isChildClassOf(compClass, X9Component) || cc.js.isChildClassOf(compClass, X9Command) || cc.js.isChildClassOf(compClass, Command) )){
            let component;
            if(node._prefab){            
                // if(compClass && (cc.js.isChildClassOf(compClass, X9Component) || cc.js.isChildClassOf(compClass, X9Command) || cc.js.isChildClassOf(compClass, Command) )){
                let components = Helper.getAllComponents(node, (x9comp)=>{
                    return x9comp instanceof compClass;
                });
                component = components[0];                
                // }else{
                //     throw new Error(this.__className + "._getRepresentComponent(typeOrClassName, targetNode): Conponent '" + typeOrClassName + "' không phải thành phần của framework.");
                // }
            }else{
                component = node.getComponent(typeOrClassName);
            }

            if(!component){
                let components = Helper.getAllComponents(cc.director.getScene(), (x9comp)=>{
                    return x9comp instanceof compClass;
                }, (currentNode)=>{
                    return currentNode === node ? -1 : 1;
                });
                component = components[0];  
            }

            return component;
        }else{
            throw new Error(this.__className + "._getRepresentComponent(typeOrClassName, targetNode): Conponent '" + typeOrClassName + "' không phải thành phần của framework.");
        }
        
    },

    /**
     * 
     * @param {*} token 
     */
    _getUsedComponentByToken(token){
        if(this._compRefs){
            let compName = this._compRefs[token];
            if(compName && (typeof compName === 'string') ){
                let instance = this._compRefs[compName];
                return instance;
            }
        }
        return null;
    },

    /**
     * 
     * @param {*} dispathToken 
     */
    waitFor(dispathToken){
        let dispather = this.getDispatcher();
        // Đồng bộ với _callbacks list của dispatcher.
        for (let index = 0; index < this._waitIds.length; index++) {
            const tokenId = this._waitIds[index];
            if(tokenId){
                if(!dispather.hasRegister(tokenId)){
                    // delete this._waitIds[tokenId];
                    this._waitIds.splice(index, 1);
                    index--;
                }else if(dispathToken == tokenId){
                    return;
                }else{
                    continue;
                }
            }
        }
        this._waitIds.push(dispathToken);
    },


    //------------------------------------
    // Private Function
    //------------------------------------
    
    /**
     * This method override super.__invokeOnDispatch and encapsulates all logic for invoking __onDispatch. It should
     * be used for things like catching changes and emitting them after the
     * subclass has handled a payload.
     */
    _prepareInvokeOnDispatch(payload) {        

        if(this._waitIds && this._waitIds.length){
            // Ưu tiên các component tạo ra bên trong code dispatch trước.
            this.getDispatcher().waitFor(this._waitIds);
        }
    },

    /**
     * 
     */
    // __emitChange() {
    //     this._super();
    //     this.onChange(this.getState());
    // },

})


