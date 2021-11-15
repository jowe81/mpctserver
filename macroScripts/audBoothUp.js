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
			this.switchRelay("B0.relay",1,1000); //Console
			this.switchRelay("B1.relay",1,1500); //Console
			this.switchRelay("B3.relay",1,2000);
			this.switchRelay("B4.relay",1,2500);
			this.switchRelay("B5.relay",1,15000); //Near fields
			this.switchRelay("B6.relay",1,500);			
			this.switchRelay("B7.relay",1,500);			
			this.startTracking();
		} else {
			log("Macro currently executing - can't start another instance","macro-"+this.macro.id,true);
		}
	}


}

module.exports=mScript;