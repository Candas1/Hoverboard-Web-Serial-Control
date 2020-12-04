class Command {
  constructor() {
    this.steer = 0;
    this.speed = 0;
  }

  setSpeed(steer,speed){
    this.steer = isNaN(steer) ? 0 : steer;
    this.speed = isNaN(speed) ? 0 : speed;
  }

  cmdAscii(text){
    serial.sendAscii(text + (crIn.checked ?"\r":"") + (lfIn.checked ?"\n":"")); 
  }

}