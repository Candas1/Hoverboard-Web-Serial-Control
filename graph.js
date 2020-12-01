class Graph {
  constructor(){

    this.isPaused = false;
    this.key2trace = {};
    this.traces = [];
    this.countTrace = 0;
    this.points = 0;
    this.lastDataUpdate = Date.now();
    this.dataUpdateFrequency = 0;
    this.lastGraphUpdate = Date.now();
    this.graphUpdateFrequency = 200;
    this.trace = {
      y: [],
      name: "",
      mode: 'lines',
      line: {width:2}, //,shape: 'spline',smoothing:1.2},
      type: 'scattergl',
      };

    const data = [];

    const color = 'lemonchiffon'; 
    const width = 1; 
    this.yaxis = {
      domain:[0,1],
      autorange: true,
      autoscale: true,
      autoticks:true,
      mirror:true,
      
      showline: true,
      linecolor: color,
      lineWidth: width,
      
      tickcolor: color,
      tickwidth: width,
      
      showgrid: false,
      gridcolor: color,
      gridwidth: width,
      
      //zeroline:true,
      //zerolinecolor: color,
      //zerolinewidth: width,
    };

    this.xaxis = {
      domain:[0,1],
      autorange: false,
      autoscale: false,
      autoticks: false,
      mirror:true,
      
      //showline: true,
      //linecolor: color,
      //lineWidth: width,

      tickmode: 'linear',
      tick0: '0',
      dtick: '5', 
      showticklabels: false,
      ticks: "",
      tickcolor: color,
      tickwidth: width,
      
      showgrid: false,
      gridcolor: color,
      gridwidth: width,

      zeroline:false,
      zerolinecolor: color,
      zerolinewidth: width,
    };

    this.layout = {
      grid:{ rows:1, columns:1, pattern: 'independent' , roworder: 'top to bottom'},
      margin: {l:50, r:0, t:20, b:0},
      paper_bgcolor: 'rgb(0,0,0)',
      plot_bgcolor: 'rgb(0,0,0)',
      legend:{
        itemclick:'toggle',
        itemdoubleclick:'toggleothers',
        title: { text:"Channels"} 
      },
      autosize: true,
      yaxis: JSON.parse(JSON.stringify(this.yaxis)),
      xaxis: JSON.parse(JSON.stringify(this.xaxis)),
    };

    const config = {
      responsive: true
    }

    Plotly.newPlot('chart', data , this.layout, config);
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
        this.update.y[this.key2trace[key]].push(message[key]);
      }
    }

    this.points++;

    if (!this.isPaused && (view=='chart') && ( Date.now() - this.lastGraphUpdate > this.graphUpdateFrequency) ){
      // extend traces and relayout
      Plotly.extendTraces('chart', this.update, this.traces);
      this.initUpdateStruct();
      this.relayout();
      this.lastGraphUpdate = Date.now();
      //console.log("Graph Updated");
    }
  }

  clear(){
    this.initUpdateStruct();
    Plotly.update('chart', this.update);
    this.points = 0;
  }

  subplot(param){

    let update = {yaxis:[]};
    for(let i=0;i<this.countTrace;i++){
      let yaxis = 'yaxis' + ( i==0?'':(i+1));
      update.yaxis.push("y" + (param == 0 ? "" : (i+1)) );
      this.layout[yaxis] = JSON.parse(JSON.stringify(this.yaxis));
      if (param == 0) {
        this.layout[yaxis]['domain'] = [0,1];
      }else{
        this.layout[yaxis]['domain'] = this.getDomain(i);
      }
    }

    Plotly.update('chart', update,this.layout);
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
    this.update = {
                   y:[]};
    for( let i= 0; i<this.countTrace;i++){
      this.update.y.push([]);
    }
  }

  relayout(){
    this.layout.xaxis.range = [this.points - 1000,this.points-2];
    this.layout.xaxis.autorange = false;
    this.layout.xaxis.autoscale = true;
    Plotly.relayout('chart', this.layout);
  }
}