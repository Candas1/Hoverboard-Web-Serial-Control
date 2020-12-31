class Control {
  constructor(cnv) {
    this.cnv = cnv;
    this.mode = "control";
    this.ctx = cnv.getContext('2d');
    
    this.channel = new Array(14).fill(0);
    this.inputs = [{name:"JOY1",type:"joystick",posx:0,posy:0,x:0,y:0,r:0,normx:0,normy:0,minx:-1000,maxx:1000,miny:-1000,maxy:1000,hold:false,vibrate:false,visible:true},
                   {name:"JOY2",type:"joystick",posx:0,posy:0,x:0,y:0,r:0,normx:0,normy:0,minx:-1000,maxx:1000,miny:-1000,maxy:1000,hold:false,vibrate:false,visible:true},
                   {name:"SWA" ,type:"switch"  ,posx:0,posy:0,x:0,y:0,r:0,normx:0,normy:0,minx:0    ,maxx:0   ,miny:1    ,maxy:2   ,hold:true ,vibrate:true ,visible:true},
                   {name:"SWB" ,type:"switch"  ,posx:0,posy:0,x:0,y:0,r:0,normx:0,normy:0,minx:0    ,maxx:0   ,miny:1    ,maxy:3   ,hold:true ,vibrate:true ,visible:true},
                   {name:"SWC" ,type:"switch"  ,posx:0,posy:0,x:0,y:0,r:0,normx:0,normy:0,minx:0    ,maxx:0   ,miny:1    ,maxy:3   ,hold:true ,vibrate:true ,visible:true},
                   {name:"SWD" ,type:"switch"  ,posx:0,posy:0,x:0,y:0,r:0,normx:0,normy:0,minx:0    ,maxx:0   ,miny:1    ,maxy:2   ,hold:true ,vibrate:true ,visible:true}];
    this.telemetry = {};
    this.mixer = "mix1";
    this.hold  = false;    
    this.initCanvas();

  ['mousedown','mouseup','mousemove','touchstart','touchmove','touchend'].forEach( evt => 
    this.cnv.addEventListener(evt, this.handleEvents.bind(this), false));

  }

  handleEvents(event){
    if (!this.hold){
      this.initPos();
    }

    event.preventDefault();

    let coordinates = [];
    switch (event.type){
      case "mousedown":
        this.clicked = true;
      case "mousemove":
        if (this.clicked){
          let rect = event.target.getBoundingClientRect();
          coordinates.push([event.clientX - rect.left,event.clientY - rect.top]);
        }
        break;
      case "mouseup":
        this.clicked = false;
        break;
      case "touchstart":
      case "touchmove":
      case "touchend":
        for (let i = 0; i< event.touches.length;i++){
          let rect = event.touches[i].target.getBoundingClientRect();
          coordinates.push([event.touches[i].clientX - rect.left,event.touches[i].clientY - rect.top]);
        }
        break;
    }

    for (let i in this.inputs){
      if (!this.inputs[i].visible) continue;
      for (let j= 0; j < coordinates.length;j++){
        let [x,y] = coordinates[j];
        let distance = this.calcDistance(x,y,this.inputs[i].posx,this.inputs[i].posy);
        if ( distance < this.inputs[i].r*2){
          //(event.type == "touchstart" ? 1 : 2)
          if (this.mode =="control"){
            this.inputs[i].x = x;
            this.inputs[i].y = y;
          }else{
            // If in edit mode, move the joystick
            this.inputs[i].posx = Math.round(x/20)*20;
            this.inputs[i].posy = Math.round(y/20)*20;
          }
        }
      }

      if (this.mode == "control"){
        // Calculate normalized value
        this.inputs[i].normx = Math.round(this.map(this.inputs[i].x,this.inputs[i].posx-this.inputs[i].r,this.inputs[i].posx+this.inputs[i].r,this.inputs[i].minx,this.inputs[i].maxx));
        this.inputs[i].normy = Math.round(this.map(this.inputs[i].y,this.inputs[i].posy+this.inputs[i].r,this.inputs[i].posy-this.inputs[i].r,this.inputs[i].miny,this.inputs[i].maxy));
      
        // If value changed, vibrate (switches)
        if (this.inputs[i].vibrate){
          if ((this.inputs[i].prevx != this.inputs[i].normx) ||
            (this.inputs[i].prevy != this.inputs[i].normy)){
              navigator.vibrate([100]);     
          }
        }

        this.inputs[i].prevx = this.inputs[i].normx;
        this.inputs[i].prevy = this.inputs[i].normy;
      }
    }

    if (this.mode == "control") this.Mixer();
    this.display();
  }

  Mixer(){
    switch(this.mixer){
      case "mix1":
        this.channel[0] = this.inputs[0].normx;
        this.channel[1] = this.inputs[1].normy;
        break;
      case "mix2":
        this.channel[0] = this.inputs[0].normx;
        this.channel[1] = this.inputs[0].normy;
        break;
      case "mix3":
        this.channel[0] = this.inputs[1].normx;
        this.channel[1] = this.inputs[1].normy;
        break;  
    }
  }

  initPos(){
    for (let i = 0;i<this.inputs.length;i++){
      if (!this.inputs[i].hold){
        this.inputs[i].x = this.inputs[i].posx;
        this.inputs[i].y = this.inputs[i].posy;
      }
    }
  }

  calcPos(){
    for (let i in this.inputs){
      let r1 = this.inputs[i].r;
      let r2 = r1 * 1.2; // outer circle
      let r6 = r1 * 0.2; // knob

      this.inputs[i].x = (this.inputs[i].minx == this.inputs[i].maxx)?this.inputs[i].posx:this.map(this.inputs[i].normx,this.inputs[i].minx,this.inputs[i].maxx,this.inputs[i].posx-r2+r6,this.inputs[i].posx+r2-r6);
      this.inputs[i].y = (this.inputs[i].miny == this.inputs[i].maxy)?this.inputs[i].posy:this.map(this.inputs[i].normy,this.inputs[i].maxy,this.inputs[i].miny,this.inputs[i].posy-r2+r6,this.inputs[i].posy+r2-r6);
      
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
      this.inputs[0].posx = (this.cnv.width / 6);
      this.inputs[0].posy = this.cnv.height / 2;
      this.inputs[0].visible = true;

      this.inputs[1].posx = (this.cnv.width - this.inputs[0].posx);
      this.inputs[1].posy = this.inputs[0].posy;
      this.inputs[1].visible = true;

      this.inputs[1].r = this.inputs[0].r = (this.cnv.height / 6); //inner ring

      // Switches
      this.inputs[2].posx = (this.cnv.width / 3.4) + (this.cnv.width /3/4);
      this.inputs[3].posx = (this.cnv.width / 3.4) + 2 * (this.cnv.width /3/4);
      this.inputs[4].posx = (this.cnv.width / 3.4) + 3 * (this.cnv.width /3/4);
      this.inputs[5].posx = (this.cnv.width / 3.4) + 4 * (this.cnv.width /3/4);

      this.inputs[5].posy = this.inputs[4].posy = this.inputs[3].posy = this.inputs[2].posy = (this.cnv.height / 4);
      this.inputs[5].visible = this.inputs[4].visible = this.inputs[3].visible = this.inputs[2].visible = true;
      this.inputs[5].r = this.inputs[4].r = this.inputs[3].r = this.inputs[2].r = (this.cnv.height / 30)

    }else{
      // Joysticks
      this.inputs[0].posx = (this.cnv.width / 2);
      this.inputs[0].posy = 2 * (this.cnv.height / 3);
      this.inputs[0].visible = true;

      this.inputs[1].visible = false;
      this.mixer = mixerIn.value = "mix2";
      this.inputs[1].r = this.inputs[0].r = (this.cnv.height / 8); //inner ring
    
      // Switches
      this.inputs[2].posx = (this.cnv.width / 8);
      this.inputs[3].posx = 3 * (this.cnv.width / 8);
      this.inputs[4].posx = 5 * (this.cnv.width / 8);
      this.inputs[5].posx = 7 * (this.cnv.width / 8);

      this.inputs[5].posy = this.inputs[4].posy = this.inputs[3].posy = this.inputs[2].posy = (this.cnv.height / 6);
      this.inputs[5].visible = this.inputs[4].visible = this.inputs[3].visible = this.inputs[2].visible = true;
      this.inputs[5].r = this.inputs[4].r = this.inputs[3].r = this.inputs[2].r = (this.cnv.height / 30)

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

  toggleMode(){
    this.mode = (this.mode =="edit")?"control":"edit";
    this.display();
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

    for(let i in this.inputs){
      if (this.inputs[i].visible) this.displayJoystick(this.inputs[i]);
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
     this.ctx.fillText(this.inputs[2].name , this.screenx2 + fontsize, this.screeny2 + fontsize*3);
     this.ctx.fillText(this.inputs[3].name , this.screenx2 + fontsize, this.screeny2 + fontsize*4);
     this.ctx.fillText(this.inputs[4].name , this.screenx2 + fontsize, this.screeny2 + fontsize*5);
     this.ctx.fillText(this.inputs[5].name , this.screenx2 + fontsize, this.screeny2 + fontsize*6);
     
     
     this.ctx.textAlign = "right";
     this.ctx.fillText(this.channel[0], this.screenx2 + fontsize * 7, this.screeny2 + fontsize);
     this.ctx.fillText(this.channel[1], this.screenx2 + fontsize * 7, this.screeny2 + fontsize*2);
     this.ctx.fillText(this.inputs[2].normy , this.screenx2 + fontsize*7, this.screeny2 + fontsize*3);
     this.ctx.fillText(this.inputs[3].normy , this.screenx2 + fontsize*7, this.screeny2 + fontsize*4);
     this.ctx.fillText(this.inputs[4].normy , this.screenx2 + fontsize*7, this.screeny2 + fontsize*5);
     this.ctx.fillText(this.inputs[5].normy , this.screenx2 + fontsize*7, this.screeny2 + fontsize*6);
     

     this.ctx.textAlign = "right";
     if (this.telemetry["batV"] != undefined){
       this.ctx.fillText(this.telemetry.batV/100 + "V", this.screenx2 + this.screenWidth2 - fontsize, this.screeny2 + fontsize);
     }
     if (this.telemetry["temp"] != undefined){
      this.ctx.fillText(this.telemetry.temp/10 + "C", this.screenx2 + this.screenWidth2 - fontsize, this.screeny2 + fontsize*2);
    }
  }

  displayJoystick(input){
    let r1 = input.r;
    let r2 = r1 * 1.2; // outer circle
    let r3 = r1 * 0.5; // inner circle
    let r4 = r1 * 0.7; // outer square
    let r5 = r1 * 0.35; // inner square
    let r6 = r1 * 0.2; // knob
    let r7 = r6 * 0.5; // knob basis

    // Initial position
    let posx = input.posx;
    let posy = input.posy;
    
    // Current position
    let x = input.x;
    let y = input.y;

    
    if (input.name != ""){
      let textx = (input.posx + input.r*1.4 * Math.cos(Math.PI/2*3));
      let texty = (input.posy + input.r*1.4 * Math.sin(Math.PI/2*3));
      let fontsize = 0;
      if (window.screen.orientation.type.includes("landscape")){
        fontsize = this.cnv.width / 100;
      }else{
        fontsize = this.cnv.height / 100;
      }
      this.ctx.font = fontsize + "px MuseoSans_900-webfont";
      this.ctx.textAlign = "center";
      this.ctx.fillStyle = "#000";
      this.ctx.fillText(input.name, textx, texty);
    }

    if (this.mode == "edit"){
      this.ctx.beginPath();
      this.ctx.fillStyle = "red";
      this.ctx.lineWidth = 2;
      this.ctx.arc(posx, posy, r1*2, 0, 2 * Math.PI, false);
      this.ctx.closePath();
      this.ctx.fill();
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

    // Knob position
    let x3 = (input.minx == input.maxx)?posx:this.map(input.normx,input.minx,input.maxx,posx-r2+r6,posx+r2-r6);
    let y3 = (input.miny == input.maxy)?posy:this.map(input.normy,input.maxy,input.miny,posy-r2+r6,posy+r2-r6);

  
    if (input.type == "joystick"){

      // Knob basis position 
      let x2 = (input.minx == input.maxx)?posx:this.map(x,posx-r2+r6,posx+r2-r6,posx-r3+r6,posx+r3-r6);
      let y2 = (input.miny == input.maxy)?posy:this.map(y,posy-r2+r6,posy+r2-r6,posy-r3+r6/2,posy+r3-r6/2);        
      
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

      // Knob basis - can move both ways
      this.ctx.beginPath();
      this.ctx.fillStyle = "black";
      this.ctx.arc(x2,y2,r7, 0, 2 * Math.PI, false);
      this.ctx.closePath();
      this.ctx.fill();

      // Pole
      this.ctx.beginPath();
      this.ctx.moveTo(x2-r7,y2);
      this.ctx.lineTo(x3-r6,y3);
      this.ctx.lineTo(x3+r6,y3);
      this.ctx.lineTo(x2+r7,y2);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.moveTo(x2,y2-r7);
      this.ctx.lineTo(x3,y3-r6);
      this.ctx.lineTo(x3,y3+r6);
      this.ctx.lineTo(x2,y2+r7);
      this.ctx.closePath();
      this.ctx.fill();


      // Knob end - can move both ways
      this.ctx.beginPath();
      this.ctx.fillStyle = "red";
      this.ctx.arc(x3,y3,r6, 0, 2 * Math.PI, false);
      this.ctx.closePath();
      this.ctx.fill();
    }else{
      if (input.type == "switch"){

        // Knob basis position 
        let x2 = (input.minx == input.maxx)?posx:this.map(x,posx-r2+r6,posx+r2-r6,posx-r6,posx+r6);
        let y2 = (input.miny == input.maxy)?posy:this.map(y,posy-r2+r6,posy+r2-r6,posy-r6/2,posy+-r6/2);        
      

        let gradient1 = this.ctx.createLinearGradient(posx - r2, posy + r2, posx + r2, posy - r2);
        gradient1.addColorStop(0, 'black');
        gradient1.addColorStop(1, 'white');
        
        // Outer circle - doesn't move
        this.ctx.beginPath();
        this.ctx.fillStyle = gradient1;
        this.ctx.arc(posx, posy, r4, 0, 2 * Math.PI, false);
        this.ctx.closePath();
        this.ctx.fill();

        // inner circle - doesn't move
        this.ctx.beginPath();
        this.ctx.fillStyle = "black";
        this.ctx.arc(posx, posy, r5, 0, 2 * Math.PI, false);
        this.ctx.closePath();
        this.ctx.fill();

        // Knob basis- can move both ways
        this.ctx.fillStyle = "darkgrey";
        this.ctx.fillRect(posx-r6,posy-r6/2,r6*2,r6);
        
        // Pole
        this.ctx.beginPath();
        this.ctx.moveTo(x2-r6,y2-r6/2);
        this.ctx.lineTo(x3-r6*4,y3-r6);
        this.ctx.lineTo(x3+r6*4,y3-r6);
        this.ctx.lineTo(x2+r6,y2-r6/2);
        this.ctx.closePath();
        this.ctx.fill(); 
        this.ctx.stroke(); 

        this.ctx.beginPath();
        this.ctx.moveTo(x2-r6,y2+r6/2);
        this.ctx.lineTo(x3-r6*4,y3+r6);
        this.ctx.lineTo(x3+r6*4,y3+r6);
        this.ctx.lineTo(x2+r6,y2+r6/2);
        this.ctx.closePath();
        this.ctx.fill(); 
        this.ctx.stroke();

        // Knob end - can move both ways
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(x3-r6*4,y3-r6,r6*8,r6*2);
        

      }
    }
  }

  clamp(val, min, max) {
    return val > max ? max : val < min ? min : val;
  }
  
  map(x, in_min, in_max, out_min, out_max) {
    return this.clamp((x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min, out_min,out_max);
  }
  
}