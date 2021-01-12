class Log {
  constructor(container) {
    this.maxLogSize = 1000;
    this.container = container;
    this.fragment = document.createDocumentFragment();
    this.isPaused = false;
    this.lastLogUpdate = Date.now();
    this.logUpdateFrequency = 200;
    this.lastLogScroll = Date.now();
    this.logScrollFrequency = 400;
  }

  addElement(elementType,text,messageType){
    let span = document.createElement(elementType);
    span.appendChild(document.createTextNode(text));

    switch (messageType){
      case 0:
        span.className = 'line';
        break;
      case 1:
        span.className = 'success';
        break;
      case 2:
        span.className = 'error';
        break;   
      case 3:
        span.className = 'info';
        break;
      case 4:
        span.className = 'field';
        break;
      case 5:
        span.className = 'value';
        break;
    }

    return span;
  }

  // write to log buffer
  write(message,type){
    let line = this.addElement("span","",type);
    line.appendChild(document.createTextNode(message));
    line.appendChild(document.createElement("br"));
    this.fragment.appendChild(line);
  }

  writeLog(message){
    let line = this.addElement("span","",0);
    Object.keys( message ).map( 
      function(key){
        line.appendChild(log.addElement("span",key,4));
        line.appendChild(log.addElement("span",":" ,3));
        line.appendChild(log.addElement("span",message[key] + " ", 5));
      }).join(" ");
    line.appendChild(document.createElement("br"));
    this.fragment.appendChild(line);
  }

  updateLog(){
    if (this.fragment.childElementCount > 0) {
      // Add elements from fragment
      this.container.appendChild(this.fragment);
    }

    if (!this.isPaused) {
      // Truncate if too many lines
      while (this.container.children.length > this.maxLogSize ){
        this.container.removeChild(this.container.firstChild);
      }   
    
      // limit scrolling frequency, it is slow and impacts when many messages are received
      if ( ( Date.now() - this.lastLogScroll > this.logScrollFrequency) && (view == "log") ){
        this.lastLogScroll = Date.now(); 
        this.container.scrollTop = this.container.scrollHeight;
      }
    }
  }

  clear(){
    while (this.container.children.length > 0 ){
      this.container.removeChild(this.container.firstChild);
    }
  };

}