const Dispatcher = require("Dispatcher");
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
        cc.log('x9Com.onLoad::' + this.constructor.name + ' token ' + this._dispatchToken);
    },

    onDestroy(){        
        this.onRemove();
        if(this.isFacade && this.node){
            this.node[Helper.DISPATCHER_ARG] = null;
        }
        this._waitIds.length = 0;
        this._waitIds = null;
        // for (const key in this._compRefs) {
        //     if (this._compRefs.hasOwnProperty(key)) {
        //         delete this._compRefs[key];                
        //     }
        // }
        this._compRefs = null;
    },


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
                throw new Error(this.constructor.name + ".use(typeOrClassName, connectToGlobal): typeOrClassName không được để null.");                
            }
            // 
            //
            var instance;
            if(typeof typeOrClassName == "string"){
                if(this._compRefs[typeOrClassName]){
                    return this._compRefs[typeOrClassName];
                }
                instance = this._getRepresentComponent(typeOrClassName, targetNode);
                // Nếu không lấy được instance, chuyển đổi thành CCClass qua hàm require.
                instance = instance ? this.use(instance, targetNode) : this.use(require(typeOrClassName));
                
            }else if(cc.js.isChildClassOf(typeOrClassName, cc.Component)){
                //
                let className = cc.js.getClassName(typeOrClassName);
                if(this._compRefs[className]){
                    return this._compRefs[className];
                }
                instance = this._getRepresentComponent(typeOrClassName, targetNode);
                if(!instance){
                    instance = this.node.addComponent(typeOrClassName);
                }
                instance = this.use(instance, targetNode);

            }else{
                if(this._compRefs[typeOrClassName.constructor.name]){
                    return this._compRefs[typeOrClassName.constructor.name];
                }
                instance =  this._implementX9Component(typeOrClassName);
                this._compRefs[instance.constructor.name] = instance;
            }
            return instance;

        }catch(err){
            cc.error(err);
        }
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
            CC_DEBUG && cc.error(this.constructor.name + "._implementX9Component(x9comp): x9comp truyền vào phải là một trong những thành phần của framework");                
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
            CC_DEBUG && cc.error(this.constructor.name + "._getRepresentComponent(typeOrClassName, targetNode): targetNode phải là một cc.Node'");
        }
        let node = targetNode && (targetNode instanceof cc.Node) ? targetNode : this.node;
        if(node._prefab){
            let compClass = (typeof typeOrClassName == "string") ? cc.js.getClassByName(typeOrClassName) : typeOrClassName;
            if(compClass && (cc.js.isChildClassOf(compClass, X9Component) || cc.js.isChildClassOf(compClass, X9Command) || cc.js.isChildClassOf(compClass, Command) )){
                let components = Helper.getAllComponents(node, (x9comp)=>{
                    return x9comp instanceof compClass;
                });               
                return components[0];                
            }else{
                throw new Error(this.constructor.name + "._getRepresentComponent(typeOrClassName, targetNode): Conponent '" + typeOrClassName + "' không phải thành phần của framework.");
            }
        }
        return node.getComponent(typeOrClassName);
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


