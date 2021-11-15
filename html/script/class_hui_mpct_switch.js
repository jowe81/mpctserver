class Mpct_switch extends Mpct_device {
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
		//Update
		var displayData;
		if ('value' in this.deviceRecord.data.status){
			if (this.deviceRecord.data.status.value===true){
				displayData="closed";
			} else if (this.deviceRecord.data.status.value===false){
				displayData="open";
			}
		} else {
			displayData="N/A";
		}
		var deviceInfoHTML=
			"<table>"
			+"<tr><td>Status</td></tr><tr><td>"+displayData+"</td></tr>"
			+"</table>";
		$(this.getInfoDIVselector()+" .deviceData").html(deviceInfoHTML);
		this.updateInfoDivReadAtAndError();
	}

	
	toggleStatus(){
		console.log("Status: ",this.deviceRecord.data.status.value);
		console.log("Toggling");
		console.log("Status: ",this.deviceRecord.data.status.value);
	}
	
	updateMonitorDiv(){
		var h="",label,statusText;
		this.deviceRecord.meta.name ? label=this.deviceRecord.meta.name : label=this.uid;
		if (this.deviceRecord.data.status){
			this.deviceRecord.data.status.value==1 ? statusText="<div class='monitorParamValue bgGreen'>closed</div>" : statusText="<div class='monitorParamValue'>open</div>";			
		} else {
			statusText="N/A";
		}
		h="<div class='monitorParamName'>"+label+"</div>"+statusText;
		
		$(this.getMonitorDIVselector()).html(h);
	}

	
}