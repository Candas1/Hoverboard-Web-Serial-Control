class Serial {
  constructor(size) {
    this.API = 'serial';
    this.connected = false;
    this.protocol = "ascii";
    this.lastStatsUpdate = Date.now();
    this.statsUpdateFrequency = 500;

    // Buffer
    this.bufferSize = size;
    this.writeBuffer = new ArrayBuffer(this.bufferSize);
    this.writedv = new DataView(this.writeBuffer);
    this.writeOffset = 0;
    this.readOffset = 0;
    
    // Web bluetooth
    this.bluetoothName = 'BT05';
    this.bluetoothService = 0xffe0;
    this.bluetoothCharacteristic = 0xffe1;
    this.bleSending = false;
    
    // Transmition Statistics
    this.error = 0;
    this.skip = 0;
    this.success = 0;
    
    // UART binary
    this.serial_start_frame = 0xABCD;
    
    // Length of outgoing UART binary messages
    this.serial_length = 8;

    // UART incoming binary messages
    this.binary = new Struct(
      { frame:"uint16",
        cmd1:"int16",
        cmd2:"int16",
        speedR:"int16",
        speedL:"int16",
        batV:"int16",
        temp:"int16",
        cmdLed:"uint16",
        checksum:"uint16"
      },0,true);
      this.binarycur = new Struct(
        { frame:"uint16",
          cmd1:"int16",
          cmd2:"int16",
          speedR:"int16",
          speedL:"int16",
          batV:"int16",
          temp:"int16",
          dccurr:"int16",
          cmdLed:"uint16",
          checksum:"uint16"
        },0,true);
    this.usartFeedback = this.binarycur;
    //this.readBuffer = new ArrayBuffer(this.usartFeedback.byteLength);
    //this.readdv = new DataView(this.readBuffer);

    // UART outgoing binary messages
    this.usartCommand = new Struct(
      { frame:["uint16",this.serial_start_frame],
        steer:"int16",
        speed:"int16",
        checksum:"uint16",
      },0,true);

    // UART sideboard outgoing binary messages
    this.sideboardCommand = new Struct(
      { frame:["uint16",this.serial_start_frame],
        pitch:["int16",0],
        dpitch:["int16",0],
        steer:"int16",
        speed:"int16",
        switches:"uint16",
        checksum:"uint16",
      },0,true);

    // IBUS
    this.ibus_channels = 14;
    this.ibus_length = this.ibus_channels*2+4;
  }

  setConnected(){
    connect_btn.innerHTML = '<ion-icon name="flash-off"></ion-icon>';
    API.disabled = baudrate.disabled = this.connected = true;
    send_btn.disabled = !this.connected;  
  }

  setDisconnected(){
    connect_btn.innerHTML = '<ion-icon name="flash"></ion-icon>';
    API.disabled = this.connected = false;
    baudrate.disabled = (this.API == "bluetooth");
    send_btn.disabled = !this.connected;
  } 

  async connect() {
    if (this.connected){
      // disconnect
      if (this.API == 'bluetooth'){
        this.device.gatt.disconnect();
      }else{
        this.reader.cancel();
      }

      // Update UI
      this.setDisconnected();
      return;
    }
    
    if ( this.API == 'serial'){
      this.connectSerial();
    }else{
      this.connectBluetooth();
    } 
  }

  async connectSerial(){
    if ("serial" in navigator) {

      this.port = await navigator.serial.requestPort();
      // Open and begin reading.
      await this.port.open({
        baudRate: baudrate.value
      });
      
      // Update UI
      this.setConnected();
 
      while (this.port.readable) {
        this.inputStream = this.port.readable;
        this.reader = this.inputStream.getReader();
        
        try{
          while (true){
            const { value, done } = await this.reader.read();
            if (done) {
              log.write("Reader canceled",2);
              break;
            }
    
            this.bufferWrite(value);
            this.readLoop();
            if (!this.connected) break;
          }
        }catch (error) {
          // Handle non-fatal read error.
          console.log(error,2);
        } finally{
          
        }
        if (!this.connected) break;   
      }

      this.reader.releaseLock();
      this.port.close();
      this.setDisconnected();
    }
  }

  connectBluetooth(){
    let options = {
          acceptAllDevices:true,
          optionalServices:[this.bluetoothService],
          //filters: [{ name: [this.bluetoothName] },{services: [this.bluetoothService]}],
          };
    navigator.bluetooth.requestDevice(options)
    .then(device => {
      //console.log(device);
      this.device = device;
      device.addEventListener('gattserverdisconnected', this.onDisconnected);
      return device.gatt.connect();
    }).
    then((server) => {
      //console.log(server);
      this.server = server;
      return server.getPrimaryService(this.bluetoothService);
    })
    .then((service) => {
      //console.log(service);
      this.service = service;
      return service.getCharacteristic(this.bluetoothCharacteristic);
    })
    .then(characteristic => characteristic.startNotifications())
    .then((characteristic) => {
      //console.log(characteristic);
      this.characteristic = characteristic;
      // Update UI
      this.setConnected();
      this.characteristic.addEventListener('characteristicvaluechanged',this.handleCharacteristicValueChanged);
    })
    .catch(error => {
      console.log(error);
    });
  }

  handleCharacteristicValueChanged(event) {
    let chunk = new Uint8Array(event.target.value.buffer);
    serial.bufferWrite(chunk);
    serial.readLoop();
  }

  onDisconnected(event) {
    // Update UI
    serial.setDisconnected();
  }

  bufferWrite(chunk){
    // add new chunk to the buffer
    for (let i=0, strLen=chunk.length; i < strLen; i++) {       
      this.writedv.setUint8(this.address(this.writeOffset),chunk[i],true);
      this.setWriteOffset(this.writeOffset + 1);
    }
  }

  readLoop(){
    if (this.protocol.startsWith("binary")){
      // read as long as there is enough data in the buffer
      while ( (this.writeOffset) >= (this.readOffset + this.usartFeedback.byteLength)){
        this.readBinary();
      }
    }else{
      // Read buffer until \n
      while ( (this.writeOffset) >= (this.readOffset)){
        if (this.writedv.getUint8(this.address(this.readOffset),true) != 0x0A){
          this.skipByte();
        }else{
          let found = this.readAscii();
          if (!found) break;
        }
      }
    }
    this.displayStats();
  }

  address(offset){
    return offset%this.bufferSize;
  }
  
  setReadOffset(offset){
    this.readOffset = offset; 
  }

  setWriteOffset(offset){
    this.writeOffset = offset;
  }

  skipByte(){
    this.setReadOffset(this.readOffset + 1); // incorrect start frame, increase read offset
    this.skip++;
  }

  displayStats(){
    if ( ( Date.now() - this.lastStatsUpdate < this.statsUpdateFrequency) || statsdiv.style.display == 'none' ) return;
      this.lastStatsUpdate = Date.now();

    read.value = this.address(this.readOffset);
    write.value = this.address(this.writeOffset);
    success.value = this.success;
    skip.value = this.skip;
    error.value = this.error;
  }

  readBinary(){
    this.usartFeedback = this[this.protocol];
    var readBuffer = new ArrayBuffer(this.usartFeedback.byteLength);
    var readdv = new DataView(readBuffer);

    // copy chunk to new arrayBuffer
    for (let i=0, strLen=this.usartFeedback.byteLength; i < strLen; i++) {       
      let val = this.writedv.getUint8(this.address(this.readOffset + i),true);
      readdv.setUint8(i,val,true);
    }
    
    // Read struct
    let message = this.usartFeedback.read(readdv);
    if (message.frame != this.serial_start_frame){
      this.skipByte();    
      return;  
    }
    // Checksum is XOR of all fields except checksum cast to Uint
    let calcChecksum = new Uint16Array([
                           Object.keys(message)
                                 .filter(key => key != "checksum" )
                                 .map( key => message[key])
                                 .reduce( (acc,curr) => (acc ^ curr) )
                           ])[0];
    
                   
    
    // validate checksum
    if ( message.checksum == calcChecksum ){
      this.update(message);
    }else{  
      this.error++;
      log.write(Object.keys( message ).map( key => (key + ":" + message[key])).join(" "),2);
    }

    this.setReadOffset(this.readOffset + this.usartFeedback.byteLength); // increase read offset by message size
  }
 
  readAscii(){
    let string = '';
    let i = 1;
    let found = false;
    // read until next \n
    while (this.writeOffset >= this.readOffset + i){
      let char = this.writedv.getUint8(this.address(this.readOffset + i),true); 
      if ( char == 0x0A){
        // Save new read pointer
        this.setReadOffset(this.readOffset + i);
        found = true;
        break;  
      }else{
        string += String.fromCharCode(char);
        i++;
      }
    }
    
    // \n not found, buffer probably doesn't have enough data, exit
    if (!found){
      return false;
    }

    let words = string.split(" ");
    let message = {};
    let err = false;

    // It's an error, show in red
    if (string[0] == "!"){
      log.write(string,2);
      return true;
    }else{
      // If first word doesn't contain semi-colon, no need to parse it
      if (/^.*[:]-?\d+$/.test(words[0]) == false){
        log.write(string,3);
        return true;
      }
    }
    
    for(let j = 0; j < words.length; j++) {
      let [index,value] = words[j].split(':');
      
      // Skip rows having empty values
      if (value === undefined){
        //log.write(string,3);
        //return true;
        continue;
      }
      message[index] = value;
    }
  
    if (!err && Object.entries(message).length > 0) {
      this.update(message);
    }else{
      this.error++;
      log.write(string,2);
    }

    return true;
  }

  update(message){
    this.success++;
    graph.updateData(message);
    telemetry.update(message);
    if (watchIn.checked) log.writeLog(message);
  }

  sendBinary() {
    let bytes = 0;
    switch (control.protocol){
      case "usart":
        bytes = new Uint8Array(
            this.usartCommand.write(
              { 
                steer:control.channel[0],
                speed:control.channel[1],
                checksum:this.serial_start_frame ^ control.channel[0] ^ control.channel[1],
              }));
        break;
      case "hovercar":
        bytes = new Uint8Array(
            this.sideboardCommand.write(
            { 
              steer:control.channel[0],
              speed:control.channel[1],
              switches:control.switches,
              checksum:this.serial_start_frame ^ control.channel[0] ^ control.channel[1] ^ control.switches,
            }));
        break;
      case "ibus":
        var ab = new ArrayBuffer(this.ibus_length);
        var dv = new DataView(ab);
        
        // Write Ibus Start Frame
        dv.setUint8(0,this.ibus_length);
        dv.setUint8(1,this.ibus_command);
        // Write channel values
        for (let i=0; i< this.ibus_channels * 2;i+=2){
          dv.setUint16(i+2, control.channel[i/2],true);
        }

        // Calculate checksum
        let checksum = 0xFFFF;
        for (let i=0; i<this.ibus_length-2;i++){
          checksum -= dv.getUint8(i);
        }
        dv.setUint16(this.ibus_length-2,checksum,true);
        
        bytes = new Uint8Array(ab);
        break;
    }

    this.send(bytes);

  };

  async send(bytes){
    if (this.API == 'serial'){
      // Web Serial
      this.outputStream = this.port.writable;
      this.writer = this.outputStream.getWriter();
      this.writer.write(bytes);
      this.writer.releaseLock();
    }else{
      if (this.bleSending) return;
      // Web Bluetooth
      let chunksize = 20;
      let sent = 0;
      while(sent < bytes.length){
        // Sent chunks of 20 bytes because of BLE limitation
        this.bleSending = true;
        await this.characteristic.writeValueWithoutResponse(bytes.slice(sent,sent+chunksize));
        this.bleSending = false;
        sent += chunksize;
      }
    } 
  }
}