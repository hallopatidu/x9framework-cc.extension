
const X9Command = require('X9Cmd');

var X9OrientedCommand = cc.Class({

    statics: {
        TYPE_ARG: "__type__",
        CLASS_ARG: "__class__",
    },


    /**
     *      
     * @param {Object} option            Các giá trị payload gửi đi
     * @param {String} type              Kiểu command
     * @param {String} classTargetName   Chỉ gửi cho các component có Class Name tương ứng
     */
    cmd(option, type, classTargetName){
        if(!option) {
            throw new Error(this.constructor.name + "::cmd(option, type, classTargetName) : " +"option không xác định hoặc null")
        }
        option[X9OrientedCommand.TYPE_ARG] = type ? type : "default";
        if(classTargetName){
            option[X9AutoReduceStyle.CLASS_ARG] = classTargetName;
        }

        if(this.dispatch && (typeof this.dispatch === 'function')){     
            this.dispatch(option);
        }else if(this.getDispatcher){
            this.getDispatcher().dispatch(option);
        }else{
            throw new Error(this.constructor.name + "::cmd(option, type, classTargetName) : " +" Chỉ sử dụng template này cho các subclass của X9Com hoặc X9Cmd")
        }
    },

})