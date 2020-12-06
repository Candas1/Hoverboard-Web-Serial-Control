class Control {
  constructor(cnv) {
    this.ctx = 
    this.steer = 0;
    this.speed = 0;
    this.joystick = [{posx:0,posy:0,x:0,y:0,distance:0},{posx:0,posy:0,x:0,y:0,distance:0}];
    this.distance = 0;
    this.cnv = cnv;
    this.ctx = controlcnv.getContext('2d');    
    
    this.initCanvas();
    this.clicked = false;

['mousedown','mouseup','mousemove','touchstart','touchmove','touchend'].forEach( evt => 
  this.cnv.addEventListener(evt, 
    function(event){
      control.joystick[0].x = control.joystick[0].posx;
      control.joystick[0].y = control.joystick[0].posy;
      
      control.joystick[1].x = control.joystick[1].posx;
      control.joystick[1].y = control.joystick[1].posy;

      event.preventDefault();
      switch (event.type){
        case "mousedown":
          control.clicked = true;
        case "mousemove":
          if (control.clicked){
            control.joystick[0].x = event.clientX - control.cnv.offsetLeft;
            control.joystick[0].y = event.clientY - control.cnv.offsetTop;
          }
          break;
        case "touchstart":
        case "touchmove":
          
          let distance = 0;
          let x = 0;
          let y = 0;
          for (let i = 0; i < control.joystick.length;i++){
            for (let j= 0; j< event.touches.length;j++){
              x = event.touches[j].clientX - control.cnv.offsetLeft;
              y = event.touches[j].clientY - control.cnv.offsetTop;
              distance = control.calcDistance(x,y,control.joystick[i].posx,control.joystick[i].posy);
              if ( distance < control.joystickr2 * 3){
                control.joystick[i].x = x;
                control.joystick[i].y = y; 
              }
            }
          }
          break;
        case "mouseup":
          control.clicked = false;
        case "touchend":
          break;
      }
      
      control.steer = Math.round(control.map(control.joystick[0].x,control.joystick[0].posx-control.joystickr1,control.joystick[0].posx+control.joystickr1,-1000,1000));
      control.speed = Math.round(control.map(control.joystick[1].y,control.joystick[1].posy+control.joystickr1,control.joystick[1].posy-control.joystickr1,-1000,1000));

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
    
    this.joystick[0].posx = (this.cnv.width / 3 / 2);
    this.joystick[0].posy = (this.cnv.height / 3 / 2) + this.cnv.height/10;
    
    this.joystick[1].posx = (this.cnv.width - this.cnv.width / 3 /2);
    this.joystick[1].posy = (this.cnv.height / 3 / 2) + this.cnv.height/10;
    
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

    this.joystick[0].x = this.joystick[0].posx;
    this.joystick[0].y = this.joystick[0].posy;

    this.joystick[1].x = this.joystick[1].posx;
    this.joystick[1].y = this.joystick[1].posy;


    this.display();
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

    this.displayJoystick(0);
    this.displayJoystick(1);

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

  displayJoystick(joynum){

    // Outer ring
    let gradient = this.ctx.createLinearGradient(0, this.joystick[joynum].posy + this.joystickr2, this.joystick[joynum].posx + this.joystickr2, 0);
    gradient.addColorStop(0, 'white');
    gradient.addColorStop(1, 'black');
    
    this.ctx.beginPath();
    this.ctx.fillStyle = gradient;
    this.ctx.arc(this.joystick[joynum].posx, this.joystick[joynum].posy, this.joystickr2, 0, 2 * Math.PI, false);
    this.ctx.closePath();
    this.ctx.fill();

    // Outer circle
    this.ctx.beginPath();
    this.ctx.fillStyle = "black";
    this.ctx.arc(this.joystick[joynum].posx, this.joystick[joynum].posy, this.joystickr1, 0, 2 * Math.PI, false);
    this.ctx.closePath();
    this.ctx.fill();

    // Outer square
    gradient = this.ctx.createLinearGradient(this.joystick[joynum].posx,this.joystick[joynum].posy-this.joystickr4, this.joystick[joynum].posx, this.joystick[joynum].posy + this.joystickr4);
    gradient.addColorStop(0, 'black');
    gradient.addColorStop(0.45, 'grey');
    gradient.addColorStop(0.55, 'grey');
    gradient.addColorStop(1, 'black');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(this.joystick[joynum].posx-this.joystickr4,this.joystick[joynum].posy-this.joystickr4,this.joystickr4*2,this.joystickr4*2);

    // Inner circle
    this.ctx.beginPath();
    this.ctx.fillStyle = "black";
    this.ctx.arc(this.joystickx,
                 this.clamp(this.joystick[joynum].y[joynum], this.joystick[joynum].y-this.joystickr1+this.joystickr3,this.joystick[joynum].y+this.joystickr1-this.joystickr3),
                 this.joystickr3, 0, 2 * Math.PI, false);
    this.ctx.closePath();
    this.ctx.fill();

    // Inner square
    gradient = this.ctx.createLinearGradient(this.joystick[joynum].posx-this.joystickr5,this.joystick[joynum].y, this.joystick[joynum].posx + this.joystickr5, this.joystick[joynum].y);
    gradient.addColorStop(0, 'black');
    gradient.addColorStop(0.45, 'grey');
    gradient.addColorStop(0.55, 'grey');
    gradient.addColorStop(1, 'black');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(this.joystick[joynum].posx-this.joystickr5,
                      this.clamp(this.joystick[joynum].y-this.joystickr5,this.joystick[joynum].posy-this.joystickr5/2-this.joystickr4,this.joystick[joynum].posy+this.joystickr4/3),
                      this.joystickr5*2,
                      this.joystickr5*2);

    // Center circle
    this.ctx.beginPath();
    this.ctx.fillStyle = "black";
    this.ctx.arc(this.clamp(this.joystick[joynum].x,this.joystick[joynum].posx-this.joystickr3+this.joystickr6,this.joystick[joynum].posx+this.joystickr3-this.joystickr6), 
    this.clamp(this.joystick[joynum].y,this.joystick[joynum].posy-this.joystickr4+this.joystickr5/2,this.joystick[joynum].posy+this.joystickr4-this.joystickr5/2),
                 this.joystickr6, 0, 2 * Math.PI, false);
    this.ctx.closePath();
    this.ctx.fill();

    // Knob
    this.ctx.beginPath();
    this.ctx.fillStyle = "red";
    this.ctx.arc(this.clamp(this.joystick[joynum].x,this.joystick[joynum].posx-this.joystickr2+this.joystickr6,this.joystick[joynum].posx+this.joystickr2-this.joystickr6),
                 this.clamp(this.joystick[joynum].y,this.joystick[joynum].posy-this.joystickr2+this.joystickr6,this.joystick[joynum].posy+this.joystickr2-this.joystickr6), 
                 this.joystickr6, 0, 2 * Math.PI, false);
    this.ctx.closePath();
    this.ctx.fill();

  }

  clamp(val, min, max) {
    return val > max ? max : val < min ? min : val;
  }
  
  map(x, in_min, in_max, out_min, out_max) {
    return this.clamp((x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min, out_min,out_max);
  }
  

}