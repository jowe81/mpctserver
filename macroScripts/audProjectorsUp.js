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
			this.turnOnProjector("A0.projector");      //right
			this.turnOnProjector("A1.projector",1000); //center
			this.turnOnProjector("A2.projector",2000); //left
			this.switchRelay("B7.relay",1);            //confidence monitor
			this.startTracking();
		} else {
			log("Macro currently executing - can't start another instance","macro-"+this.macro.id,true);
		}
	}
	

}

module.exports=mScript;
