var API = document.getElementById('API');
var baudrate = document.getElementById('baudrate');
var mode = document.getElementById('mode');
var protocol = document.getElementById('protocol');
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
var view = 'log';

log = new Log(loggerdiv);
graph = new Graph();
serial = new Serial(10000,log,graph);
control = new Control(controlcnv);
voice = new Voice();

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
  toggleMode();
  toggleAPI();
  toggleStats();
  control.startSend();
});

window.addEventListener("resize", function() {
  console.log("resize");
  control.initCanvas();
});

window.onbeforeunload = function(event){ serial.connected = false;};

// Execute a function when the user releases a key on the keyboard
commandIn.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    if (serial.connected) serial.sendAscii(commandIn.value);
  }
});

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
 protocol.disabled = (!serial.binary);
}

function toggleAPI(){
  serial.API = API.value;
  baudrate.disabled = (serial.API == "bluetooth");
}

function toggleProtocol(){
  serial.protocol = protocol.value;
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
  serial.sendAscii(commandIn.value);
}