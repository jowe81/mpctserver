/*
 * 
 */
var _=require('lodash');

class mCore{
	constructor(config,mqttMpct,macro){				
		this.config=config;
		this.mqttMpct=mqttMpct;
		this.macro=macro;			
		this.queue=[];
		this._a={};

		var mFns=require(getParentDirectory(__dirname)+"/macroScripts/mpctServerMacroFunctions.js");
		this.mFns=mFns;

		log("Instantiated "+__filename,"macro-"+macro.id);								
	}
	
	isReady(){
		var path=require('path');
		log("Macro is ready","macro-"+this.macro.id);
	}
	
	emitMacroRecord(){
		this.mqttMpct.io.emit('macros',extractMacroRecord(this.config.macros,this.macro.id));		
	}
	
	/*
	 * Use Lodash.after() to set up this._a to be called after completion of each scheduled operation
	 */
	startTracking(){
		let ths=this;
		this.macro.macroRecord.execIndicator=true;
		//Send updated macro record to HUIs (now executing)
		this.emitMacroRecord();
		if (this.queue.length==0){
			//Macro was all synchronous. Done.
			log("Macro completed","macro-"+this.macro.id);
			this.macro.macroRecord.execIndicator=false;
			//Send updated macro record to HUIs with a little delay (execution finished)
			setTimeout(function(){ths.emitMacroRecord();},1000);
			
		} else {
			//Macro is timed commands
			log("Starting tracking, "+this.queue.length+" commands","macro-"+this.macro.id);
			this.executing=true;
			this._a=_.after(this.queue.length,
					function(){
						//Macro has finished
						ths.executing=false; //remove flag
						ths.macro.macroRecord.execIndicator=false;
						ths.queue=[]; //clear timeout handles
						log("Macro completed","macro-"+ths.macro.id);
						//Send updated macro record to HUIs (execution finished)
						ths.emitMacroRecord();
					}
			);			
		}
	}
	
	/*
	 * This must be called at the end of each timeout (trigger lodash.after)
	 */
	cmdComplete(){
		if (this._a){
			log("Completing task","macro-"+this.macro.id);
			this._a();
		}
	}
	
	/*
	 * Abort the macro by clearing all timeout handles
	 */
	abort(){		
		for (var i=0;i<this.queue.length;i++){
			clearInterval(this.queue[i]);
		}
		this.executing=false;
		log("Macro execution aborted","macro-"+this.macro.id);
	}
	
	
		
	/* Toggle relay immediately */
	toggleRelaySync(deviceUid){
		this.mqttMpct.publish("command/"+deviceUid,'{"data":{"status":{"value":'+!this.config.live.devices[deviceUid].data.status.value+'}}}');	
	} 

	/* Switch relay immediately */
	switchRelaySync(deviceUid,newStatus){
		(newStatus!=0) ? newStatus=true : newStatus=false;
		this.mqttMpct.publish("command/"+deviceUid,'{"data":{"status":{"value":'+newStatus+'}}}');	
		
	}
	
	/*Toggle relay after t ms*/
	toggleRelay(deviceUid,t){
		if (t>0){
			let ths=this;
			this.queue.push(setTimeout(function(){ths.toggleRelaySync(deviceUid);ths.cmdComplete();},t));
		} else {
			this.toggleRelaySync(deviceUid);
		}
	}
	
	/*Switch relay after t ms*/
	switchRelay(deviceUid,newStatus,t){
		if (t>0){
			let ths=this;
			this.queue.push(setTimeout(function(){ths.switchRelaySync(deviceUid,newStatus);ths.cmdComplete();},t));
		} else {
			this.switchRelaySync(deviceUid,newStatus);
		}
	} 

	getRelayStatus(deviceUid){
		return this.config.live.devices[deviceUid].data.status.value;
	}
	
	/* Switch projector immediately */
	switchProjectorSync(deviceUid,newPowerState){
		(newPowerState!=0) ? newPowerState=1 : newPowerState=0;
		this.mqttMpct.publish("command/"+deviceUid,'{"data":{"powerState":'+newPowerState+'}}');				
	}
	
	/* Turn on projector with delay */
	turnOnProjector(deviceUid,t){
		if (t>0){
			let ths=this;
			this.queue.push(setTimeout(function(){ths.switchProjectorSync(deviceUid,1);ths.cmdComplete();},t));
		} else {
			this.switchProjectorSync(deviceUid,1);
		}
	}

	/* Turn off projector with delay */
	turnOffProjector(deviceUid,t){
		if (t>0){
			let ths=this;
			this.queue.push(setTimeout(function(){ths.switchProjectorSync(deviceUid,0);ths.cmdComplete();},t));
		} else {
			this.switchProjectorSync(deviceUid,0);
		}
	}
	
	/* Set timer */
	setTimer(deviceUid,duration,indLength,maxOver){
		this.mqttMpct.publish("command/"+deviceUid,'{"data":{"setTimer":{"duration":"'+duration+'","indLength":"'+indLength+'","maxOver":"'+maxOver+'"}}}');
	}
	
	/* Adjust timer */
	adjustTimer(deviceUid,seconds){
		this.mqttMpct.publish("command/"+deviceUid,'{"data":{"adjustTimer":'+seconds+'}}');
	}

	/* Clear timer */
	clearTimer(deviceUid){
		this.mqttMpct.publish("command/"+deviceUid,'{"data":{"clearTimer":true}}');
	}

}
module.exports=mCore;

