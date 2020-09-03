
var X9Component = require("X9Com");
// var CodeStyle = require("X9AutoReduceStyle");
var HotupdateCommand = require("HotupdateCommand");

cc.Class({
    extends: X9Component,
    // mixins:[CodeStyle],

    properties:{
        manifestUrl: {
            type: cc.Asset,
            default: null
        },
        infoLabel: cc.Label,
    },

    onLoad(){        
        this._super();
        //fortestting
        CC_DEBUG && cc.sys.localStorage.clear();
        // 
        this.hotupdateComand = this.use('HotupdateCommand');
        this.hotupdateComand.setLocalManifest(this.manifestUrl);
        // this.applyPrivateCommandToSubclass(false);
    },

    

    onUpdateView(done){
        var state = this.getState();
        if(state.msg){
            this.infoLabel.string = state.msg;
        }
        done()
    },

    // 

    allowCommandTypes(){
        return [    'default',
                    HotupdateCommand.SHOW_MESSAGE,
                    HotupdateCommand.START_UPDATING,
                    HotupdateCommand.RETRY_UPDATING,
                    HotupdateCommand.UPDATE_PROGRESS,
                    HotupdateCommand.ERROR_NO_LOCAL_MANIFEST,
                    HotupdateCommand.ERROR_MANIFEST,
                    HotupdateCommand.ALREADY_UP_TO_DATE,
                    HotupdateCommand.NEW_VERSION_FOUND,
                    HotupdateCommand.HOTUPDATE_SKIPPED,
                    HotupdateCommand.ALREADY_UP_TO_DATE,
                    HotupdateCommand.UPDATE_FINISHED,
                    HotupdateCommand.UPDATE_FAILED,
                ];
    },

    test(){
        if(this.hotupdateComand){
            this.hotupdateComand.test();
        }
    },

    startLoadingResource(){
        // this.hotupdateComand.checkUpdate();
        this.hotupdateComand.startUpdate();
    }

})