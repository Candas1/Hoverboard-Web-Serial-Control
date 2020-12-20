var API = document.getElementById('API');
var baudrate = document.getElementById('baudrate');
var mode = document.getElementById('mode');
var statsIn = document.getElementById('stats');
var subplotIn = document.getElementById('subplot');
var mixerIn = document.getElementById('mixer');
var viewIn = document.getElementById('view');

var send_btn = document.getElementById('send');
var connect_btn = document.getElementById('connect');
var pause_btn = document.getElementById('pause');
var trash_btn = document.getElementById('trash');

var commandIn = document.getElementById('command');
var crIn = document.getElementById('cr');
var lfIn = document.getElementById('lf');
var write = document.getElementById('write');
var read = document.getElementById('read');
var skip = document.getElementById('skip');
var success = document.getElementById('success');
var error = document.getElementById('error');

var serialdiv  = document.getElementById('serialdiv');
var statsindiv = document.getElementById('statsindiv');
var chartindiv = document.getElementById('chartindiv');
var ctrlindiv  = document.getElementById('ctrlindiv');
var commanddiv = document.getElementById('commanddiv');
var statsdiv   = document.getElementById('statsdiv');
var loggerdiv  = document.getElementById('loggerdiv');
var chartdiv   = document.getElementById('chartdiv');
var controlcnv = document.getElementById('controlcnv');
var outputdiv  = document.getElementById('outputdiv');
var controldiv = document.getElementById('controldiv');
var bauddiv    = document.getElementById('bauddiv');
var view = 'log';

log = new Log(loggerdiv);
graph = new Graph();
control = new Control(controlcnv);
serial = new Serial(10000);

window.addEventListener("load", function(event) {
  
  if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    // if on Mobile phone, only Web Bluetooth API is available
    API.remove(API.selectedIndex);
    bauddiv.style.display = "none";
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
  toggleMixer();
  toggleSubplot();

  serial.setDisconnected()
  if (typeof(Worker)!=="undefined"){
    // Use webworker for interval to work even if tab is unfocused
    w = new Worker("js/timer.js");
    // Run Update
    w.onmessage = function (event) {
      update();
    };
  } else {
    // Web workers are not supported by your browser
    setInterval(update,50);
  }
});


window.addEventListener("resize", function() {
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

function update(){
  // Send Commands
  if (serial.connected){
    if (serial.binary) serial.sendBinary();
  }
  graph.updateGraph();
  log.updateLog();
  control.updateScreen();
}

function switchView(newView){
  view = newView;

  statsIn.disabled = !(view == "log");

  switch (view){
    case "log":
      commanddiv.style.display = (!serial.binary) ? "block" : "none";
      statsdiv.style.display   = (statsIn.checked) ? "block" : "none";
      
      chartindiv.style.display = "none";
      ctrlindiv.style.display  = "none";
      statsindiv.style.display = "block";

      loggerdiv.style.height   = 54 + (statsdiv.style.display == "none") * 13 + (commanddiv.style.display == "none") * 13 + "%";
      chartdiv.style.display   = "none";
      controlcnv.style.display = "none";
      controldiv.style.display = "none";
      loggerdiv.style.display  = "block";
      outputdiv.style.display  = "block";
      break;
    case "chart":
      statsindiv.style.display = "none";
      ctrlindiv.style.display  = "none";
      chartindiv.style.display = "block";
      
      controlcnv.style.display = "none";
      controldiv.style.display = "none";
      loggerdiv.style.display  = "none";
      statsdiv.style.display   = "none";
      commanddiv.style.display = "none";
      chartdiv.style.display   = "block";
      outputdiv.style.display  = "block";
      graph.updateGraph();
      break;
    case "control":
      statsindiv.style.display = "none";
      chartindiv.style.display = "none";  
      ctrlindiv.style.display  = "block";
      
      loggerdiv.style.display  = "none";
      chartdiv.style.display   = "none";
      outputdiv.style.display  = "none";
      statsdiv.style.display   = "none";
      commanddiv.style.display = "none";
      controlcnv.style.display = "block";
      controldiv.style.display = "block";
      control.initCanvas();
      break;
  }
}

function toggleAPI(){
  serial.API = API.value;
  baudrate.disabled = (serial.API == "bluetooth");
}

function toggleMode(){
  switch (mode.value){
    case "ascii":
      serial.binary = false;
      break;
    case "usart":
    case "ibus":  
      serial.binary = true;
      serial.protocol = mode.value;
      break;
  }
  switchView(view);
 }

function toggleStats(){
  switchView(view);
}

function toggleMixer(){
  control.mixer = mixerIn.value;
}

function toggleSubplot(){
  graph.subplot(subplotIn.value == "yes");
}

function deleteData(){
  if (view == "log"){
    log.clear();
  }else{
    graph.clear();
  }
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