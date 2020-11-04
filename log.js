class Log {
  constructor(container) {
    this.innerHTML = '';
    this.maxLogSize = 10000;
    this.container = container;
    this.lastDisplay = 0;
    this.displayFrequency = 200;
    this.scroll = true;
  }

  async update(message){
    this.innerHTML = this.innerHTML + JSON.stringify(message) + "<br />";
    if (this.innerHTML.length > this.maxLogSize) this.truncate();
    if (Date.now() - this.lastDisplay > this.displayFrequency) this.display();
  }

  write(message){
    this.innerHTML += message + "<br />";
    if (Date.now() - this.lastDisplay > this.displayFrequency) this.display();
  }

  truncate(){
    this.innerHTML = this.innerHTML.substring(this.innerHTML.length - this.maxLogSize,this.innerHTML.length);
  }

  display(){
    this.container.innerHTML = this.innerHTML;
    if (this.scroll) this.container.scrollTop = this.container.scrollHeight;
    this.lastDisplay = Date.now();
  }

  clear(){
    this.innerHTML = '';
    this.display();
  };

  hide(){
    this.container.style.display = 'none';
  }

  show(){
    this.container.style.display = 'block'; 
  }

}