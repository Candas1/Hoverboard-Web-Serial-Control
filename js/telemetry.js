class Telemetry extends EventTarget{
  constructor() {
    super();
    this.wheelRadiusCm = 8;
    this.batV = 0;
    this.temp = 0;
    this.customEvent = new CustomEvent("update");
  }

  update(message){
    if (message["batV"] != undefined){
      this.batV = message.batV/100;
    }
    if (message["temp"] != undefined){
      this.temp = message.temp/10;
    }
    if (message.DCLink!= undefined){
      this.DCLink = message.DCLink / 10;
    }
    if (message.speedR!= undefined && message.speedL != undefined){
      this.speedRPM = Math.round( (Math.abs(message.speedR) + Math.abs(message.speedL)) / 
                      Math.max(1,(message.speedR!=0) + (message.speedL!=0)) );
      this.speedKMH = Math.round( 2 * Math.PI * this.wheelRadiusCm * this.speedRPM * 60 / 100000);
    }

    this.dispatchEvent(this.customEvent);
  }
}