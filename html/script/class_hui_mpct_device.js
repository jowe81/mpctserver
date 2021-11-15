/*
 * Parent class for the different types of devices
 */

class Mpct_device{	

	//Take deviceRecord and store it in this.deviceRecord, copy out uid, type, controllerId directly on the instance
	constructor(deviceRecord,config,socket){
		this.config=config;
		this.socket=socket;
		this.uid=deviceRecord.physical.uid;	
		this.cssUid=this.uid.replace(".","\\.");
		this.type=deviceRecord.physical.type;
		this.controllerId=extractControllerId(this.uid);
		this.gpio="(N/A)";
		this.gpio=deviceRecord.physical.gpio;
		this.deviceRecord={};
		this.updateDeviceData(deviceRecord);
	}
	
	//Return controller object if extant
	getController(){
		return this.config.controllers[this.controllerId];
	}
	
	//
	updateDeviceData(deviceRecord){
		if (deviceRecord._isFullUpdate){
			//delete deviceRecord._isFullUpdate;
			//On full update discard current record and just replace 
			this.deviceRecord={};
		} else {
			//This most recent was not a full update - delete flag from record
			this.deviceRecord._isFullUpdate=false;
		}
		deepCopy(deviceRecord,this.deviceRecord);
		//Make sure these object exists even if empty
		if (!this.deviceRecord.meta){ this.deviceRecord.meta={};}
		if (!this.deviceRecord.config){ this.deviceRecord.config={};}
		if (!this.deviceRecord.data){ this.deviceRecord.data={};}
		if (!this.deviceRecord.status){ this.deviceRecord.status={};}
		if (!this.deviceRecord.physical){ this.deviceRecord.physical={};}
		if (typeof this.postUpdateProcessing === "function") {
			/*
			//Defined on clockTimer devices, for second counting between minutely data updates
			this.postUpdateProcessing();
			*/
		}
	}
	
	//Execute a command (already in MPCT JSON format 
	executeCommand(cmdJson){
		this.socket.emit('mpctCommand',cmdJson);
	}
	
	setMetaField(field,value){
		var cmdJson=JSON.parse('{"deviceUid":"'+this.uid+'","meta":{"'+jsonSafe(field,true)+'":"'+jsonSafe(value)+'"}}');
		this.socket.emit('mpctCommand',cmdJson);
	}
	
	setConfigField(field,value){
		console.log("setconff",field,value);
		var cmdJson=JSON.parse('{"deviceUid":"'+this.uid+'","config":{"'+jsonSafe(field,true)+'":"'+jsonSafe(value)+'"}}');
		this.socket.emit('mpctCommand',cmdJson);		
	}
	
	deleteMetaField(field){
		this.socket.emit('mpctCommand',{"deviceUid":this.uid, "deleteMeta":field});
	}

	getGroup(){
		if (!this.deviceRecord.meta.group){
			return "_noGroup";
		}
		return this.deviceRecord.meta.group;
	}
	
	getMonitorDIVselector(){
		var r;
		//r="#groupsContainer .group[data-deviceGroup="+$.escapeSelector(this.getGroup())+"] .deviceListItem[data-deviceUid="+$.escapeSelector(this.uid)+"]";
		r="#groupsContainer .group[data-deviceGroup="+this.getGroup()+"] .deviceListItem[data-deviceUid="+this.cssUid+"]";
		return r;
	}
	
	getMonitorGroupSelector(){
		//return "#groupsContainer .group[data-deviceGroup="+$.escapeSelector(this.getGroup())+"]";
		return "#groupsContainer .group[data-deviceGroup="+this.getGroup()+"]";
	}
	
	updateMonitorDiv(){
		var h=this.uid;
		$(this.getMonitorDIVselector()).html(h);
		this.updateMonitorDivError();
	}
	
	updateMonitorDivError(){
		//Mark error if present
		this.deviceRecord.error ? $(this.getMonitorDIVselector()).addClass("bgError") : $(this.getMonitorDIVselector()).removeClass("bgError");		
	}	
	
	//deviceListDiv is jQuery object
	getInfoDIVselector(deviceListDiv){
		var r="";
		if (deviceListDiv){
			//r=deviceListDiv.attr("id")+" .deviceListItem[data-deviceUid="+$.escapeSelector(this.uid)+"]";					
			r=deviceListDiv.attr("id")+" .deviceListItem[data-deviceUid="+this.cssUid+"]";					
			//console.log(deviceListDiv.attr("id"));
		} else {
			//r="#deviceList .deviceListItem[data-deviceUid="+$.escapeSelector(this.uid)+"]";		
			r="#deviceList .deviceListItem[data-deviceUid="+this.cssUid+"]";		
			
		}
		return r;
	}
	
	generateInfoDiv(deviceListDiv){
		//Div doesn't yet exist
		var displayName=this.uid;
		if (this.deviceRecord.meta.name && this.deviceRecord.meta.name.length>0) displayName=this.deviceRecord.meta.name;
		var deviceDiv=
			 " <div class='deviceListItem' data-deviceUid='"+this.uid+"'>"
			+"	 <div class='deviceDivHeader'>"
			+"		<div class='deviceName'><a href='editDevice.html?deviceUid="+this.uid+"'>"+displayName+"</a></div>"
			+"		<div class='devicePhysical'>"+this.uid+" "+this.controllerId+"/GPIO"+this.gpio+"</div>"			
			+"		<div class='readAt'></div>"
			+"		<div class='deviceError bgError'></div>"
			+"	 </div>"
			+"   <div class='deviceData'>"
			+"	 </div>"
			+"</div>";
		$(deviceListDiv).append(deviceDiv);		
	}
	
	updateInfoDivReadAtAndError(){
		this.updateInfoDivReadAt();
		this.updateInfoDivError();
	}

	//Update the readAt field for the device
	updateInfoDivReadAt(){
		$(this.getInfoDIVselector()+" .readAt").html(this.getDeviceUpdateTime());
	}

	//Update the error status and msg for the device
	updateInfoDivError(){
		if (this.deviceRecord.error){
			$(this.getInfoDIVselector()+" .deviceError").html(this.deviceRecord.error);
		} else {
			$(this.getInfoDIVselector()+" .deviceError").html("");
		}
	}
		
	//Figure out when the controller received the last device update by extracting .readAt from the first parameter in deviceRecord.params
	getDeviceUpdateTimestamp(){
		var firstParamName=Object.keys(this.deviceRecord.data)[0];
		if (firstParamName){
			this.readAt=this.deviceRecord.data[firstParamName].readAt;
		}
		return this.readAt;
	}
	
	//Return formatted
	getDeviceUpdateTime(){
		var r="";
		var ts=this.getDeviceUpdateTimestamp();
		var controller=this.getController();
		if (ts){
			//Got a timestamp
			if (controller && controller.offsetToHUI){
				//Got a controller and offset
				r="("+controller.offsetToHUI+"ms) ";
			} else {
				//Don't know offset
				r="offset N/A ";				
			}			
			r+=dateTime(ts);
		} else {
			//No timestamp
			r="N/A";
		}
		return r;
	}
		
}