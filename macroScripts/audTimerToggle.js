/*
 * TOGGLE TIMER (SET/CLEAR)
 * 
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
				remaining=this.config.live.devices[deviceUid].data.remaining;
			} catch(e) {
				error=true;
			}
			if (!error){
				if (remaining===false){
					//Timer isn't currently operating, set it					
					this.setTimer(deviceUid,1800,60,600);				
				} else {
					//Timer is currently going, clear it
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
