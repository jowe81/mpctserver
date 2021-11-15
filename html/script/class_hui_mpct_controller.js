/*
 * Parent class for the different types of devices
 */

class Mpct_controller{	

	//Take controllerRecord and store it in this.controllerRecord
	constructor(controllerRecord,serverOffsetToHUI){
		if (controllerRecord.id) this.id=controllerRecord.id;
		controllerRecord.type ? this.type=controllerRecord.type : this.type="N/A";
		this.controllerRecord={};
		this.updateControllerData(controllerRecord,serverOffsetToHUI);
	}
	
	updateControllerData(controllerRecord,serverOffsetToHUI){
		deepCopy(controllerRecord,this.controllerRecord);
		this.updateControllerOffset(serverOffsetToHUI);
	}
	
	//Update total offset from controller to HUI
	updateControllerOffset(serverOffsetToHUI){
		if (serverOffsetToHUI){
			this.offsetToHUI=this.controllerRecord.offsetToServer+serverOffsetToHUI;
		}		
	}
	
	getInfoDIVselector(){
		return "#controllerList .controllerListItem[data-controllerId="+$.escapeSelector(this.id)+"]";		
	}
	
	generateInfoDiv(controllerListDiv){
		//Div doesn't yet exist
		var controllerDiv=
			 " <div class='controllerListItem' data-controllerId='"+this.id+"'>"
			+"	 <div class='controllerDivHeader'>"
			+"		<div class='controllerId'>"+this.uid+"</div>"
			+"		<div class='controllerPhysical'>"+this.controllerId+"/"+this.type+"</div>"
			+"		<div class='readAt'></div>"
			+"	 </div>"
			+"   <div class='controllerData'>"
			+"	 </div>"
			+"</div>";
		$(controllerListDiv).append(controllerDiv);		
	}
	
	//Update the readAt field for the device
	updateInfoDivReadAt(){
		$(this.getInfoDIVselector()+" .readAt").html(this.getControllerUpdateTime());
	}
	
	//Figure out when the controller received the last device update by extracting .readAt from the first parameter in deviceRecord.params
	getControllerUpdateTimestamp(){
		return this.controllerRecord.localTimestamp;
	}
	
	//Return formatted
	getControllerUpdateTime(){
		var ts=this.getDeviceUpdateTimestamp();
		if (ts){
			return dateTime(ts);
		} else {
			return "N/A";
		}
	}
	
	
	
}