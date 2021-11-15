/*
 * The actual macro code
 */

var mCore=require("../lib/class_mcore.js");

class mScript extends mCore{

	constructor(config,mqttMpct,macro){
		super(config,mqttMpct,macro);
	}

	execute(){
		var deviceUid="ESPA0.clockTimer";
		var error=false;
		if (!this.executing){
			var remaining=0;
			try {
				console.log(this.config.live.devices[deviceUid].data);
				remaining=this.config.live.devices[deviceUid].data.remaining;
			} catch(e) {
				error=true;
			}
			if (!error){
				if (remaining>0){
					this.setTimer(deviceUid,remaining-60,30,120);				
				} else {
					this.clearTimer(deviceUid);
				}				
			} else {
				log ("Macro encountered error with "+deviceUid,"macro-"+this.macro.id,true);
			}
		} else {
			log("Macro currently executing - can't start another instance","macro-"+this.macro.id,true);
		}
	}
	

}

module.exports=mScript;
