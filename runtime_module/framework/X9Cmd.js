
var Dispatcher = require("Dispatcher");
var Command = require("Command");
var Helper = require("X9Helper");
var X9OrientedCommand = require("X9OrientedCommand");
/**
 * Class được sử dụng để khai báo command trong editor.
 * 
 * // Dispatch một command
 * ex:
 * // Sử dụng thủ công, khi bên X9Com override hàm reduce.
 * this.dispatch({
 *                   type: HotupdateCommand.SHOW_MESSAGE,
 *                   msg: "Test 2 !!!!"
 *              })
 * 
 * // Sử dụng với chuẩn có sẵn. 
 * this.cmd({percent: {files: 0, bytes: 0}}, HotupdateCommand.UPDATE_PROGRESS, "HotupdateComponent");
 * 
 */
cc.Class({
    extends: cc.Component,
    mixins: [Command, X9OrientedCommand],

    properties:{
        isGlobal: {
            default: false,
            displayName: "Multi Data Flows",
            tooltip: "Command mỗi lần sử dụng sẽ dispatch sang cả 2 luồng Global Data Flow lẫn Private Data Flow"
        },
    },

    test(){
        cc.log(this.constructor.name + ":: test successful !");
    },

    /**
     * 
     */
    onLoad(){

        if(this.node){   
            this.setDispatcher(Helper.findNearbyDispatcher(this.node));
            if(this.isGlobal){
                this.setDispatcher(Dispatcher.instance());
            }
        }
    },

    /**
     * 
     * @param {*} dispatcher 
     */
    setDispatcher(dispatcher){
        var dispatchers = this.getDispatchers();
        if(dispatchers.indexOf(dispatcher) == -1){
            // cc.log("Check không trùng lặp dispatcher")
            !(dispatcher instanceof Dispatcher) ? CC_DEBUG ? cc.error(this.constructor.name + ".setDispatcher(dispatcher): Dispatcher truyền vào phải khác là subclass của Dispatcher") : cc.error(false) : dispatchers.push(dispatcher);
        }
        // cc.log('Dispatchers Length :: ' + dispatchers.length);
    },

    /**
     * 
     */
    destroy(){
        this._super();
        this.onRemove();
    }

})

