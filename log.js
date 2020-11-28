class Log {
  constructor(container) {
    this.maxLogSize = 1000;
    this.container = container;
    this.isPaused = false;
    this.lastLogUpdate = Date.now();
    this.logUpdateFrequency = 200;
  }

  addSpan(text,type){
    let span = document.createElement("span");
    span.appendChild(document.createTextNode(text));

    switch (type){
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

    let line = this.addSpan("",type);
    line.appendChild(document.createTextNode(message));
    line.appendChild(document.createElement("br"));
    this.container.appendChild(line);

    this.display();
  }

  writeLog(message){
    
    let line = this.addSpan("",0);
    Object.keys( message ).map( 
      function(key){
        line.appendChild(log.addSpan(key + ":" ,4));
        line.appendChild(log.addSpan(message[key] + " ", 5));
      }).join(" ");
    line.appendChild(document.createElement("br"));
    this.container.appendChild(line);
    this.display();
  }

  display(){
    if (!this.isPaused) { 
      // Truncate if too many lines
      while (this.container.children.length > this.maxLogSize ){
        this.container.removeChild(this.container.firstChild);
      }
      
      // limit scrolling frequency, it is slow and impacts when many messages are received
      if ( Date.now() - this.lastLogUpdate < this.logUpdateFrequency) return;
      this.lastLogUpdate = Date.now();

      this.container.scrollTop = this.container.scrollHeight;
    }
  }

  clear(){
    while (this.container.children.length > 0 ){
      this.container.removeChild(this.container.firstChild);
    }
    this.display();
  };

}