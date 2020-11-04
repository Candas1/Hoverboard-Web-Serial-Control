var baud = document.getElementById('baud');
var portSelect = document.getElementById('portSelect');
var disconnect_btn = document.getElementById('disconnect');

var switch_btn = document.getElementById('switch');
var pause_btn = document.getElementById('pause');

var steerIn = document.getElementById('steer');
var speedIn = document.getElementById('speed');
var send_btn = document.getElementById('send');
var write = document.getElementById('write');
var read = document.getElementById('read');
var skip = document.getElementById('skip');
var success = document.getElementById('success');
var error = document.getElementById('error');
var overwrite = document.getElementById('overwrite');

var logger = document.getElementById('log');
var ctx = document.getElementById('chart').getContext('2d');
var container = document.getElementById('container');

var connected = false;
var speed = 0;
var steer = 0;
var binary = true;

log = new Log(document.getElementById('log'));

window.addEventListener("load", function(event) {
  if ("serial" in navigator === false) { 
    let alertMessage = 'Web Serial API not supported. Enable experimental features.<br />' +
                       '//flags/#enable-experimental-web-platform-features<br />' +
                       '//flags/#enable-experimental-web-platform-features<br />' +
                       '//flags/#enable-experimental-web-platform-features<br />';
    log.write(alertMessage);
  }
});

// Execute a function when the user releases a key on the keyboard
steerIn.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    send();
  }
});
speedIn.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    send();
  }
});

graph = new Graph(ctx);
graph.update();

serial = new Serial(10000,log,graph);

var port;
var reader;
var writer;

const encoder = new TextEncoderStream();
let decoder = new TextDecoderStream();

async function connect() {
 if ("serial" in navigator) {

   // The Serial API is supported.
   port = await navigator.serial.requestPort();
   // Open and begin reading.
   await port.open({
     baudRate: baud.value
   });

   portSelect.disabled = true; 
   disconnect_btn.disabled = false;
   send_btn.disabled = false; 
   connected = true;

   while (port.readable) {
     if (binary){
       inputStream = port.readable;
       reader = inputStream.getReader();
     }else{
       inputDone = port.readable.pipeTo(decoder.writable);
       inputStream = decoder.readable;
       reader = inputStream.getReader();
     }

     outputStream = port.writable;
     writer = outputStream.getWriter();

     readLoop();

     }
   }
 };

 async function readLoop(){
  while (true){
    if (binary){
      serial.sendBinary();
    }

    let value, done;
    try {
      ({ value, done } = await reader.read());
    } catch (error) {
      console.log(error);
      break;
    }
    if (done) {
      console.log("Reader canceled");
      break;
    }
    
    if (binary){
      serial.write(value);
      serial.readLoop();
    }else{
      log.write(value.replaceAll(/\n/g,"<br />"));
      updateAsci(value);
    }
    if (!connected) break;
   }

   writer.releaseLock();
   reader.releaseLock();
   await port.close();

   portSelect.disabled = false;
   disconnect_btn.disabled = true;
   send_btn.disabled = true;

 }

 function updateAsci(value){
   if (value[0] == 1){
     words = value.replaceAll(/\n/g, "").split(" ");
     let message = {};
     for(var i = 0; i < words.length; i++) {
       if (words[i].split(':')[0] < 10) {
           message[words[i].split(':')[0]] = words[i].split(':')[1];
       }else{
         message = {};    
       }
     }
     if (Object.entries(message).length > 0) {
       graph.updateData(message);
     }
   }
 }

 
 function switchView(){
   if (logger.style.display == 'block'){
     switch_btn.innerHTML = 'Log';
     log.hide();
     container.style.display = 'block';
   }else{
     switch_btn.innerHTML = 'Chart';
     log.show();
     container.style.display = 'none';
   }
 }

 function pause(){
   if (pause_btn.innerHTML == 'Pause'){
     pause_btn.innerHTML = 'Play';
   }else{
     pause_btn.innerHTML = 'Pause';
   }
 }

 function send() {
   if (binary){
     steer = parseInt(steerIn.value);
     speed = parseInt(speedIn.value);
     serial.sendBinary();
   }else{
     writer.write(command.value);
   }
 }
 
async function disconnect() {
 connected = false;
};
