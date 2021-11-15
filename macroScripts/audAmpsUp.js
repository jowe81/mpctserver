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
			this.switchRelay("C0.relay",1); //Mains left
			this.switchRelay("C1.relay",1,500); //Mains right
			this.switchRelay("C2.relay",1,1000); //Sidefills
			this.switchRelay("C3.relay",1,1500); //Monitors
			this.switchRelay("C4.relay",1,2000); //Subs
			this.switchRelay("C6.relay",1,2500); //Subs
			this.switchRelay("B5.relay",1,3000); //Underfills 1
			this.switchRelay("B6.relay",1,3500); //Underfills 2			
			this.startTracking();
		} else {
			log("Macro currently executing - can't start another instance","macro-"+this.macro.id,true);
		}
	}


}

module.exports=mScript;
