class Telemetry extends EventTarget{
  constructor() {
    super();
    this.wheelRadiusCm = 8;
    this.batV = 0;
    this.temp = 0;
    this.cmd1 = 0;
    this.cmd2 = 0;
    this.customEvent = new CustomEvent("update");
  }

  update(message){
    if (message["batV"] != undefined){
      this.batV = message.batV/100;
    }
    if (message["temp"] != undefined){
      this.temp = message.temp/10;
    }
    if (message.dccurr!= undefined){
      this.DCLink = message.dccurr / 100;
    }
    if (message.speedR!= undefined && message.speedL != undefined){
      this.speedRPM = Math.round( (Math.abs(message.speedR) + Math.abs(message.speedL)) / 
                      Math.max(1,(message.speedR!=0) + (message.speedL!=0)) );
      this.speedKMH = Math.round( 2 * Math.PI * this.wheelRadiusCm * this.speedRPM * 60 / 100000);
    }
    if (message["cmd1"] != undefined){
      this.cmd1 = message.cmd1;
    }
    if (message["cmd2"] != undefined){
      this.cmd2 = message.cmd2;
    }



    this.dispatchEvent(this.customEvent);
  }
}