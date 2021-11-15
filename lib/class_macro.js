/*
*
*
*	Macros on the MPCT server
*
*/

class Macro {
	
	constructor(macroId,macroRecord,config,mqttMpct){
		this.macroRecord=macroRecord;
		this.id=macroId;
		this.mqttMpct=mqttMpct;
		this.status={}; //Will hold live data during execution
		this.config=config;		
		/*
		 * Locate and verify scriptfile
		 */
		if (this.macroRecord.scriptFile){
			var fs=require('fs');
			if (fs.existsSync(this.macroRecord.scriptFile)){
				
				
				var script=getParentDirectory(__dirname)+"/"+this.macroRecord.scriptFile;
				var mScript=require(script);
				this.mScript=new mScript(this.config,this.mqttMpct,this);
				
				log("Instantiating macro "+macroId+" ("+macroRecord.label+")","mpct");
				
				this.mScript.isReady();
				return;
			}
		}
		log("Unable to instantiate "+macroId+" ("+macroRecord.label+")","mpct",true);		
	}
	
	static loadMacrosFromFile(config){
		config.macros=readJson("macros.json");
		if (config.macros){
			log("Loaded "+objectSize(config.macros)+" macro(s)","mpct");
		} else {
			log("No macros currently loaded","mpct");
		}
	}
		
	execute(){		
		let pcm=this.pcmExecuting(this.id); //Is a prohibited concurrent macro currently executing?
		if (!pcm){
			log("Executing macro "+this.id+" ("+this.macroRecord.label+")","mpct");
			this.status.executing=true;
			
			if (this.macroRecord.targetConditions){
				log("Macro has target conditions:"+JSON.stringify(this.macroRecord.targetConditions));
				for (var deviceUid in this.macroRecord.targetConditions){
					console.log(deviceUid);
				}
			}
			
			this.mScript.execute();
			
		} else {
			log("Can't execute macro "+this.id+" ("+this.macroRecord.label+"), prohib. conc. macro is executing: "+pcm,"mpct",true);			
		}				
	}
	
	//Is a prohibited concurrent macro (pcm) for macro xMacroId currently executing?
	pcmExecuting(xMacroId){
		for (macroId in this.config.macros){
			if (this.config.macros[macroId].macroRecord.execIndicator){
				if (macroId==xMacroId || this.config.macros[xMacroId].macroRecord.prohibitedConcurrentMacros.includes(macroId)){
					return macroId; //macroId is currently executing AND on the list of prohibited concurrent macros for xMacroId
				}
			}
		}
		return false;
	}
	
	//Is there a macro currently being executed?
	anyMacroExecuting(){		
		for (macroId in this.config.macros){
			log("Checking macro "+macroId);
			if (this.config.macros[macroId].macroRecord.execIndicator){
				//log("Macro currently executing: "+macroId,"macros");
				return macroId;
			}
		}
		//log("No macro is currently executing","macros");
		return false;
	}
	
	
	
}

module.exports=Macro;