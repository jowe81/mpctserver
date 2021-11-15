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
			this.turnOffProjector("A3.projector");
			this.startTracking();
		} else {
			log("Macro currently executing - can't start another instance","macro-"+this.macro.id,true);
		}
	}
	

}

module.exports=mScript;
