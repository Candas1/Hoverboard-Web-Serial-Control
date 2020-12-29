class Speedo {
  constructor(cnv) {
    this.cnv = cnv;
    this.ctx = cnv.getContext('2d');
    this.direction = 1;
    this.speedometer = [];
    this.color = { blue:{},orange:{},red:{},green:{},purple:{}};
    
    // Blue
    this.color.blue.color1 = '#00b8fe';
    this.color.blue.color2 = '#41dcf4';

    // Purple
    this.color.purple.color1 = '#9900cc';
    this.color.purple.color2 = '#cc00cc';
    
    // Green
    this.color.green.color1 = '#33cc33';
    this.color.green.color2 = '#00ff00';
    
    // Orange
    this.color.orange.color1 = '#f7b733';
    this.color.orange.color2 = '#fc4a1a';

    // Red
    this.color.red.color1 = '#fc4a1a';
    this.color.red.color2 = '#fa1402';

    this.speedometer = {};
    this.speedometer["speedKMH"] = {name:"speedKMH",x:0,y:0,r:0,value:0,min:0  ,max:60  ,step:12,start:155,end:385,decimal:0,icon:""  ,unit:"km/h",display:"big"  ,color:"blue"};
    this.speedometer["empty"]    = {name:"empty"   ,x:0,y:0,r:0,value:0,min:0  ,max:10  ,step:10,start:125,end:55 ,decimal:0,icon:""  ,unit:""    ,display:"none" ,color:"orange"};
    this.speedometer["speedRPM"] = {name:"speedRPM",x:0,y:0,r:0,value:0,min:0  ,max:1000,step:10,start:155,end:385,decimal:0,icon:""  ,unit:"rpm" ,display:"big"  ,color:[{name:"blue",from:0,to:800},{name:"purple",from:800,to:1000}]};
    this.speedometer["batV"]     = {name:"batV"    ,x:0,y:0,r:0,value:0,min:32 ,max:42  ,step:10,start:125,end:55 ,decimal:1,icon:"🔋",unit:"V"   ,display:"small",color:[{name:"red",from:0,to:36},{name:"orange",from:36,to:38},{name:"green",from:38,to:42}]};
    this.speedometer["DCLink"]   = {name:"DCLink"  ,x:0,y:0,r:0,value:0,min:-30,max:30  ,step:12,start:155,end:385,decimal:1,icon:""  ,unit:"A"   ,display:"big"  ,color:[{name:"red",from:-30,to:-20},{name:"green",from:-20,to:0},{name:"green",from:0,to:20},{name:"red",from:20,to:30}]};
    this.speedometer["temp"]     = {name:"temp"    ,x:0,y:0,r:0,value:0,min:25 ,max:55  ,step:6 ,start:125,end:55 ,decimal:1,icon:"🌡",unit:"°"   ,display:"small",color:[{name:"green",from:0,to:35.8},{name:"orange",from:35.8,to:48.9},{name:"red",from:48.9,to:55}]};
    this.initCanvas();
  }

  initCanvas(){

    this.cnv.width = this.cnv.parentElement.clientWidth;
    this.cnv.height = this.cnv.parentElement.clientHeight;

    if (window.screen.orientation.type.includes("landscape")){
      this.speedometer.batV.x = this.speedometer.speedRPM.x = this.cnv.width/2;
      this.speedometer.batV.y = this.speedometer.speedRPM.y = this.cnv.height/2;
      this.speedometer.batV.r = this.speedometer.speedRPM.r = this.cnv.height/2.5;
 
      this.speedometer.empty.x = this.speedometer.speedKMH.x = (this.speedometer.speedRPM.x - this.speedometer.speedRPM.r) /2;
      this.speedometer.empty.y = this.speedometer.speedKMH.y = this.cnv.height/2;
      this.speedometer.empty.r = this.speedometer.speedKMH.r = this.speedometer.speedRPM.r/1.5;

      this.speedometer.temp.x = this.speedometer.DCLink.x = this.cnv.width - (this.speedometer.speedRPM.x - this.speedometer.speedRPM.r) /2;
      this.speedometer.temp.y = this.speedometer.DCLink.y = this.cnv.height/2;
      this.speedometer.temp.r = this.speedometer.DCLink.r = this.speedometer.speedRPM.r/1.5;
    }else{
      this.speedometer.batV.x = this.speedometer.speedRPM.x = this.cnv.width/2;
      this.speedometer.batV.y = this.speedometer.speedRPM.y = this.cnv.height/2;
      this.speedometer.batV.r = this.speedometer.speedRPM.r = this.cnv.height/5;
 
      this.speedometer.empty.x = this.speedometer.speedKMH.x = this.cnv.width/2;
      this.speedometer.empty.y = this.speedometer.speedKMH.y = (this.speedometer.speedRPM.y - this.speedometer.speedRPM.r) /2;
      this.speedometer.empty.r = this.speedometer.speedKMH.r = this.speedometer.speedRPM.r/1.5;

      this.speedometer.temp.x = this.speedometer.DCLink.x = this.cnv.width/2;
      this.speedometer.temp.y = this.speedometer.DCLink.y = this.cnv.height - (this.speedometer.speedRPM.y - this.speedometer.speedRPM.r) /2;
      this.speedometer.temp.r = this.speedometer.DCLink.r = this.speedometer.speedRPM.r/1.5;
    }
    
    this.display();
  }

  updateTelemetry(message){
    if (message.speedR!= undefined && message.speedL != undefined){
      let speedRPM = Math.abs(message.speedR) + Math.abs(message.speedL);
      speedRPM = Math.round( speedRPM / Math.max(1,(message.speedR!=0) + (message.speedL!=0)) );
      this.setValue("speedKMH",Math.round( 2 * Math.PI * 16 * speedRPM * 60 / 100000));
      this.setValue("speedRPM",speedRPM);
    }
    if (message.batV!= undefined){
      this.setValue("batV",message.batV / 100);
    }
    if (message.DCLink!= undefined){
      this.setValue("DCLink", message.DCLink / 10);
    }
    if (message.temp!= undefined){
      this.setValue("temp",message.temp / 10);
    }
  }

  setValue(key,value){
    
    if (key in this.speedometer){
      this.speedometer[key].value = value;
      this.speedometer[key].max = Math.max(this.speedometer[key].max,value);
      this.speedometer[key].min = Math.min(this.speedometer[key].min,value);
      if (Array.isArray(this.speedometer[key].color)){
        this.speedometer[key].color[0].from = this.speedometer[key].min;
        this.speedometer[key].color[this.speedometer[key].color.length-1].to = this.speedometer[key].max;
      }
    }
  }

  update(){
    if (view=="speedo"){ 
      if (this.demo){
        let switchDir = false;
        let step = 100;
        for(let key in this.speedometer){
          this.setValue(key,this.speedometer[key].value + (this.speedometer[key].max-this.speedometer[key].min)/step * this.direction);
          if ((this.speedometer[key].value <= this.speedometer[key].min) ||
              (this.speedometer[key].value >= this.speedometer[key].max)){
            switchDir = true;
          }
        }
        if (switchDir) this.direction *= -1;
      }
      this.display();
    }
  }

  runDemo(){
    this.demo = !this.demo;
    for(let key in this.speedometer){
      this.setValue(key,!this.demo?0:this.speedometer[key].min);
    }
  }

  display(){
    this.ctx.fillStyle ="black";
    this.ctx.fillRect(0, 0, this.cnv.width, this.cnv.height);
     
    for (let key in this.speedometer){
      this.drawSpeedo(this.speedometer[key]);
    }
  }

  drawNeedle(speedo,color) {
    let rotation = this.calcAngle(speedo,Math.min(speedo.value,speedo.max));
    this.ctx.strokeStyle = this.color[color].color1;
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

    if (speed != ""){
      let fontsize = speedo.r / 10;
      this.ctx.font = fontsize + "px MuseoSans_900-webfont";
      this.ctx.fillText(Math.round(speed), x, y);
    }
  }

  calcAngle(speedo, val) {
    let x = (val-speedo.min) / (speedo.max-speedo.min);
    let degree = (speedo.end - speedo.start) * (x) + speedo.start;
    let radian = Math.min(degree,speedo.end > speedo.start ? speedo.end : speedo.start) * (Math.PI / 180);
    return radian;
  }

  getGradient(color){
    let gradient = this.ctx.createLinearGradient(0, this.cnv.height, 0, 0);
    gradient.addColorStop(0,this.color[color].color1);
    gradient.addColorStop(1,this.color[color].color2);
    return gradient;
  }

  drawArc(speedo,start,end,color){
    this.ctx.beginPath();
    this.ctx.lineWidth = speedo.r/10;
    this.ctx.shadowBlur = 20;
    this.ctx.shadowColor = this.color[color].color2;
    this.ctx.strokeStyle = this.getGradient(color);
    let startA = this.calcAngle(speedo,start);
    let endA   = this.calcAngle(speedo,end);  
    this.ctx.arc(speedo.x, 
                 speedo.y, 
                 speedo.r/1.05,
                 startA<endA?startA:endA,
                 startA<endA?endA:startA,
                 false);
    this.ctx.stroke();
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
        this.ctx.fillText(parseFloat(speedo.value).toFixed(speedo.decimal), speedo.x, speedo.y);

        // Unit
        let fontsize2 = speedo.r / 10;
        this.ctx.font = fontsize2 + "px MuseoSans_900-webfont";
        this.ctx.fillText(speedo.unit, speedo.x, speedo.y + fontsize1/2);
      }else{
        // Value + Unit
        let fontsize1 = speedo.r / 10;
        this.ctx.font = fontsize1 + "px MuseoSans_900-webfont";
        this.ctx.textAlign = "center";
        this.ctx.fillText(speedo.icon + parseFloat(speedo.value).toFixed(speedo.decimal) + speedo.unit, speedo.x, speedo.y + speedo.r/1.8);
      }
    }
   
    // Ticks and labels 
    for (let i = 0; i <= speedo.step ; i++ ){
      let step = speedo.min + i * Math.round((speedo.max-speedo.min)/speedo.step);
      let sliceEnd = this.calcAngle(speedo,step);
      this.drawTick(speedo,sliceEnd, i % 2 == 0 ? 3 : 1, i % 2 == 0 ? step : '');
    }
    
    // Value Arc
    if (Array.isArray(speedo.color)){
      for(let i=0; i<speedo.color.length;i++){
        let from  = speedo.color[i].from;
        let to    = speedo.color[i].to;
        let color = speedo.color[i].name;
        if ((speedo.value >= 0 && to>0 && speedo.value > to)||
            (speedo.value < 0 && from<0 && speedo.value < from)){
          this.drawArc(speedo,from,to,color);
        }else{
          if (this.inRange(speedo.value,from,to)){
            if (speedo.value >= 0 && to>0){
              this.drawArc(speedo,from,speedo.value,color);
            }else{
              this.drawArc(speedo,to,speedo.value,color);
            }         
            this.drawNeedle(speedo,color);
          }
        }
      }
    }else{
      this.drawArc(speedo,0,speedo.value,speedo.color);
      this.drawNeedle(speedo,speedo.color);
    }

    this.ctx.strokeStyle = "#000";
    this.ctx.shadowColor = "#000";
  }

  clamp(val, min, max) {
    return val > max ? max : val < min ? min : val;
  }

  map(x, in_min, in_max, out_min, out_max) {
    return this.clamp((x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min, out_min,out_max);
  }

  inRange(x, min, max) {
    return ((x-min)*(x-max) <= 0);
  }
  
}