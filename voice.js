class Voice {
  constructor() {
    if (annyang) {
      this.isListening = false;
      // Let's define a command.
      const commands = {
        'Board *command': this.voiceCommand
      };
    
      // Add our commands to annyang
      annyang.addCommands(commands);
      annyang.setLanguage('en-US');
    }
  }

  listen(){
    if (annyang) {
      if (this.isListening){
          // Stop listening.
          annyang.abort();
      }else{
          // Start listening.
          annyang.start();
      }
      this.isListening = !this.isListening;
      listen_btn.innerHTML = '<ion-icon name="mic' + ( (this.isListening) ? '-off' : '') + '-outline"></ion-icon>';
    }
  }
  voiceCommand(speech){
    let param1 = 0;
    let words = speech.split(' ');
 
    if (!serial.connected) return;
    if (words.length == 0 ) return;
    let Cmd = words[0];
    if (words.length == 2 ) param1 = parseInt(words[1]);
 
    switch(Cmd){
      case 'speed':
        if ( !isNaN(param1)){  
          speedIn.value = param1;
          send();
          log.write("Executing voice command:" & Cmd & " " & param1,1); 
        }
        break;
       case 'steer':
         if ( !isNaN(param1) ){ 
           steerIn.value = param1;
           send();
           log.write("Executing voice command:" & Cmd & " " & param1,1);
         }
         break;
       case 'stop':
         steerIn.value = "";
         speedIn.value = "";
         send();
         break;
 
      default:
       log.write('Unknown command',2);       
    }
 
    //log.write(speech);
  }
}