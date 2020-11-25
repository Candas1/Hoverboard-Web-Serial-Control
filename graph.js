class Graph {
  constructor(){

    this.isPaused = false;
    this.key2trace = {};
    this.traces = [];
    this.countTrace = 0;
    this.lastDataUpdate = Date.now();
    this.dataUpdateFrequency = 200;
    this.lastGraphUpdate = Date.now();
    this.graphUpdateFrequency = 500;
    this.trace = {
      x: [],
      y: [],
      name: "",
      mode: 'lines',
      line: {shape: 'spline',smoothing:1},
      type: 'scattergl',
      };

    const data = [];

    const color = 'grey'; 
    const width = 0.1; 
    this.yaxis = {
      showgrid: true,
      showline: true,
      
      linecolor: color,
      lineWidth: width,
      
      tickcolor: color,
      tickwidth: width,
      
      gridcolor: color,
      gridwidth: width,
      
      zerolinecolor: color,
      zerolinewidth: width,
    };

    this.xaxis = {
      showgrid: true,
      showline: true,

      linecolor: color,
      lineWidth: width,

      tickcolor: color,
      tickwidth: width,
      
      gridcolor: color,
      gridwidth: width,

      zerolinecolor: color,
      zerolinewidth: width,
    };

    const layout = {
      grid:{ rows:1, columns:1, pattern: 'independent',roworder: 'top to bottom'},
      paper_bgcolor: 'rgb(0,0,0)',
      plot_bgcolor: 'rgb(0,0,0)',
      autosize: true,
      yaxis: this.yaxis,
      xaxis: this.xaxis,
    };

    const config = {
      responsive: true
    }

    Plotly.newPlot('chart', data , layout, config);
  }  

  async updateData(message){
    if ( Date.now() - this.lastDataUpdate < this.dataUpdateFrequency) return;
    this.lastDataUpdate = Date.now();

    let time = new Date();

    // Create new trace for each value
    for (let key in message){
      // New field
      if (!(key in this.key2trace)){ 
        this.key2trace[key] = this.countTrace; 
        this.trace.name = key; 
        Plotly.addTraces('chart',[this.trace]);
        this.traces.push(this.countTrace);
        this.countTrace++; 
        // Prepare empty structure
        this.initUpdateStruct();
      }else{
        this.update.x[this.key2trace[key]].push(time);
        this.update.y[this.key2trace[key]].push(message[key]);
      }
    }

    if (!this.isPaused && (view=='chart') && ( Date.now() - this.lastGraphUpdate > this.graphUpdateFrequency) ){
      // extend traces and relayout
      Plotly.extendTraces('chart', this.update, this.traces);
      this.initUpdateStruct();
      this.relayout();
      this.lastGraphUpdate = Date.now();
      //console.log("Graph Updated");
    }
  }

  subplot(param){

    let update = {yaxis:[]};
    let layout = { grid:{rows:1,columns: 1, pattern: 'dependent', roworder: 'top to bottom'}, yaxis:[]};
    
    for(let i=0;i<this.countTrace;i++){
      let axis = 'yaxis' + ( i==0?'':(i+1));
      update.yaxis.push("y" + (param == 0 ? "" : (i+1)) );
      layout[axis] = JSON.parse(JSON.stringify(this.yaxis));
      if (param == 0) {
        layout[axis]['domain'] = [0,1];
      }else{
        layout[axis]['domain'] = this.getDomain(i);
      }
    }

    if (param==1) layout.grid.rows = this.countTrace;
    Plotly.update('chart', update,layout);
  }

  getDomain(i) {
    var N = this.countTrace;
    var spacing = 0.05;
    
    return [
      (1 / N) * i + (i === 0 ? 0 : spacing / 2),
      (1 / N) * (i + 1) - (i === (N - 1) ? 0 : spacing / 2)
    ]
  }


  initUpdateStruct(){
    // Initialise empty structure for appending traces
    this.update = {x:[],y:[]};
    for( let i= 0; i<this.countTrace;i++){
      this.update.x.push([]);
      this.update.y.push([]);
    }
  }

  relayout(){
    let time = new Date();  
    var olderTime = time.setMinutes(time.getMinutes() - 1);
    var futureTime = time.setMinutes(time.getMinutes() + 1);

    var minuteView = {
          xaxis: {
            type: 'date',
            range: [olderTime,futureTime]
          }   
        };

    Plotly.relayout('chart', minuteView);
  }
}