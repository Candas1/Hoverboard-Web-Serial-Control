class Control {
  constructor(cnv) {
    this.ctx = 
    this.steer = 0;
    this.speed = 0;
    this.x = 0;
    this.y = 0;
    this.distance = 0;
    this.cnv = cnv;
    this.ctx = controlcnv.getContext('2d');    
    
    this.initCanvas();
    this.clicked = false;

['mousedown','mouseup','mousemove','touchstart','touchmove','touchend'].forEach( evt => 
  this.cnv.addEventListener(evt, 
    function(event){
      let steer = 0;
      let speed = 0;
      control.x = control.joystickx;
      control.y = control.joysticky;

      event.preventDefault();
      switch (event.type){
        case "mousedown":
          control.clicked = true;
        case "mousemove":
          if (control.clicked){
            control.x = event.clientX - control.cnv.offsetLeft;
            control.y = event.clientY - control.cnv.offsetTop;
          }
          break;
        case "touchstart":
        case "touchmove":
          control.x = event.touches[0].clientX - control.cnv.offsetLeft;
          control.y = event.touches[0].clientY - control.cnv.offsetTop;
          break;
        case "mouseup":
          control.clicked = false;
        case "touchend":
          break;
      }
      
      control.distance = control.calcDistance(control.x,control.y,control.joystickx,control.joysticky);
      if ( control.distance < control.joystickr2) {
        control.steer = Math.round(control.map(control.x,control.joystickx-control.joystickr1,control.joystickx+control.joystickr1 ,-1000,1000));
        control.speed = Math.round(control.map(control.y,control.joysticky+control.joystickr1,control.joysticky-control.joystickr1,-1000,1000));
      }else{
        control.steer = control.speed = 0;
      }

      control.display();
    }
  , false));

}

  calcDistance(x1,y1,x2,y2){
    return Math.sqrt(Math.pow(x1 - x2, 2) + 
                     Math.pow(y1 - y2, 2));

  }

  startSend(){
    setInterval(function(){
      if (serial.connected && serial.binary){
        serial.sendBinary();
      }
    },50);
  }

  initCanvas(){
    this.cnv.width=1000;//window.innerWidth;
    this.cnv.height=500;//window.innerHeight;
    

    this.joystickx = (this.cnv.width / 3 / 2) + this.cnv.width / 10;
    this.joysticky = (this.cnv.height / 3 / 2) + this.cnv.height /10;
    
    this.joystickr1 = (this.cnv.height / 3 / 2); //inner ring
    this.joystickr2 = this.joystickr1 * 1.2; // outer ring 20% bigger than circle
    this.joystickr3 = this.joystickr1 * 0.5; // deadband 40%
    this.joystickr4 = this.joystickr1 * 0.7; // outer square
    this.joystickr5 = this.joystickr3 * 0.7; // inner square
    this.joystickr6 = this.joystickr1 * 0.2; // knob

    this.screenx1 = this.cnv.width / 3;
    this.screeny1 = this.cnv.height / 3 * 1.5;
    
    this.screenWidth1 = this.cnv.width / 3;
    this.screenHeight1 = this.cnv.height / 3;
    
    this.screenx2 = this.screenx1 * 1.05;
    this.screeny2 = this.screeny1 * 1.05;
    
    this.screenWidth2 = this.screenWidth1 * 0.9;
    this.screenHeight2 = this.screenHeight1 * 0.85;    

    this.x = this.joystickx;
    this.y = this.joysticky;

    this.display(0,0);
  }

  display(){
    
    // Case
    let gradient = this.ctx.createLinearGradient(0, this.cnv.height, this.cnv.width, this.cnv.height);
    gradient.addColorStop(0, 'white');
    gradient.addColorStop(0.05, 'lightgrey');
    gradient.addColorStop(0.4, 'grey');
    gradient.addColorStop(0.6, 'grey');
    gradient.addColorStop(0.95, 'lightgrey');
    gradient.addColorStop(1, 'white');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.cnv.width, this.cnv.height);
    
    // Outer ring
    gradient = this.ctx.createLinearGradient(0, this.joysticky + this.joystickr2, this.joystickx+this.joystickr2, 0);
    gradient.addColorStop(0, 'white');
    gradient.addColorStop(1, 'black');
    
    this.ctx.beginPath();
    this.ctx.fillStyle = gradient;
    this.ctx.arc(this.joystickx, this.joysticky, this.joystickr2, 0, 2 * Math.PI, false);
    this.ctx.closePath();
    this.ctx.fill();

    // Outer circle
    this.ctx.beginPath();
    this.ctx.fillStyle = "black";
    this.ctx.arc(this.joystickx, this.joysticky, this.joystickr1, 0, 2 * Math.PI, false);
    this.ctx.closePath();
    this.ctx.fill();

    // Outer square
    gradient = this.ctx.createLinearGradient(this.joystickx,this.joysticky-this.joystickr4, this.joystickx, this.joysticky + this.joystickr4);
    gradient.addColorStop(0, 'black');
    gradient.addColorStop(0.45, 'grey');
    gradient.addColorStop(0.55, 'grey');
    gradient.addColorStop(1, 'black');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(this.joystickx-this.joystickr4,this.joysticky-this.joystickr4,this.joystickr4*2,this.joystickr4*2);

    // Inner circle
    this.ctx.beginPath();
    this.ctx.fillStyle = "black";
    this.ctx.arc(this.joystickx, this.joysticky, this.joystickr3, 0, 2 * Math.PI, false);
    this.ctx.closePath();
    this.ctx.fill();

    // Inner square
    gradient = this.ctx.createLinearGradient(this.joystickx-this.joystickr5,this.joysticky, this.joystickx + this.joystickr5, this.joysticky);
    gradient.addColorStop(0, 'black');
    gradient.addColorStop(0.45, 'grey');
    gradient.addColorStop(0.55, 'grey');
    gradient.addColorStop(1, 'black');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(this.joystickx-this.joystickr5,this.joysticky-this.joystickr5,this.joystickr5*2,this.joystickr5*2);

    // Center circle
    this.ctx.beginPath();
    this.ctx.fillStyle = "black";
    this.ctx.arc(this.joystickx, this.joysticky, this.joystickr6, 0, 2 * Math.PI, false);
    this.ctx.closePath();
    this.ctx.fill();

    // Knob
    this.ctx.beginPath();
    this.ctx.fillStyle = (this.distance > this.joystickr2) ? "red": (this.distance > this.joystickr1) ? "orange":(this.distance > this.joystickr3) ? "grey":"black";
    this.ctx.arc(this.x, this.y, this.joystickr6, 0, 2 * Math.PI, false);
    this.ctx.closePath();
    this.ctx.fill();

    // Screen outer rectangle
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(this.screenx1,this.screeny1,this.screenWidth1,this.screenHeight1);

    // Screen inner rectangle
    this.ctx.fillStyle = "turquoise";
    this.ctx.fillRect(this.screenx2,this.screeny2,this.screenWidth2,this.screenHeight2);

    // text
    this.ctx.font = "20px Consolas";
    this.ctx.fillStyle = "blue";
    this.ctx.fillText("Steer: " + this.steer, this.screenx2 + 20, this.screeny2 + 20);
    this.ctx.fillText("Speed: " + this.speed, this.screenx2 + 20, this.screeny2 + 40);
    

  }

  clamp(val, min, max) {
    return val > max ? max : val < min ? min : val;
  }
  
  map(x, in_min, in_max, out_min, out_max) {
    return this.clamp((x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min, out_min,out_max);
  }
  

}