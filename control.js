class Control {
  constructor(cnv) {
    this.ctx = 
    this.steer = 0;
    this.speed = 0;
    this.cnv = cnv;
    this.ctx = controlcnv.getContext('2d');
    
    this.cnv.width=1000;//horizontal resolution (?) - increase for better looking text
    this.cnv.height=500;//vertical resolution (?) - increase for better looking text
    
    this.joystickx = this.cnv.width / 3 / 2;
    this.joysticky = this.cnv.width / 3 / 2;
    this.joystickr = this.cnv.width / 3 / 2;    
    this.clicked = false;

['mousedown','mouseup','mousemove','touchstart','touchmove','touchend'].forEach( evt => 
  this.cnv.addEventListener(evt, 
    function(event){
      let rect = control.cnv.getBoundingClientRect();
      let steer = 0;
      let speed = 0;
      let x = control.joystickx;
      let y = control.joysticky;

      event.preventDefault();
      switch (event.type){
        case "mousedown":
          this.clicked = true;
        case "mousemove":
          if (this.clicked){
            x = event.clientX - control.cnv.offsetLeft;
            y = event.clientY - control.cnv.offsetTop;
          }
          break;
        case "touchstart":
        case "touchmove":
          x = event.touches[0].clientX - control.cnv.offsetLeft;
          y = event.touches[0].clientY - control.cnv.offsetTop;
          break;
        case "mouseup":
          this.clicked = false;
        case "touchend":
          break;
      }

      steer = Math.round(control.map(x,0,control.joysticky*2,-1000,1000));
      speed = Math.round(control.map(y,control.joystickx*2,0,-1000,1000));
      
      control.display(steer,speed);
      control.setSpeed(steer,speed);
    }
  , false));

}

  setSpeed(steer,speed){
    this.steer = isNaN(steer) ? 0 : steer;
    this.speed = isNaN(speed) ? 0 : speed;
  }

  startSend(){
    setInterval(function(){
      if (serial.connected && serial.binary){
        serial.sendBinary();
      }
    },50);
  }


  clear(){
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.cnv.width, this.cnv.height);
  }

  display(steer,speed){
    this.clear();

    this.ctx.strokeStyle = "white";
    this.ctx.beginPath();
    this.ctx.arc(this.joystickx, this.joysticky, this.joystickr, 0, 2 * Math.PI, false);

    this.ctx.moveTo(0, this.joysticky);
    this.ctx.lineTo(this.joystickx*2, this.joysticky);
    this.ctx.moveTo(this.joystickx,0);
    this.ctx.lineTo(this.joystickx, this.joysticky*2);
    this.ctx.stroke();
  
    this.ctx.font = "20px Consolas";
    this.ctx.fillStyle = "green";
    this.ctx.fillText("Steer: " + steer, this.joystickx*2, 20);
    this.ctx.fillText("Speed: " + speed, this.joystickx*2, 40);
  }

  clamp(val, min, max) {
    return val > max ? max : val < min ? min : val;
  }
  
  map(x, in_min, in_max, out_min, out_max) {
    return this.clamp((x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min, out_min,out_max);
  }
  

}