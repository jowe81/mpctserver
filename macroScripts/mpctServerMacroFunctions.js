/*
 * NO LONGER USED (but required from somewhere)
 * 
 * 
 * This file can be required from a macroScript like so
 *  var mFns=require('mpctServerMacroFunctions.js');
 *  
 * and then called like so
 * 	mFns.toggleRelay(deviceUid,newStatus);
 */
/*
this.toggleRelay=function(deviceUid,newStatus){
	mqttMpct.publish("command/"+deviceUid,'{"data":{"status":{"value":'+!config.live.devices[deviceUid].data.status.value+'}}}');	
} 

this.switchRelay=function(deviceUid,newStatus){
	(newStatus!=0) ? newStatus=true : newStatus=false;
	mqttMpct.publish("command/"+deviceUid,'{"data":{"status":{"value":'+newStatus+'}}}');	
} 

this.getRelayStatus=function(deviceUid){
	return config.live.devices[deviceUid].data.status.value;
}

this.turnOnProjector=function(deviceUid){
	mqttMpct.publish("command/"+deviceUid,'{"data":{"powerState":1}}');		
}

this.turnOffProjector=function(deviceUid){
	mqttMpct.publish("command/"+deviceUid,'{"data":{"powerState":0}}');		
}
*/