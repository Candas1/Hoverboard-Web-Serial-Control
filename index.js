var API = document.getElementById('API');
var baudrate = document.getElementById('baudrate');
var mode = document.getElementById('mode');
var statsIn = document.getElementById('stats');

var send_btn = document.getElementById('send');
var connect_btn = document.getElementById('connect');
var pause_btn = document.getElementById('pause');
var listen_btn = document.getElementById('listen');

var commandIn = document.getElementById('command');
var crIn = document.getElementById('cr');
var lfIn = document.getElementById('lf');
var write = document.getElementById('write');
var read = document.getElementById('read');
var skip = document.getElementById('skip');
var success = document.getElementById('success');
var error = document.getElementById('error');

var serialdiv  = document.getElementById('serialdiv');
var commanddiv = document.getElementById('commanddiv');
var statsdiv   = document.getElementById('statsdiv');
var loggerdiv  = document.getElementById('loggerdiv');
var chartdiv   = document.getElementById('chartdiv');
var controlcnv = document.getElementById('controlcnv');
var ctx = controlcnv.getContext('2d');
var view = 'log';

log = new Log(loggerdiv);
graph = new Graph();
serial = new Serial(10000,log,graph);
command = new Command();
voice = new Voice();

controlcnv.width=1000;//horizontal resolution (?) - increase for better looking text
controlcnv.height=500;//vertical resolution (?) - increase for better looking text  

window.addEventListener("load", function(event) {
  if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    // if on Mobile phone, only Web Bluetooth API is available
    API.remove(API.selectedIndex);
  }else{
    // if on computer,remove Web Serial API if not available
    if ("serial" in navigator === false) {
      API.remove(API.selectedIndex);
      log.write('Web Serial API not supported. Enable experimental features.',2);
      log.write('chrome://flags/#enable-experimental-web-platform-features',2);
      log.write('opera://flags/#enable-experimental-web-platform-features',2);
      log.write('edge://flags/#enable-experimental-web-platform-features',2);  
    }
  }
  toggleAPI();
  toggleStats();
  startSend();
  initCanvas(0,0);
});

window.onbeforeunload = function(event){ serial.connected = false;};

let clicked = false;
['mousedown','mouseup','mousemove','touchstart','touchmove','touchend'].forEach( evt => 
  controlcnv.addEventListener(evt, 
    function(event){
      let rect = controlcnv.getBoundingClientRect();
      let steer = 0;
      let speed = 0;
      event.preventDefault();
      switch (event.type){
        case "mousedown":
          clicked = true;
        case "mousemove":
          if (clicked){
            steer = Math.round(map(event.clientX,rect.left,rect.right,-1000,1000));
            speed = Math.round(map(event.clientY,rect.bottom,rect.top,-1000,1000));
          }
          break;
        case "touchstart":
        case "touchmove":
          steer = Math.round(map(event.touches[0].clientX,rect.left,rect.right,-1000,1000));
          speed = Math.round(map(event.touches[0].clientY,rect.bottom,rect.top,-1000,1000));
          break;
        case "mouseup":
          clicked = false;
        case "touchend":
          break;
      }
      
      initCanvas(steer,speed);
      command.setSpeed(steer,speed);
    }
  , false));

// Execute a function when the user releases a key on the keyboard
commandIn.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    if (serial.connected) command.cmdAscii(commandIn.value);
  }
});


function clamp(val, min, max) {
  return val > max ? max : val < min ? min : val;
}

function map(x, in_min, in_max, out_min, out_max) {
  return clamp((x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min, out_min,out_max);
}

function startSend(){
  setInterval(function(){
    if (serial.connected && serial.binary){
      serial.sendBinary();
    }
  },50);
}

function initCanvas(steer,speed){
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, controlcnv.width, controlcnv.height);
  ctx.strokeStyle = "white";
  ctx.beginPath();
  ctx.moveTo(0, controlcnv.height/2);
  ctx.lineTo(controlcnv.width, controlcnv.height/2);
  ctx.moveTo(controlcnv.width/2,0);
  ctx.lineTo(controlcnv.width/2, controlcnv.height);
  ctx.stroke();

  ctx.font = "40px Consolas";
  ctx.fillStyle = "green";
  ctx.fillText("Steer: " + steer, 10, 50);
  ctx.fillText("Speed: " + speed, 10, 100);
}

function switchView(newView){
  switch (newView){
    case 'log':
      chartdiv.style.display = "none";
      loggerdiv.style.display = "block";
      controlcnv.style.display = "none";
      break;
    case 'chart':
      chartdiv.style.display = "block";
      loggerdiv.style.display = "none";
      controlcnv.style.display = "none";
      graph.relayout();
      break; 
    case 'control':
      chartdiv.style.display = "none";
      loggerdiv.style.display = "none";
      controlcnv.style.display = "block";
      break;  
  }
  view = newView;

}

function deleteData(){
  if (view == "log"){
    log.clear();
  }else{
    graph.clear();
  }
}

function toggleMode(){
 serial.binary = (mode.value == "binary");
 commanddiv.style.display = (serial.binary) ? 'none' : 'block';
}

function toggleAPI(){
  serial.API = API.value;
  baudrate.disabled = (serial.API == "bluetooth");
}

function toggleStats(){
  statsdiv.style.display = (!statsIn.checked) ? 'none' : 'block';
}

function pauseUpdate(){
  if (log.isPaused){
    pause_btn.innerHTML = '<ion-icon name="pause"></ion-icon>';
  }else{
    pause_btn.innerHTML = '<ion-icon name="play"></ion-icon>';
  }
  log.isPaused = !log.isPaused;
  graph.isPaused = !graph.isPaused;
}

function sendCommand() {
  command.cmdAscii(commandIn.value);
}