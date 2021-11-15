class Mpct_ds18b20 extends Mpct_device {
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
		if (('value' in this.deviceRecord.data.temperature) && (this.deviceRecord.data.temperature.value!==false)){
			displayData=this.deviceRecord.data.temperature.value+this.deviceRecord.data.temperature.unit;
		} else {
			displayData="N/A";
		}
		var deviceInfoHTML=
			"<table>"
			+"<tr><td>Temperature</td></tr><tr><td>"+displayData+"</td></tr>"
			+"</table>";
		$(this.getInfoDIVselector()+" .deviceData").html(deviceInfoHTML);
		this.updateInfoDivReadAtAndError();
	}			
	
	updateMonitorDiv(){
		var h="",label,statusText;
		this.deviceRecord.meta.name ? label=this.deviceRecord.meta.name : label=this.uid;
		if (this.deviceRecord.data.temperature && this.deviceRecord.data.temperature.value){
			statusText=this.deviceRecord.data.temperature.value+this.deviceRecord.data.temperature.unit;			
		} else {
			statusText="N/A";
		}
		h="<div class='monitorParamName'>"+label+"</div><div class='monitorParamValue'>"+statusText+"</div>";
		
		$(this.getMonitorDIVselector()).html(h);		
		this.updateMonitorDivError(); //Parent class		
	}

}