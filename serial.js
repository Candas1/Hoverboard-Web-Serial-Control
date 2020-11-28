class Serial {
  constructor(size,log,graph) {
    this.connected = false;
    this.binary = false;
    this.bufferSize = size;
    this.writeBuffer = new ArrayBuffer(this.bufferSize);
    this.writedv = new DataView(this.writeBuffer);
    this.messageSize = 18;
    this.readBuffer = new ArrayBuffer(this.messageSize);
    this.readdv = new DataView(this.readBuffer);
    this.writeOffset = 0;
    this.readOffset = 0;
    this.log = log;
    this.graph = graph;
    this.error = 0;
    this.skip = 0;
    this.success = 0;
    this.serial_frame = 0xABCD;

    this.fieldsAscii = ['Input1',
                        'Input2',
                        'SpeedR',
                        'SpeedL',
                        'BatADC',
                        'BatVoltage',
                        'TempADC',
                        'TempDeg'
                        ];
  }

  disconnect(){
    this.connected = false;
    connect_btn.innerHTML = '<ion-icon name="flash-outline"></ion-icon>';
    send_btn.disabled = !this.connected;  
  } 

  async connect() {

    if ( this.connected){
      this.disconnect();
      return;
    }
    
    if ("serial" in navigator) {
      // The Serial API is supported.
      this.port = await navigator.serial.requestPort();
      // Open and begin reading.
      await this.port.open({
        baudRate: baud.value
      });
    
      this.connected = true;
      connect_btn.innerHTML = '<ion-icon name="flash-off-outline"></ion-icon>';
      send_btn.disabled = !this.connected;
      
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
            if (serial.binary) serial.sendBinary();
            this.write(value);
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
      this.disconnect();
    }  
  }

  write(chunk){
    // add new chunk to the buffer
    for (let i=0, strLen=chunk.length; i < strLen; i++) {       
      this.writedv.setUint8(this.address(this.writeOffset),chunk[i],true);
      this.setWriteOffset(this.writeOffset + 1);
    }
  }

  readLoop(){
    if (this.binary){
      while ( (this.writeOffset) >= (this.readOffset + this.messageSize)){
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
  }

  address(offset){
    return offset%this.bufferSize;
  }
  
  setReadOffset(offset){
    this.readOffset = offset;
    read.value = this.address(this.readOffset); 
  }

  setWriteOffset(offset){
    this.writeOffset = offset;
    write.value = this.address(this.writeOffset);
  }

  skipByte(){
    this.setReadOffset(this.readOffset + 1); // incorrect start frame, increase read offset
    skip.value = this.skip++;
  }

  readBinary(){
    // copy to new buffer and continue from beginning of buffer if needed
    for (let i=0, strLen=this.messageSize; i < strLen; i++) {       
      let val = this.writedv.getUint8(this.address(this.readOffset + i),true);
      this.readdv.setUint8(i,val,true);
    }
    
    let frame = this.readdv.getUint16(0,true);
    if (frame != this.serial_frame){
      this.skipByte();    
      return;
    }

    let message = {};
    message.cmd1 = this.readdv.getInt16(2,true);
    message.cmd2 = this.readdv.getInt16(4,true);
    message.speedR = this.readdv.getInt16(6,true);
    message.speedL = this.readdv.getInt16(8,true);
    message.batVoltage = this.readdv.getInt16(10,true);
    message.boardTemp = this.readdv.getInt16(12,true);
    message.cmdLed = this.readdv.getUint16(14,true);
    let checksum = this.readdv.getUint16(16,true);
    let calcChecksum = frame ^ 
                        message.cmd1 ^ 
                        message.cmd2 ^ 
                        message.speedR ^ 
                        message.speedL ^ 
                        message.batVoltage ^ 
                        message.boardTemp ^ 
                        message.cmdLed;
    
    // Trick to convert calculated Checksum to unsigned
    this.readdv.setInt16(16,calcChecksum,true);
    calcChecksum = this.readdv.getUint16(16,true);
    
    if ( checksum == calcChecksum ){
      success.value = this.success++;
      this.graph.updateData(message);
    }else{  
      error.value = this.error++;  
    }

    message.checksum = checksum;
    message.calcChecksum = calcChecksum;
    this.log.writeLog(message);
    this.setReadOffset(this.readOffset + this.messageSize); // increase read offset by message size
  }

  sendBinary() {

    this.outputStream = this.port.writable;
    this.writer = this.outputStream.getWriter();

    var ab = new ArrayBuffer(8);
    var dv = new DataView(ab);
    
    dv.setUint16(0,this.serial_frame,true);
    dv.setInt16(2, command.steer,true);
    dv.setInt16(4, command.speed,true);
    dv.setUint16(6,this.serial_frame ^ command.steer ^ command.speed,true);
  
    let view = new Uint8Array(ab);
    this.writer.write(view);
    
    this.writer.releaseLock();
  };

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

    if (words[0].split(":").length == 0){
      // Print message, no need to parse it
      log.write(string,3);
      return true;
    }

    if (string.split(":").length == 9){
      for(let j = 0; j < words.length; j++) {
        let index = words[j].split(':')[0];
        let value = words[j].split(':')[1];
        
        if (value === undefined) err = true;
        
        if (index <= this.fieldsAscii.length){
          message[this.fieldsAscii[index-1]] = value;
        }else{
          message[index] = value;
        }
      }
    }else{
      err = true;
    }

    if (!err && Object.entries(message).length > 0) {
      success.value = this.success++;
      log.writeLog(message);
      graph.updateData(message);
      return true;
    }else{
      error.value = this.error++;
      log.write(string,2);
      return true;
    }
  }
}