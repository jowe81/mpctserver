/*
 * The actual macro code
 */

var mCore=require("../lib/class_mcore.js");

class mScript extends mCore{

	constructor(config,mqttMpct,macro){
		super(config,mqttMpct,macro);
	}

	execute(){
		if (!this.executing){
			this.switchRelay("B5.relay",0);
			this.switchRelay("B0.relay",0,500);
			this.switchRelay("B1.relay",0,1000);
			this.switchRelay("B3.relay",0,1500);
			this.switchRelay("B4.relay",0,2000);
			this.switchRelay("B6.relay",0,3000);			
			this.switchRelay("B7.relay",0,3000);			
			this.startTracking();
		} else {
			log("Macro currently executing - can't start another instance","macro-"+this.macro.id,true);
		}
	}

}

module.exports=mScript;