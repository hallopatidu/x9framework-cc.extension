var Dispatcher = require('X9Dispatcher');

var Helper = {
    DISPATCHER_ARG : '__dispatcher__',
    /**
     * 
     * @param {*} node 
     * @param {*} componentCondition 
     * @param {Function} nodeCondition function(){return -1|0|1}. 
     * -1 không tìm kiếm component tại node nay và không tìm kiếm tại node con
     * 0 không tìm kiếm tại node này vẫn tìm kiếm tại node con.
     * 1 Tìm kiếm tại node này và cả node con.
     */
    getAllComponents(node, componentCondition, nodeCondition){        
        let components = [] ;
        let isNodeVerify = nodeCondition ? nodeCondition(node) : 1  ;
        if(node._components && node._components.length && isNodeVerify > 0){
            let clength = node._components.length;
            let i = 0;
            while(i < clength){                
                let compElement = node._components[i++]
                if(componentCondition && !componentCondition(compElement)){
                    continue;
                }
                components.push(compElement);
            }
        }

        if(node.childrenCount > 0 && isNodeVerify > -1){
            let j = 0;
            while(j < node.childrenCount){
                components = components.concat(this.getAllComponents(node.children[j], componentCondition, nodeCondition));
                j++;
            }    
        }
        return components
    },

    /**
     * Tim Dispatcher ở node cha.
     * Find a Dispatcher on tree node which has 'isFacade' properties to be true.
     * @param {*} targetNode 
     */
    findNearbyDispatcher(targetNode){        
        if(targetNode[Helper.DISPATCHER_ARG] && (targetNode[Helper.DISPATCHER_ARG] instanceof Dispatcher) ){
            let dispatcher = targetNode[Helper.DISPATCHER_ARG];
                dispatcher.name = targetNode.name;
            // cc.log('found ... ' + targetNode.name )
            return dispatcher;
        }else{
            if(targetNode.parent){
                // cc.log('search ... ' + targetNode.name + '  parent: ' + targetNode.parent.name)
                return this.findNearbyDispatcher(targetNode.parent);
            }
        }
        return Dispatcher.instance();
    },

    decodeBase64URL(){
        
    },

    editCCClass: function(manualOptionHandler, completedDefineClassHandler){
        if(!this.__edited){
            var newCCClass = (function(superCCClass){
                return function(options){   
                    let newOptions = manualOptionHandler ? manualOptionHandler(options) : options;
                    let resClass = superCCClass(newOptions);
                    if(completedDefineClassHandler){
                        completedDefineClassHandler(resClass, newOptions);                        
                    }
                    return resClass;
                }
            } )(cc.Class);
            // Forward một số thuộc tính từ CCClass sang newCCClass.
            for (var key in cc.Class) {
                if (cc.Class.hasOwnProperty(key)) {
                    newCCClass[key] = cc.Class[key];
                }
            };
            cc.Class = newCCClass;
            this.__edited = true;
        }
    }

};

CC_EDITOR &&
Helper.editCCClass(function(options){
    // if(CC_EDITOR && options && options.extends){var intentSuperKlass = options.extends ? options.extends : null;if( intentSuperKlass && cc.js.isChildClassOf(intentSuperKlass, cc.Component) ){
    // options.__preMenuPath = 'Pre X9 Components/' + Math.random()*99999;options.editor = options.editor ? options.editor : {executeInEditMode: true,menu: options.__preMenuPath}}}
    return options;
}, function(cls, options){     
    let className = cc.js.getClassName(cls);
    if(!className) return;   
    if(options && options.extends && options.extends !== cc.Class && (typeof options.extends !== 'object') ){
        let catalogName;
        let superClass = options.extends;
        let X9Command = require("X9Cmd");
        let X9Component = require("X9Com");
        if(typeof X9Command === 'function' && typeof X9Component === 'function'){        
            if (cc.js.isChildClassOf(superClass, X9Component)) {
                catalogName = 'X9 Component';
            }else if(cc.js.isChildClassOf(superClass, X9Command)){
                catalogName = 'X9 Command';
            }
            if(catalogName){
                // Sửa lại nội dung của menu theo custome catalog.
                let menuPath = catalogName + '/' + className;
                cc._componentMenuItems.forEach(item => {            
                    if(item.component === cls){
                        item.menuPath = menuPath;
                    }
                });
            }
        }
    }
});


module.exports = Helper;
