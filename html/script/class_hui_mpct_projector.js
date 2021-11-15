class Mpct_projector extends Mpct_device {
	constructor(deviceRecord,config,socket){
		super(deviceRecord,config,socket);
	}

	//DeviceListDiv is jQuery object
	updateInfoDiv(deviceListDiv){		
		//Check if div exists, generate if not
		if (!$(this.getInfoDIVselector()).length){					
			//Div doesn't yet exist
			this.generateInfoDiv(deviceListDiv);
		}		
		//Prepare status cell with command button
		var statusCell;
		if (this.deviceRecord.data.status.value){			
			statusCell="<td class='bgGreen dataCell'>On<button onClick='mqttCommandFromString(\""+this.uid+"\",\"turnOn\")'>Turn off</button></td>";
		} else {
			statusCell="<td class='bgRed dataCell'>Off 		 <button onClick='mqttCommandFromString(\""+this.uid+"\",\"turnOff\")'>Turn on</button></td>";
		}	
		//Update info div
		var deviceInfoHTML=
			"<table>"
			+"<tr><td class='col1'>Status</td></tr><tr>"+statusCell+"</tr>"
			+"</table>";
		$(this.getInfoDIVselector()+" .deviceData").html(deviceInfoHTML);
		//Triger update for readAt field
		this.updateInfoDivReadAtAndError();
	}
		
	powerUp(){
		var commandJson;		
		if (this.deviceRecord.data.pjlink.powerState==0){
			commandJson={"deviceUid":this.uid,"data":{"powerState":1}};
			this.executeCommand(commandJson);
			return true;
		} else {
			//Device either already turned on currently warming up or cooling off; can't be turned on
			return false;
		}
	}
	
	powerDown(){
		var commandJson;		
		if (this.deviceRecord.data.pjlink.powerState==1){
			commandJson={"deviceUid":this.uid,"data":{"powerState":0}};
			this.executeCommand(commandJson);
			return true;
		} else {
			//Device either already turned off or currently warming up or cooling off; can't be turned off
			return false;
		}
	}

	toggleStatus(){
		if (this.deviceRecord.data.pjlink.powerState==0){
			//Device is turned off -> turn on
			return this.powerUp();
		} else if (this.deviceRecord.data.pjlink.powerState==1){
			//Device is turned on -> turn off
			return this.powerDown();
		} else {
			//Device is cooling or warming
			return false;
		}
	}


	shutterOn(){
		var commandJson={"deviceUid":this.uid,"data":{"mute":{"video":true}}};
		this.executeCommand(commandJson);
	}
	
	shutterOff(){
		var commandJson={"deviceUid":this.uid,"data":{"mute":{"video":false}}};
		this.executeCommand(commandJson);
	}

	toggleShutter(){
		if (this.deviceRecord.data.pjlink.mute.video==false){
			this.shutterOn();
		} else {
			this.shutterOff();
		}
		return true;
	}

	updateMonitorDiv(){
		var h="",label,statusText="",uid;
		var thisDevice=this;
		this.deviceRecord.meta.name ? label=this.deviceRecord.meta.name : label=this.uid;

		if (this.deviceRecord.data.pjlink!={}){
			
			//Power State
			if (this.deviceRecord.data.pjlink.powerState==0){
				statusText="<div class='monitorParamValue cmdPowerState bgRed'>off</div>";				
			} else if (this.deviceRecord.data.pjlink.powerState==1){ 
				statusText="<div class='monitorParamValue cmdPowerState bgGreen'>on</div>";
			} else if (this.deviceRecord.data.pjlink.powerState==2){ 
				statusText="<div class='monitorParamValue bgOrange'>cooling down</div>";
			} else if (this.deviceRecord.data.pjlink.powerState==3){ 
				statusText="<div class='monitorParamValue bgOrange'>warming up</div>";
			} else {
				statusText="<div class='monitorParamValue cmdPowerState bgWarning'>power state N/A</div>";			
			}
			
			//Active Input
			var inputText="";
			if (this.deviceRecord.data.pjlink.input){
				if (this.deviceRecord.data.pjlink.input.name){
					inputText=this.deviceRecord.data.pjlink.input.name;
				} else if (this.deviceRecord.data.pjlink.input.source){
					inputText=this.deviceRecord.data.pjlink.input.source;					
				} else if (this.deviceRecord.data.pjlink.input.channel){
					inputText=this.deviceRecord.data.pjlink.input.channel;					
				}
			}
			if (inputText!=""){
				inputText="<div class='monitorParamValue'>"+inputText+"</div>";
			} else {
				inputText="<div class='monitorParamValue bgWarning'>input source N/A</div>";			
			}
			
			//Mute / shutter
			var muteText="";
			if (this.deviceRecord.data.pjlink.mute){
				if (this.deviceRecord.data.pjlink.mute.video){
					muteText="<div class='monitorParamValue cmdShutter bgOrange'>shutter active</div>";
				} else {
					muteText="<div class='monitorParamValue cmdShutter'>shutter off</div>";					
				}
			}
			if (muteText==""){
					muteText="<div class='monitorParamValue bgWarning'>shutter info N/A</div>";										
			}
			
			//Lamp hours
			var lampText="";
			if (this.deviceRecord.data.pjlink.lamps){
				if (this.deviceRecord.data.pjlink.lamps[0]){
					lampText="<div class='monitorParamValue'>lamp: "+this.deviceRecord.data.pjlink.lamps[0].hours+" hrs</div>";
				}
			}
			if (lampText==""){
					lampText="<div class='monitorParamValue bgWarning'>lamp info N/A</div>";										
			}
			
			
			
			//Errors
			var errText="";
			if (this.deviceRecord.data.pjlink.errors){
				if (this.deviceRecord.data.pjlink.errors.fan){
					errText+=" fan";
				}
				if (this.deviceRecord.data.pjlink.errors.temperature){
					errText+=" temperature";
				}
				if (this.deviceRecord.data.pjlink.errors.lamp){
					errText+=" lamp";
				}
				if (this.deviceRecord.data.pjlink.errors.cover){
					errText+=" cover";
				}
				if (this.deviceRecord.data.pjlink.errors.filter){
					errText+=" filter";
				}
				if (this.deviceRecord.data.pjlink.errors.other){
					errText+=" other";
				}				
			}
			if (errText=="") {
				errText="<div class='monitorParamValue'>no errors</div>";				
			} else {
				errText="<div class='monitorParamValue bgError'>"+errText+"</div>";				
			}

			
			statusText=statusText+muteText+inputText+lampText+errText;
			//statusText+=new Date.getTime();
			//this.deviceRecord.data.status.value==1 ? statusText="<div class='monitorParamValue bgGreen'>on</div>" : statusText="<div class='monitorParamValue bgRed'>off</div>";			
		}
		if (this.deviceRecord.error){
			statusText="<div class='monitorParamValue bgError'>connection error</div>";			
		}
		h="<div class='monitorParamName'>"+label+"</div>"+statusText;
		
		$(this.getMonitorDIVselector()).html(h);
		
		//Shutter - single click/tap
		$(this.getMonitorDIVselector()).find(".monitorParamValue.cmdShutter").click(function(e){
			thisDevice.toggleShutter();
		});
		
		
		//Power - double tap/click
		var button=$(this.getMonitorDIVselector()).find(".cmdPowerState");
		button.bind('dblclick',function(e){
			thisDevice.toggleStatus();
		}).bind('touchstart',function(e){
			e.preventDefault(); //Prevent zoom
			var released=button.attr('data-released');
			if (new Date().getTime()-released<500){
				//This is a double-tap: the last tap released less than 500ms ago 
				thisDevice.toggleStatus();
			} 
		}).bind('touchend',function(e){
			e.preventDefault(); //Prevent zoom
			button.attr('data-released',new Date().getTime());
		});
		
		

		
	}
	
	
	
}