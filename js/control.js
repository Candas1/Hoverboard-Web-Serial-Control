class Control {
  constructor(cnv) {
    this.cnv = cnv;
    this.mode = "CTRL";
    this.ctx = cnv.getContext('2d');
    this.channel = new Array(14).fill(0);
    this.font = "Consolas";
    this.gamepad = null;

    this.protocol = "off";
    this.inputs = {};
    this.inputs["JOY1"]  = {name:"JOY1"     ,type:"joystick",posx:0,posy:0,x:0,y:0,r:0,normx:0,normy:0,minx:-1000,maxx:1000,stepx:1000,miny:-1000,maxy:1000,stepy:1000,hold:false,vibrate:false,visible:true,dispName:true,dispVal:false};
    this.inputs["JOY2"]  = {name:"JOY2"     ,type:"joystick",posx:0,posy:0,x:0,y:0,r:0,normx:0,normy:0,minx:-1000,maxx:1000,stepx:1000,miny:-1000,maxy:1000,stepy:1000,hold:false,vibrate:false,visible:true,dispName:true,dispVal:false};
    this.inputs["SWA"]   = {name:"SWA"      ,type:"switch"  ,posx:0,posy:0,x:0,y:0,r:0,normx:0,normy:1,minx:0    ,maxx:0   ,stepx:0   ,miny:1    ,maxy:2   ,stepy:1   ,hold:true ,vibrate:true ,visible:true,dispName:true,dispVal:true};
    this.inputs["SWB"]   = {name:"SWB"      ,type:"switch"  ,posx:0,posy:0,x:0,y:0,r:0,normx:0,normy:1,minx:0    ,maxx:0   ,stepx:0   ,miny:1    ,maxy:3   ,stepy:1   ,hold:true ,vibrate:true ,visible:true,dispName:true,dispVal:true};
    this.inputs["VRA"]   = {name:"VRA"      ,type:"knob"    ,posx:0,posy:0,x:0,y:0,r:0,normx:0,normy:0,minx:0    ,maxx:0   ,stepx:0   ,miny:0    ,maxy:1000,stepy:1000,hold:true ,vibrate:false ,visible:true,dispName:true,dispVal:false};
    this.inputs["VRB"]   = {name:"VRB"      ,type:"knob"    ,posx:0,posy:0,x:0,y:0,r:0,normx:0,normy:0,minx:0    ,maxx:0   ,stepx:0   ,miny:0    ,maxy:1000,stepy:1000,hold:true ,vibrate:false ,visible:true,dispName:true,dispVal:false};
    this.inputs["SWC"]   = {name:"SWC"      ,type:"switch"  ,posx:0,posy:0,x:0,y:0,r:0,normx:0,normy:1,minx:0    ,maxx:0   ,stepx:0   ,miny:1    ,maxy:3   ,stepy:1   ,hold:true ,vibrate:true ,visible:true,dispName:true,dispVal:true};
    this.inputs["SWD"]   = {name:"SWD"      ,type:"switch"  ,posx:0,posy:0,x:0,y:0,r:0,normx:0,normy:1,minx:0    ,maxx:0   ,stepx:0   ,miny:1    ,maxy:2   ,stepy:1   ,hold:true ,vibrate:true ,visible:true,dispName:true,dispVal:true};
    
    for (let key in this.inputs){
      this.inputs[key].prevx = this.inputs[key].normx;
      this.inputs[key].prevy = this.inputs[key].normy;
    }

    this.mix = "mix1";
    this.hold  = false;    
    this.initCanvas();

    ['mousedown','mouseup','mousemove','touchstart','touchmove','touchend'].forEach( evt => 
       this.cnv.addEventListener(evt, this.handleEvents.bind(this), false)
    );

    // Update screen if new data   
    telemetry.addEventListener("update", this.updateScreen.bind(this), false);
    window.addEventListener("gamepadconnected", this.gamepadHandler.bind(this), false);
    window.addEventListener("gamepaddisconnected", this.gamepadHandler.bind(this), false);
    window.addEventListener("visibilitychange", this.visibilityChanged.bind(this), false);
    
  }

  visibilityChanged(event){
    // Handle cases when the window is not visible anymore, reset joysticks
    if (document.visibilityState != 'visible'){
      this.initPos();
      this.initJoysticks();
      this.clicked = false;
    }
  }

  handleEvents(event){

    if (!this.hold){
      this.initPos();
    }

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
    
    // Process events
    for (let j= 0; j < coordinates.length;j++){
      let [x,y] = coordinates[j];
      let found = false;
      for (let key in this.inputs){
        if (found || !this.inputs[key].visible) continue;
        let distance = this.calcDistance(x,y,this.inputs[key].posx,this.inputs[key].posy);
        if ( distance < this.inputs[key].r*2){
          event.preventDefault();
          // Event was close enough
          found = true;
          if (this.mode == "CTRL"){
            // Record click coordinate
            this.inputs[key].x = x;
            this.inputs[key].y = y;
          }else{
            
            if (distance > this.inputs[key].r / 2){
              this.inputs[key].r *= distance/this.inputs[key].r;
            }else{
              // Move the input
              this.inputs[key].posx = Math.round(x/20)*20;
              this.inputs[key].posy = Math.round(y/20)*20;
            } 
          }
        }
      }
    }

    if (this.mode == "CTRL"){
      for (let key in this.inputs){
        // Calculate normalized value
        this.inputs[key].normx = Math.round(this.map(this.inputs[key].x,this.inputs[key].posx-this.inputs[key].r,this.inputs[key].posx+this.inputs[key].r,this.inputs[key].minx,this.inputs[key].maxx));
        this.inputs[key].normy = Math.round(this.map(this.inputs[key].y,this.inputs[key].posy+this.inputs[key].r,this.inputs[key].posy-this.inputs[key].r,this.inputs[key].miny,this.inputs[key].maxy));

        // If value changed, vibrate (switches)
        if (this.inputs[key].vibrate){
          if ((this.inputs[key].prevx != this.inputs[key].normx) ||
              (this.inputs[key].prevy != this.inputs[key].normy)){
              navigator.vibrate([100]);     
          }
        }

        this.inputs[key].prevx = this.inputs[key].normx;
        this.inputs[key].prevy = this.inputs[key].normy;
      }
    }

    this.mixer();
    this.display();
  }

  gamepadHandler(event) {
    if (event.type == "gamepadconnected") {
      this.gamepad = navigator.getGamepads()[event.gamepad.index];
      console.log("Gamepad connected at index %d : %s. %d buttons, %d axes.",
      this.gamepad.index, this.gamepad.id, this.gamepad.buttons.length, this.gamepad.axes.length);
      this.gamepadInterval = setInterval(this.readGamepad.bind(this),50); 
    } else {
      this.gamepad = null;
      console.log("Gamepad disconnected");
      clearInterval(this.gamepadInterval);
      this.initJoysticks();  
    }
  }

  readGamepad(){
    // Poll Gamepad value and update Joysticks
    var gamepad = navigator.getGamepads()[0];
    this.inputs["JOY1"].normx = Math.round(gamepad.axes[0].toFixed(4) * 1000);
    this.inputs["JOY1"].normy = Math.round(gamepad.axes[1].toFixed(4) * -1000);
    this.inputs["JOY2"].normx = Math.round(gamepad.axes[2].toFixed(4) * 1000);
    this.inputs["JOY2"].normy = Math.round(gamepad.axes[3].toFixed(4) * -1000);
    this.mixer();
    this.display();
  }

  mixer(){

    // Initialize values
    for(let i=0;i<this.channel.length;i++){
      this.channel[i] = (this.protocol == "ibus")?1000:0;    
    }

    if (this.mix == "mix4"){ 
      // Tank Steering
      this.channel[0] = this.getExtValue(this.getSteer(),"y");
      this.channel[1] = this.getExtValue(this.getSpeed(),"y");
    }else{
      // Differential Steering
      this.channel[0] = this.getExtValue(this.getSteer(),"x");
      this.channel[1] = this.getExtValue(this.getSpeed(),"y");
    }
    
    this.channel[4] = this.getExtValue(this.inputs.VRA,"y");
    this.channel[5] = this.getExtValue(this.inputs.VRB,"y");
    this.channel[6] = this.getExtValue(this.inputs.SWA,"y");
    this.channel[7] = this.getExtValue(this.inputs.SWB,"y");
    this.channel[8] = this.getExtValue(this.inputs.SWC,"y");
    this.channel[9] = this.getExtValue(this.inputs.SWD,"y");
    
    this.switches = ((this.channel[6] - 1) |
                    (this.channel[7] - 1) << 1 |
                    (this.channel[8] - 1) << 3 |
                    (this.channel[9] - 1) << 5) << 8;
    
  }

  getSteer(){
    // Returns input object for steer depending on mixer setting
    return this.mix == "mix3"?this.inputs.JOY2:this.inputs.JOY1;
  }
  getSpeed(){
    // Returns input object for speed depending on mixer setting
    return this.mix == "mix2"?this.inputs.JOY1:this.inputs.JOY2;
  }

  getValue(input,axis){
    // return input value for specific axis
    let value, min, max = 0;
    if (axis == "x"){
      [value,min,max] = [input.normx,input.minx,input.maxx];
    }else{
      [value,min,max] = [input.normy,input.miny,input.maxy];  
    }
    
    return value;
  }

  getExtValue(input,axis){
    // return input value for specific axis, and translates to ibus value domain
    let value, min, max = 0;
    if (axis == "x"){
      [value,min,max] = [input.normx,input.minx,input.maxx];
    }else{
      [value,min,max] = [input.normy,input.miny,input.maxy];  
    }
    
    return (this.protocol == "ibus")?this.map(value,min,max,1000,2000):value;
  }

  getValText(input,axis){
    return this.valToText(input,this.getValue(input,axis));
  }

  valToText(input,val){ 
    // Translate value to corresponding text if available
    if (input.values === undefined || input.values[val] === undefined){
      return val;
    }else{
      return input.values[val];
    }
  }

  initPos(){
    for (let key in this.inputs){
      if (!this.inputs[key].hold){
        this.inputs[key].x = this.inputs[key].posx;
        this.inputs[key].y = this.inputs[key].posy;
      }
    }
  }

  initJoysticks(){
    this.inputs["JOY1"].normx = 0;
    this.inputs["JOY1"].normy = 0;
    this.inputs["JOY2"].normx = 0;
    this.inputs["JOY2"].normy = 0;
    this.display();
  }

  setPos(){
    // Set input position depending on the value
    for (let key in this.inputs){
      let r1 = this.inputs[key].r;
      let r2 = r1 * 1.2; // outer circle
      let r6 = r1 * 0.2; // knob

      this.inputs[key].x = (this.inputs[key].minx == this.inputs[key].maxx)?this.inputs[key].posx:this.map(this.inputs[key].normx,this.inputs[key].minx,this.inputs[key].maxx,this.inputs[key].posx-r2+r6,this.inputs[key].posx+r2-r6);
      this.inputs[key].y = (this.inputs[key].miny == this.inputs[key].maxy)?this.inputs[key].posy:this.map(this.inputs[key].normy,this.inputs[key].maxy,this.inputs[key].miny,this.inputs[key].posy-r2+r6,this.inputs[key].posy+r2-r6); 
    }
  }

  calcDistance(x1,y1,x2,y2){
    return Math.sqrt(Math.pow(x1 - x2, 2) + 
                     Math.pow(y1 - y2, 2));
  }

  resizeCanvas(){
    let oldWidth = this.cnv.width;
    let oldHeight = this.cnv.height;

    this.cnv.width = this.cnv.parentElement.clientWidth;
    this.cnv.height = this.cnv.parentElement.clientHeight;

    // Recalculate inputs coordinates and size
    for( let key in this.inputs){
      this.inputs[key].posx = this.map(this.inputs[key].posx,0,oldWidth,0,this.cnv.width);
      this.inputs[key].posy = this.map(this.inputs[key].posy,0,oldHeight,0,this.cnv.height);
      this.inputs[key].r    = this.map(this.inputs[key].r   ,0,oldWidth,0,this.cnv.width);
    }

    // Recalculate screen coordinates and size
    this.screeny1 = this.map(this.screeny1,0,oldHeight,0,this.cnv.height);
    this.screenHeight1 = this.map(this.screenHeight1,0,oldHeight,0,this.cnv.height);
    this.screenx1 = this.map(this.screenx1,0,oldWidth,0,this.cnv.width);
    this.screenWidth1 = this.map(this.screenWidth1,0,oldWidth,0,this.cnv.width);
    
    this.setPos();
    this.display();
  }

  initCanvas(){
    this.cnv.width= this.cnv.parentElement.clientWidth;
    this.cnv.height= this.cnv.parentElement.clientHeight; 
    this.oldOrientation = window.screen.orientation.type;

    let switchr = Math.max(this.cnv.height,this.cnv.width)/ 50;
    let step = this.cnv.width / 7;
    
    this.landscape = {
      inputs:{
        JOY1:{posx:this.cnv.width / 6,
              posy:6 * this.cnv.height / 8,
              r:this.cnv.height / 6,
              visible:true},
        JOY2:{posx:this.cnv.width-this.cnv.width / 6,
              posy:6 * this.cnv.height / 8,
              r:this.cnv.height / 6,
              visible:true},
        SWA:{posx:1 * step},
        SWB:{posx:2 * step},
        VRA:{posx:3 * step},
        VRB:{posx:4 * step},
        SWC:{posx:5 * step},
        SWD:{posx:6 * step},
        
      },
      screenx1:(this.cnv.width - this.cnv.width / 3) /2,
      screeny1:this.cnv.height / 1.75,
      screenWidth1:this.cnv.width / 3,
      screenHeight1:this.cnv.height / 3,
    };

    ["SWA","SWB","SWC","SWD","VRA","VRB"].forEach( key => this.setValues(this.landscape.inputs[key],{posy:this.cnv.height/3.5,visible:true,r:switchr}));
    
    this.portrait = {
      mix:mixerIn.value = "mix2",
      inputs:{
        JOY1:{posx:this.cnv.width / 2,
              posy:3 * this.cnv.height / 4,
              r:this.cnv.height / 10,
              visible:true},
        JOY2:{posx:this.cnv.width / 2,
              posy:3 * this.cnv.height / 4,
              r:this.cnv.height / 10,
              visible:false},
        SWA:{posx:1 * step},
        SWB:{posx:2 * step},
        VRA:{posx:3 * step},
        VRB:{posx:4 * step},
        SWC:{posx:5 * step},
        SWD:{posx:6 * step},
      },
      screenx1:(this.cnv.width - this.cnv.width / 1.2) /2,
      screeny1:this.cnv.height / 3,
      screenWidth1:this.cnv.width / 1.2,
      screenHeight1:this.cnv.height / 5,
    };

    ["SWA","SWB","SWC","SWD","VRA","VRB"].forEach( key => this.setValues(this.portrait.inputs[key],{posy:this.cnv.height/6,visible:true,r:switchr}));

    if (window.screen.orientation.type.includes("landscape")){
      this.setValues(this,this.landscape);  
    }else{
      this.setValues(this,this.portrait);
    }
    
    this.setPos();
    this.display();
  }

  setValues(input,dict){
    for(let key in dict){
      if (typeof dict[key] === "object"){
        if (!(key in input )) input[key] = {};
        this.setValues(input[key],dict[key]);
      }else{
        input[key] = dict[key];
      }
    }
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

    // Assign input texts depending on selected protocol
    this.inputs.SWD.visible = this.inputs.SWC.visible = this.inputs.SWB.visible = this.inputs.SWA.visible = (this.protocol == "hovercar" || this.protocol == "ibus");
    this.inputs.VRA.visible = this.inputs.VRB.visible = (this.protocol == "ibus");
    this.inputs.SWA.name   = this.protocol == "hovercar"?"Switch":"SWA"; 
    this.inputs.SWA.values = this.protocol == "hovercar"?{1:"OFF",2:"ON"}:{};
    this.inputs.SWB.name   = this.protocol == "hovercar"?"Type":"SWB"; 
    this.inputs.SWB.values = this.protocol == "hovercar"?{1:"FOC",2:"SIN",3:"COM"}:{};
    this.inputs.SWC.name   = this.protocol == "hovercar"?"Mode":"SWC"; 
    this.inputs.SWC.values = this.protocol == "hovercar"?{1:"VLT",2:"SPD",3:"TRQ"}:{};
    this.inputs.SWD.name   = this.protocol == "hovercar"?"FW":"SWD";
    this.inputs.SWD.values = this.protocol == "hovercar"?{1:"OFF",2:"ON"}:{};

    // Display inputs
    for(let key in this.inputs){
      if (this.inputs[key].visible) this.displayJoystick(this.inputs[key]);
    }

    // Display Screen
    this.updateScreen();

    if (this.gamepad != null){
      this.ctx.fillText("🎮" , 50 , 100);
    }
  }

  updateScreen(){

    this.screenWidth2 = this.screenWidth1 * 0.9;
    this.screenHeight2 = this.screenHeight1 * 0.85;
    this.screenx2 = this.screenx1 + (this.screenWidth1 - this.screenWidth2) /2;
    this.screeny2 = this.screeny1 + (this.screenHeight1 - this.screenHeight2) /2;    
   
    
     // Screen outer rectangle
     this.ctx.fillStyle = "black";
     this.ctx.fillRect(this.screenx1,this.screeny1,this.screenWidth1,this.screenHeight1);
 
     // Screen inner rectangle
     this.ctx.fillStyle = "turquoise";
     this.ctx.fillRect(this.screenx2,this.screeny2,this.screenWidth2,this.screenHeight2);
 
     // text
     let fontsize = Math.round(this.screenWidth2 / 20);
     this.ctx.font =  fontsize+"px "+this.font;
     this.ctx.fillStyle = "blue";
     this.ctx.textAlign = "left";
     if (this.mix == "mix4"){
       // Tank Steering
       this.ctx.fillText("SpeedL", this.screenx2 + fontsize, this.screeny2 + fontsize);
       this.ctx.fillText("SpeedR", this.screenx2 + fontsize, this.screeny2 + fontsize*2);
     }else{
      // Differential steering
      this.ctx.fillText("Steer", this.screenx2 + fontsize, this.screeny2 + fontsize);
      this.ctx.fillText("Speed", this.screenx2 + fontsize, this.screeny2 + fontsize*2);
     }

     let line = 3;
     for (let key in this.inputs){
      if (this.inputs[key].type == "joystick" || !this.inputs[key].visible) continue;
      this.ctx.textAlign = "left";
      this.ctx.fillText(this.inputs[key].name , this.screenx2 + fontsize, this.screeny2 + fontsize*line); 
      this.ctx.textAlign = "right";
      this.ctx.fillText(this.getValText(this.inputs[key],"y") , this.screenx2 + fontsize*7, this.screeny2 + fontsize*line);
      line++;
    }

     // Values
     this.ctx.textAlign = "right";
     this.ctx.fillText(this.mix == "mix4"?this.getSteer().normy:this.getSteer().normx, this.screenx2 + fontsize * 7, this.screeny2 + fontsize);
     this.ctx.fillText(this.getSpeed().normy, this.screenx2 + fontsize * 7, this.screeny2 + fontsize*2);
     this.ctx.fillText(telemetry.batV + "V", this.screenx2 + this.screenWidth2 - fontsize, this.screeny2 + fontsize);
     this.ctx.fillText(telemetry.temp + "°", this.screenx2 + this.screenWidth2 - fontsize, this.screeny2 + fontsize*2);
  }

  displayJoystick(input){
    let r1 = input.r;
    let r2 = r1 * 1.2; // outer circle
    let r3 = r1 * 0.5; // inner circle
    let r4 = r1 * 0.7; // outer square
    let r5 = r1 * 0.35; // inner square
    let r6 = r1 * 0.2; // knob
    let r7 = r6 * 0.5; // knob basis
    let r8 = r1 * 1.7; // text

    // Initial position
    let posx = input.posx;
    let posy = input.posy;
    
    // Current position
    let x = input.x;
    let y = input.y;
    
    let fontsize = 0;
    if (window.screen.orientation.type.includes("landscape")){
      fontsize = this.cnv.width / 100;
    }else{
      fontsize = this.cnv.height / 100;
    }

    if (input.dispName){
      this.ctx.font = fontsize+"px "+this.font;
      this.ctx.textAlign = "center";
      this.ctx.fillStyle = "#000";
      this.ctx.fillText(input.name, input.posx, input.posy - r8);
    }

    if (this.mode == "EDIT"){
      this.ctx.beginPath();
      this.ctx.fillStyle = "red";
      this.ctx.lineWidth = 2;
      this.ctx.arc(posx, posy, r1*2, 0, 2 * Math.PI, false);
      this.ctx.closePath();
      this.ctx.fill();
    }

    let gradient = this.ctx.createLinearGradient(posx - r2, posy + r2, posx + r2, posy - r2);
    gradient.addColorStop(0, 'white');
    gradient.addColorStop(1, 'black');

    let gradient1 = this.ctx.createLinearGradient(posx - r2, posy + r2, posx + r2, posy - r2);
    gradient1.addColorStop(0, 'black');
    gradient1.addColorStop(1, 'white');

    if (input.dispVal){
      if (input.minx != input.maxx){
        for(let i = input.minx;i <= input.maxx; i+=input.stepx){
          let textx = (input.minx == input.maxx)?posx:this.map(i,input.maxx,input.minx,posx-r2+r6,posx+r2-r6);
          let texty = posy + r8;
          this.ctx.font = fontsize + "px MuseoSans_900-webfont";
          this.ctx.textAlign = "left";
          this.ctx.fillStyle = "#000";
          this.ctx.fillText(this.valToText(input,i), textx, texty);
        }
      }

      if (input.miny != input.maxy){
        for(let i = input.miny;i <= input.maxy; i+=input.stepy){
          let textx = posx + r8;
          let texty = (input.miny == input.maxy)?posy:this.map(i,input.maxy,input.miny,posy-r2+r6,posy+r2-r6);
          this.ctx.font = fontsize + "px MuseoSans_900-webfont";
          this.ctx.textAlign = "left";
          this.ctx.fillStyle = "#000";
          this.ctx.fillText(this.valToText(input,i), textx, texty);
        }
      }
    }

    // Knob position
    let x3 = (input.minx == input.maxx)?posx:this.map(input.normx,input.minx,input.maxx,posx-r2+r6,posx+r2-r6);
    let y3 = (input.miny == input.maxy)?posy:this.map(input.normy,input.maxy,input.miny,posy-r2+r6,posy+r2-r6);

    // Outer ring - doesn't move
    this.ctx.beginPath();
    this.ctx.strokeStyle = gradient;
    this.ctx.fillStyle = gradient;
    this.ctx.arc(posx, posy, r2, 0, 2 * Math.PI, false);
    this.ctx.closePath();
    this.ctx.fill();

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
                        y2-r5/2,
                        r5*2,
                        r5);
    
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

      }else{
        if (input.type == "knob"){

          // Knob basis position 
          let x2 = (input.minx == input.maxx)?posx:this.map(x,posx-r2+r6,posx+r2-r6,posx-r6,posx+r6);
          let y2 = (input.miny == input.maxy)?posy:this.map(y,posy-r2+r6,posy+r2-r6,posy-r6/2,posy+-r6/2);        
  
          // Outer circle - doesn't move
          this.ctx.beginPath();
          this.ctx.fillStyle = gradient1;
          this.ctx.arc(posx, posy, r4*1.3, 0, 2 * Math.PI, false);
          this.ctx.closePath();
          this.ctx.fill();
  
          // Knob end - can move both ways
          let angle = this.map(input.normy,input.miny,input.maxy,-Math.PI,Math.PI);
          let cursor1x = posx+Math.cos(angle)*(r4+r6);
          let cursor1y = posy+Math.sin(angle)*(r4+r6);
          let cursor2x = posx+Math.cos(angle)*(r4-r6);
          let cursor2y = posy+Math.sin(angle)*(r4-r6);
          
          this.ctx.beginPath();
          this.ctx.fillStyle = "black";
          this.ctx.strokeStyle = "black";
          this.ctx.moveTo(cursor1x,cursor1y);
          this.ctx.lineTo(cursor2x,cursor2y);
          //this.ctx.arc(knobx,knoby,r6, 0, 2 * Math.PI, false);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.stroke();
      
        }
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
