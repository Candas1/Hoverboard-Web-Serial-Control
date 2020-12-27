class Speedo {
  constructor(cnv) {
    this.cnv = cnv;
    this.ctx = cnv.getContext('2d');

    this.speedometer = [];
    this.color = { blue:{},orange:{},red:{},green:{},purple:{}};
    
    // Blue
    this.color.blue["gradient"] = this.ctx.createLinearGradient(0, this.cnv.height, 0, 0);
    this.color.blue.gradient.addColorStop(0, '#00b8fe');
    this.color.blue.gradient.addColorStop(1, '#41dcf4');
    this.color.blue.shadowColor = '#41dcf4';

    // Purple
    this.color.purple["gradient"] = this.ctx.createLinearGradient(0, this.cnv.height, 0, 0);
    this.color.purple.gradient.addColorStop(0, '#9900cc');
    this.color.purple.gradient.addColorStop(1, '#cc00cc');
    this.color.purple.shadowColor = '#cc00cc';

    // Green
    this.color.green["gradient"] = this.ctx.createLinearGradient(0, this.cnv.height, 0, 0);
    this.color.green.gradient.addColorStop(0, '#33cc33');
    this.color.green.gradient.addColorStop(1, '#00ff00');
    this.color.green.shadowColor = '#00ff00';

    // Orange
    this.color.orange["gradient"] = this.ctx.createLinearGradient(0, this.cnv.height, 0, 0);
    this.color.orange.gradient.addColorStop(0, '#f7b733');
    this.color.orange.gradient.addColorStop(1, '#fc4a1a');
    this.color.orange.shadowColor = '#fc4a1a';

    // Red
    this.color.red["gradient"] = this.ctx.createLinearGradient(0, this.cnv.height, 0, 0);
    this.color.red.gradient.addColorStop(0, '#fc4a1a');
    this.color.red.gradient.addColorStop(1, '#fa1402');
    this.color.red.shadowColor = '#fa1402';

    // Speed km/h
    this.speedometer.push({x:0,y:0,r:0,value:0,min:0,max:60,step:12,start:155,end:385,icon:"",unit:"km/h",display:"big",color:"blue"});
    // ???
    this.speedometer.push({x:0,y:0,r:0,value:0,min:0,max:10,step:10,start:125,end:55,icon:"",unit:"",display:"none",color:"orange"});
    // Speed rpm
    this.speedometer.push({x:0,y:0,r:0,value:0,min:0,max:1000,step:10,start:155,end:385,icon:"",unit:"rpm",display:"big",color:"blue"});
    // Battery V
    this.speedometer.push({x:0,y:0,r:0,value:0,min:32,max:42,step:10,start:125,end:55,icon:"🔋",unit:"V",display:"small",color:"green"});
    // Current A
    this.speedometer.push({x:0,y:0,r:0,value:0,min:-30,max:30,step:12,start:155,end:385,icon:"",unit:"A",display:"big",color:"purple"});
    // Temp degrees
    this.speedometer.push({x:0,y:0,r:0,value:0,min:25,max:55,step:6,start:125,end:55,icon:"🌡",unit:"°",display:"small",color:"red"});
    this.initCanvas();
  }

  initCanvas(){

    this.cnv.width = this.cnv.parentElement.clientWidth;
    this.cnv.height = this.cnv.parentElement.clientHeight;

    if (window.screen.orientation.type.includes("landscape")){
      this.speedometer[3].x = this.speedometer[2].x = this.cnv.width/2;
      this.speedometer[3].y = this.speedometer[2].y = this.cnv.height/2;
      this.speedometer[3].r = this.speedometer[2].r = this.cnv.height/2.5;
 
      this.speedometer[1].x = this.speedometer[0].x = (this.speedometer[2].x - this.speedometer[2].r) /2;
      this.speedometer[1].y = this.speedometer[0].y = this.cnv.height/2;
      this.speedometer[1].r = this.speedometer[0].r = this.speedometer[2].r/1.5;

      this.speedometer[5].x = this.speedometer[4].x = this.cnv.width - (this.speedometer[2].x - this.speedometer[2].r) /2;
      this.speedometer[5].y = this.speedometer[4].y = this.cnv.height/2;
      this.speedometer[5].r = this.speedometer[4].r = this.speedometer[2].r/1.5;
    }else{
      this.speedometer[3].x = this.speedometer[2].x = this.cnv.width/2;
      this.speedometer[3].y = this.speedometer[2].y = this.cnv.height/2;
      this.speedometer[3].r = this.speedometer[2].r = this.cnv.height/5;
 
      this.speedometer[1].x = this.speedometer[0].x = this.cnv.width/2;
      this.speedometer[1].y = this.speedometer[0].y = (this.speedometer[2].y - this.speedometer[2].r) /2;
      this.speedometer[1].r = this.speedometer[0].r = this.speedometer[2].r/1.5;

      this.speedometer[5].x = this.speedometer[4].x = this.cnv.width/2;
      this.speedometer[5].y = this.speedometer[4].y = this.cnv.height - (this.speedometer[2].y - this.speedometer[2].r) /2;
      this.speedometer[5].r = this.speedometer[4].r = this.speedometer[2].r/1.5;
    }
    
    this.speedometer[2].gradient = this.speedometer[2].gradient = this.speedometer[0].gradient = this.Gradient1;
    this.speedometer[5].gradient = this.speedometer[3].gradient = this.speedometer[1].gradient = this.Gradient2;

    this.display();
  }

  updateTelemetry(message){
    if (message.speedR!= undefined && message.speedL != undefined){
      let speedRPM = Math.abs(message.speedR) + Math.abs(message.speedL);
      speedRPM = Math.round( speedRPM / Math.max(1,(message.speedR!=0) + (message.speedL!=0)) );
      this.speedometer[0].value = Math.round( 2 * Math.PI * 16 * speedRPM * 60 / 100000);
      this.speedometer[2].value = speedRPM;
    }
    if (message.batV!= undefined){
      this.speedometer[3].value = (message.batV / 100).toFixed(1);
    }
    if (message.DCLink!= undefined){
      this.speedometer[4].value = message.DCLink / 10;
    }
    if (message.temp!= undefined){
      this.speedometer[5].value = (message.temp / 10).toFixed(1);
    }
  }

  update(){
    if (view=="speedo") this.display();
  }

  display(){
    this.ctx.fillStyle ="black";
    this.ctx.fillRect(0, 0, this.cnv.width, this.cnv.height);
     
    for (let i=0;i<this.speedometer.length;i++){
      this.drawSpeedo(this.speedometer[i]);
    }
  }

  drawNeedle(speedo,rotation) {
    this.ctx.lineWidth = 2;
    this.ctx.save();
    this.ctx.translate(speedo.x, speedo.y);
    this.ctx.rotate(rotation);
    this.ctx.strokeRect(speedo.r/2.28, -1 / 2, speedo.r/1.8, 1);
    this.ctx.restore();
  }

  drawTick(speedo,rotation, width, speed) {
    this.ctx.lineWidth = width;
    this.ctx.save();
    this.ctx.translate(speedo.x, speedo.y);
    this.ctx.rotate(rotation);
    this.ctx.strokeStyle = "#333";
    this.ctx.fillStyle = "#333";
    this.ctx.strokeRect(speedo.r/1.14, -1 / 2, speedo.r/10, 1);
    this.ctx.restore();

    let x = (speedo.x + speedo.r/1.4 * Math.cos(rotation));
    let y = (speedo.y + speedo.r/1.4 * Math.sin(rotation));

    let fontsize = speedo.r / 10;
    this.ctx.font = fontsize + "px MuseoSans_900-webfont";
    this.ctx.fillText(speed, x, y);
  }

  calculateAngle(x, start, end) {
    let degree = (end - start) * (x) + start;
    let radian = Math.min(degree,end > start ? end : start) * (Math.PI / 180);
    return radian;
  }

  drawSpeedo(speedo) {
    
    this.ctx.strokeStyle = "#333";

    // Outer Ring
    if (speedo.display =="big"){
      this.ctx.beginPath();
      this.ctx.lineWidth = 1;
      this.ctx.arc(speedo.x, speedo.y, speedo.r, 0, 2 * Math.PI);
      this.ctx.stroke();
      
      this.ctx.fillStyle = "black";
      this.ctx.beginPath();
      this.ctx.arc(speedo.x, speedo.y, speedo.r * 0.99, 0, 2 * Math.PI);
      this.ctx.fill();
    }

    this.ctx.strokeStyle = "#333";
    // Inner Ring
    this.ctx.beginPath();
    this.ctx.lineWidth = 10;
    this.ctx.arc(speedo.x, speedo.y, speedo.r/2.5, 0, 2 * Math.PI);
    this.ctx.stroke();

    this.ctx.fillStyle = "#FFF";
    if (speedo.display !="none"){
      
      if (speedo.display =="big"){
        // Value
        let fontsize1 = speedo.r / 4;
        this.ctx.font = fontsize1 + "px MuseoSans_900-webfont";
        this.ctx.textAlign = "center";
        this.ctx.fillText(speedo.value, speedo.x, speedo.y);

        // Unit
        let fontsize2 = speedo.r / 10;
        this.ctx.font = fontsize2 + "px MuseoSans_900-webfont";
        this.ctx.fillText(speedo.unit, speedo.x, speedo.y + fontsize1/2);
      }else{
        // Value + Unit
        let fontsize1 = speedo.r / 10;
        this.ctx.font = fontsize1 + "px MuseoSans_900-webfont";
        this.ctx.textAlign = "center";
        this.ctx.fillText(speedo.icon + speedo.value + speedo.unit, speedo.x, speedo.y + speedo.r/1.8);
      }
    }

    // Ticks and labels 
    for (let i = 0; i <= speedo.step ; i++ ){
      let step = speedo.min + i * Math.round((speedo.max-speedo.min)/speedo.step);
      this.drawTick(speedo,this.calculateAngle(i/speedo.step, speedo.start, speedo.end ), i % 2 == 0 ? 3 : 1, i % 2 == 0 ? step : '');
    }
    
    // Value Arc
    let angleVal = this.calculateAngle( (speedo.value-speedo.min) / (speedo.max-speedo.min), speedo.start , speedo.end);
    let angleStart = this.calculateAngle( -(speedo.min) / (speedo.max-speedo.min), speedo.start , speedo.end);
    this.ctx.beginPath();
    this.ctx.lineWidth = speedo.r/10;
    this.ctx.shadowBlur = 20;
    this.ctx.shadowColor = this.color[speedo.color].shadowColor;
    this.ctx.strokeStyle = this.color[speedo.color].gradient;
    this.ctx.arc(speedo.x, 
                 speedo.y, 
                 speedo.r/1.05,
                 angleStart,
                 angleVal,
                 speedo.end > speedo.start ? false : true);
    this.ctx.stroke();
    
    this.ctx.strokeStyle = speedo.gradient;
    this.drawNeedle(speedo,angleVal);

    this.ctx.strokeStyle = "#000";
    this.ctx.shadowColor = "#000";
  }

  clamp(val, min, max) {
    return val > max ? max : val < min ? min : val;
  }

  map(x, in_min, in_max, out_min, out_max) {
    return this.clamp((x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min, out_min,out_max);
  }
  
}