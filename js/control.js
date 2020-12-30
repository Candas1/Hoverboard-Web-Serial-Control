class Control {
  constructor(cnv) {
    this.cnv = cnv;
    this.ctx = cnv.getContext('2d');
    
    this.channel = new Array(14).fill(0);
    this.joystick = [{name:"1",posx:0,posy:0,x:0,y:0,r:0,normx:0,normy:0,minx:-1000,maxx:1000,miny:-1000,maxy:1000,hold:false,vibrate:false,clicked:false,visible:true},
                     {name:"2",posx:0,posy:0,x:0,y:0,r:0,normx:0,normy:0,minx:-1000,maxx:1000,miny:-1000,maxy:1000,hold:false,vibrate:false,clicked:false,visible:true},
                     {name:"SWA",posx:0,posy:0,x:0,y:0,r:0,normx:0,normy:0,minx:0,maxx:0,miny:1,maxy:2,hold:true,vibrate:true,clicked:false,visible:true},
                     {name:"SWB",posx:0,posy:0,x:0,y:0,r:0,normx:0,normy:0,minx:0,maxx:0,miny:1,maxy:3,hold:true,vibrate:true,clicked:false,visible:true},
                     {name:"SWC",posx:0,posy:0,x:0,y:0,r:0,normx:0,normy:0,minx:0,maxx:0,miny:1,maxy:3,hold:true,vibrate:true,clicked:false,visible:true},
                     {name:"SWD",posx:0,posy:0,x:0,y:0,r:0,normx:0,normy:0,minx:0,maxx:0,miny:1,maxy:2,hold:true,vibrate:true,clicked:false,visible:true}];
    this.telemetry = {};
    this.mixer = "mix1";
    this.hold  = false;    
    this.initCanvas();

  ['mousedown','mouseup','mousemove','touchstart','touchmove','touchend'].forEach( evt => 
    this.cnv.addEventListener(evt, this.handleEvents.bind(this), false));

  }

  handleEvents(event){
    let i = 0;
    let j = 0;

    if (!this.hold){
      this.initPos();
    }

    event.preventDefault();
    switch (event.type){
      case "mousedown":
        this.joystick[0].clicked = true;
      case "mousemove":
        if (this.joystick[0].clicked){
          let distance = 0;
          let x = 0;
          let y = 0;
          let rect = event.target.getBoundingClientRect();
          for (i = 0; i < this.joystick.length;i++){
            if (!this.joystick[i].visible) continue;
            x = event.clientX - rect.left;
            y = event.clientY - rect.top;
            distance = this.calcDistance(x,y,this.joystick[i].posx,this.joystick[i].posy);
            if ( distance < this.joystick[i].r * (event.type == "mousedown" ? 1 : 2) ){
              this.joystick[i].x = x;
              this.joystick[i].y = y;
            }
          }
        }
        break;
      case "mouseup":
        this.joystick[0].clicked = false;
        break;
      case "touchstart":
      case "touchmove":
      case "touchend":
        let distance = 0;
        let x = 0;
        let y = 0;
        for (i = 0; i < this.joystick.length;i++){
          if (!this.joystick[i].visible) continue;
          for (j= 0; j< event.touches.length;j++){
            let rect = event.touches[j].target.getBoundingClientRect();
            x = event.touches[j].clientX - rect.left;
            y = event.touches[j].clientY - rect.top;
            distance = this.calcDistance(x,y,this.joystick[i].posx,this.joystick[i].posy);
            if ( distance < this.joystick[i].r * (event.type == "touchstart" ? 1 : 2) ){
              this.joystick[i].x = x;
              this.joystick[i].y = y;
            }
          }
        }
        break;
    }

    // Normalize
    for (i = 0;i<this.joystick.length;i++){
      this.joystick[i].normx = Math.round(this.map(this.joystick[i].x,this.joystick[i].posx-this.joystick[i].r,this.joystick[i].posx+this.joystick[i].r,this.joystick[i].minx,this.joystick[i].maxx));
      this.joystick[i].normy = Math.round(this.map(this.joystick[i].y,this.joystick[i].posy+this.joystick[i].r,this.joystick[i].posy-this.joystick[i].r,this.joystick[i].miny,this.joystick[i].maxy));
    
      if (this.joystick[i].vibrate){
        if ((this.joystick[i].prevx != this.joystick[i].normx) ||
           (this.joystick[i].prevy != this.joystick[i].normy)){
            navigator.vibrate([100]);     
        }
      }

      this.joystick[i].prevx = this.joystick[i].normx;
      this.joystick[i].prevy = this.joystick[i].normy;
    }

    this.Mixer();
    this.display();
  }

  Mixer(){
    switch(this.mixer){
      case "mix1":
        this.channel[0] = this.joystick[0].normx;
        this.channel[1] = this.joystick[1].normy;
        break;
      case "mix2":
        this.channel[0] = this.joystick[0].normx;
        this.channel[1] = this.joystick[0].normy;
        break;
      case "mix3":
        this.channel[0] = this.joystick[1].normx;
        this.channel[1] = this.joystick[1].normy;
        break;  
    }
  }

  initPos(){
    for (let i = 0;i<this.joystick.length;i++){
      if (!this.joystick[i].hold){
        this.joystick[i].x = this.joystick[i].posx;
        this.joystick[i].y = this.joystick[i].posy;
      }
    }
  }

  calcPos(){
    for (let i = 0;i<this.joystick.length;i++){
      let r1 = this.joystick[i].r;
      let r2 = r1 * 1.2; // outer circle
      let r6 = r1 * 0.2; // knob

      this.joystick[i].x = (this.joystick[i].minx == this.joystick[i].maxx)?this.joystick[i].posx:this.map(this.joystick[i].normx,this.joystick[i].minx,this.joystick[i].maxx,this.joystick[i].posx-r2+r6,this.joystick[i].posx+r2-r6);
      this.joystick[i].y = (this.joystick[i].miny == this.joystick[i].maxy)?this.joystick[i].posy:this.map(this.joystick[i].normy,this.joystick[i].maxy,this.joystick[i].miny,this.joystick[i].posy-r2+r6,this.joystick[i].posy+r2-r6);
    }
  }

  calcDistance(x1,y1,x2,y2){
    return Math.sqrt(Math.pow(x1 - x2, 2) + 
                     Math.pow(y1 - y2, 2));
  }

  initCanvas(){

    this.cnv.width= this.cnv.parentElement.clientWidth;
    this.cnv.height= this.cnv.parentElement.clientHeight; 

    if (window.screen.orientation.type.includes("landscape")){
      
      // Joysticks
      this.joystick[0].posx = (this.cnv.width / 6);
      this.joystick[0].posy = this.cnv.height / 2;
      this.joystick[0].visible = true;

      this.joystick[1].posx = (this.cnv.width - this.joystick[0].posx);
      this.joystick[1].posy = this.joystick[0].posy;
      this.joystick[1].visible = true;

      this.joystick[1].r = this.joystick[0].r = (this.cnv.height / 6); //inner ring

      // Switches
      this.joystick[2].posx = (this.cnv.width / 3.4) + (this.cnv.width /3/4);
      this.joystick[3].posx = (this.cnv.width / 3.4) + 2 * (this.cnv.width /3/4);
      this.joystick[4].posx = (this.cnv.width / 3.4) + 3 * (this.cnv.width /3/4);
      this.joystick[5].posx = (this.cnv.width / 3.4) + 4 * (this.cnv.width /3/4);

      this.joystick[5].posy = this.joystick[4].posy = this.joystick[3].posy = this.joystick[2].posy = (this.cnv.height / 4);
      this.joystick[5].visible = this.joystick[4].visible = this.joystick[3].visible = this.joystick[2].visible = true;
      this.joystick[5].r = this.joystick[4].r = this.joystick[3].r = this.joystick[2].r = (this.cnv.height / 30)

    }else{
      // Joysticks
      this.joystick[0].posx = (this.cnv.width / 2);
      this.joystick[0].posy = 2 * (this.cnv.height / 3);
      this.joystick[0].visible = true;

      this.joystick[1].visible = false;
      this.mixer = mixerIn.value = "mix2";
      this.joystick[1].r = this.joystick[0].r = (this.cnv.height / 8); //inner ring
    
      // Switches
      this.joystick[2].posx = (this.cnv.width / 8);
      this.joystick[3].posx = 3 * (this.cnv.width / 8);
      this.joystick[4].posx = 5 * (this.cnv.width / 8);
      this.joystick[5].posx = 7 * (this.cnv.width / 8);

      this.joystick[5].posy = this.joystick[4].posy = this.joystick[3].posy = this.joystick[2].posy = (this.cnv.height / 6);
      this.joystick[5].visible = this.joystick[4].visible = this.joystick[3].visible = this.joystick[2].visible = true;
      this.joystick[5].r = this.joystick[4].r = this.joystick[3].r = this.joystick[2].r = (this.cnv.height / 30)

    }

    //Screen
    if (window.screen.orientation.type.includes("landscape")){
      this.screeny1 = this.cnv.height / 1.75;
      this.screenWidth1 = this.cnv.width / 3;
      this.screenHeight1 = this.cnv.height / 3;
    }else{
      this.screeny1 = this.cnv.height / 4;
      this.screenWidth1 = this.cnv.width / 1.2;
      this.screenHeight1 = this.cnv.height / 5;
    }
    
    // Center screen Horizontally
    this.screenx1 = (this.cnv.width - this.screenWidth1) /2;
    this.screenWidth2 = this.screenWidth1 * 0.9;
    this.screenHeight2 = this.screenHeight1 * 0.85;
    this.screenx2 = this.screenx1 + (this.screenWidth1 - this.screenWidth2) /2;
    this.screeny2 = this.screeny1 + (this.screenHeight1 - this.screenHeight2) /2;    
    
    this.calcPos();
    this.display();
  }

  updateTelemetry(message){
    this.telemetry = message;
  }

  display(){
    // Case
    let gradient = this.ctx.createLinearGradient(0, this.cnv.height, this.cnv.width, this.cnv.height);
    gradient.addColorStop(0, 'lightgrey');
    gradient.addColorStop(0.4, 'grey');
    gradient.addColorStop(0.6, 'grey');
    gradient.addColorStop(1, 'lightgrey');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.cnv.width, this.cnv.height);

    for(let i in this.joystick){
      if (this.joystick[i].visible) this.displayJoystick(this.joystick[i]);
    }

    this.updateScreen();
  }

  updateScreen(){
     // Screen outer rectangle
     this.ctx.fillStyle = "black";
     this.ctx.fillRect(this.screenx1,this.screeny1,this.screenWidth1,this.screenHeight1);
 
     // Screen inner rectangle
     this.ctx.fillStyle = "turquoise";
     this.ctx.fillRect(this.screenx2,this.screeny2,this.screenWidth2,this.screenHeight2);
 
     // text
     let fontsize = Math.round(this.screenWidth2 / 20);
     this.ctx.font =  fontsize +"px Consolas";
     this.ctx.fillStyle = "blue";
     this.ctx.textAlign = "left";
     this.ctx.fillText("Steer", this.screenx2 + fontsize, this.screeny2 + fontsize);
     this.ctx.fillText("Speed", this.screenx2 + fontsize, this.screeny2 + fontsize*2);
     this.ctx.fillText(this.joystick[2].name , this.screenx2 + fontsize, this.screeny2 + fontsize*3);
     this.ctx.fillText(this.joystick[3].name , this.screenx2 + fontsize, this.screeny2 + fontsize*4);
     this.ctx.fillText(this.joystick[4].name , this.screenx2 + fontsize, this.screeny2 + fontsize*5);
     this.ctx.fillText(this.joystick[5].name , this.screenx2 + fontsize, this.screeny2 + fontsize*6);
     
     
     this.ctx.textAlign = "right";
     this.ctx.fillText(this.channel[0], this.screenx2 + fontsize * 7, this.screeny2 + fontsize);
     this.ctx.fillText(this.channel[1], this.screenx2 + fontsize * 7, this.screeny2 + fontsize*2);
     this.ctx.fillText(this.joystick[2].normy , this.screenx2 + fontsize*7, this.screeny2 + fontsize*3);
     this.ctx.fillText(this.joystick[3].normy , this.screenx2 + fontsize*7, this.screeny2 + fontsize*4);
     this.ctx.fillText(this.joystick[4].normy , this.screenx2 + fontsize*7, this.screeny2 + fontsize*5);
     this.ctx.fillText(this.joystick[5].normy , this.screenx2 + fontsize*7, this.screeny2 + fontsize*6);
     

     this.ctx.textAlign = "right";
     if (this.telemetry["batV"] != undefined){
       this.ctx.fillText(this.telemetry.batV/100 + "V", this.screenx2 + this.screenWidth2 - fontsize, this.screeny2 + fontsize);
     }
     if (this.telemetry["temp"] != undefined){
      this.ctx.fillText(this.telemetry.temp/10 + "C", this.screenx2 + this.screenWidth2 - fontsize, this.screeny2 + fontsize*2);
    }
  }

  displayJoystick(joystick){
    let r1 = joystick.r;
    let r2 = r1 * 1.2; // outer circle
    let r3 = r1 * 0.5; // inner circle
    let r4 = r1 * 0.7; // outer square
    let r5 = r1 * 0.35; // inner square
    let r6 = r1 * 0.2; // knob

    // Initial position
    let posx = joystick.posx;
    let posy = joystick.posy;
    
    // Current position
    let x = joystick.x;
    let y = joystick.y;

    // Inner Circle position 
    let x2 = (joystick.minx == joystick.maxx)?posx:this.map(x,posx-r2+r6,posx+r2-r6,posx-r4/2+r6,posx+r4/2-r6)
    let y2 = (joystick.miny == joystick.maxy)?posy:this.map(y,posy-r2+r6,posy+r2-r6,posy-r4/2+r6,posy+r4/2-r6)
    
    // Knob position
    //let x3 = (joystick.minx == joystick.maxx)?posx:this.clamp(x,posx-r2+r6,posx+r2-r6);
    let x3 = (joystick.minx == joystick.maxx)?posx:this.map(joystick.normx,joystick.minx,joystick.maxx,posx-r2+r6,posx+r2-r6);
    //let y3 = (joystick.miny == joystick.maxy)?posy:this.clamp(y,posy-r2+r6,posy+r2-r6); 
    let y3 = (joystick.miny == joystick.maxy)?posy:this.map(joystick.normy,joystick.maxy,joystick.miny,posy-r2+r6,posy+r2-r6);
    
    if (joystick.name != ""){
      let textx = (joystick.posx + joystick.r*1.4 * Math.cos(Math.PI/2*3));
      let texty = (joystick.posy + joystick.r*1.4 * Math.sin(Math.PI/2*3));
      let fontsize = this.cnv.width / 100;
      this.ctx.font = fontsize + "px MuseoSans_900-webfont";
      this.ctx.textAlign = "center";
      this.ctx.fillStyle = "#000";
      this.ctx.fillText(joystick.name, textx, texty);
    }

    // Outer ring - doesn't move
    let gradient = this.ctx.createLinearGradient(posx - r2, posy + r2, posx + r2, posy - r2);
    gradient.addColorStop(0, 'white');
    gradient.addColorStop(1, 'black');
    
    this.ctx.beginPath();
    this.ctx.fillStyle = gradient;
    this.ctx.arc(posx, posy, r2, 0, 2 * Math.PI, false);
    this.ctx.closePath();
    this.ctx.fill();

    // Outer circle - doesn't move
    this.ctx.beginPath();
    this.ctx.fillStyle = "black";
    this.ctx.arc(posx, posy, r1, 0, 2 * Math.PI, false);
    this.ctx.closePath();
    this.ctx.fill();

    // Outer square - doesn't move
    gradient = this.ctx.createLinearGradient(posx,posy-r4,posx,posy + r4);
    gradient.addColorStop(0, 'black');
    gradient.addColorStop(0.45, 'grey');
    gradient.addColorStop(0.55, 'grey');
    gradient.addColorStop(1, 'black');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(posx-r4,posy-r4,r4*2,r4*2);

    // Inner circle - can move vertically
    this.ctx.beginPath();
    this.ctx.fillStyle = "black";
    this.ctx.arc(posx,y2,r3, 0, 2 * Math.PI, false);
    this.ctx.closePath();
    this.ctx.fill();

    // Inner square - can move vertically
    gradient = this.ctx.createLinearGradient(posx-r5,posy, posx + r5, posy);
    gradient.addColorStop(0, 'black');
    gradient.addColorStop(0.45, 'grey');
    gradient.addColorStop(0.55, 'grey');
    gradient.addColorStop(1, 'black');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(posx-r5,
                      y2-r5,
                      r5*2,
                      r5*2);

    // Center circle - can move both ways
    this.ctx.beginPath();
    this.ctx.fillStyle = "black";
    this.ctx.arc(x2,y2,r6, 0, 2 * Math.PI, false);
    this.ctx.closePath();
    this.ctx.fill();

    // Knob - can move both ways
    this.ctx.beginPath();
    this.ctx.fillStyle = "red";
    this.ctx.arc(x3,y3,r6, 0, 2 * Math.PI, false);
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