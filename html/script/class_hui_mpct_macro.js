class Mpct_macro {
	
	constructor(macroRecord,config,socket){
		this.config=config;
		this.socket=socket;
		this.macroRecord={};
		deepCopy(macroRecord,this.macroRecord);
	}

	triggerMacro(){
		
	}

}