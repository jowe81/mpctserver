class Mpct_relay extends Mpct_device {
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
		
	getCommandJson(cmdString){
		var value;
		if (cmdString=="turnOff"){
			value=false;
		} else if (cmdString=="turnOn"){
			value=true;
		}
		return {"deviceUid":this.uid,"data":{"status":{"value":!value}}};		
	}
	
	toggleStatus(){
		var commandJson;		
		if (this.deviceRecord.data.status.value!=0){
			commandJson=this.getCommandJson("turnOn");
		} else {
			commandJson=this.getCommandJson("turnOff");
		}
		this.executeCommand(commandJson);
	}
	
	updateMonitorDiv(){
		var h="",label,statusText,uid;
		var thisDevice=this;
		this.deviceRecord.meta.name ? label=this.deviceRecord.meta.name : label=this.uid;
		if (this.deviceRecord.data.status){
			this.deviceRecord.data.status.value==1 ? statusText="<div class='monitorParamValue bgGreen'>on</div>" : statusText="<div class='monitorParamValue bgRed'>off</div>";			
		} else {
			statusText="N/A";
		}
		h="<div class='monitorParamName'>"+label+"</div>"+statusText;
		
		$(this.getMonitorDIVselector()).html(h);
		
		//Enable double click and double tap for activation
		var button=$(this.getMonitorDIVselector()).find(".monitorParamValue");
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