class Graph {
  constructor(){
    this.isPaused = false;
    this.key2trace = {};
    this.traces = [];
    this.countTrace = 0;
    this.newDatapoints = 0;
    this.subplotview = false;
    this.lastDataUpdate = Date.now();
    this.dataUpdateFrequency = 50;
    this.lastGraphUpdate = Date.now();
    this.graphUpdateFrequency = 400;
    this.trace = {
      x: [],
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
      type: 'date',
      domain:[0,1],
      autorange: false,
      autoscale: false,
      autoticks: false,
      mirror:true,
      
      //showline: true,
      //linecolor: color,
      //lineWidth: width,

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
      grid:{ rows:1, columns:1, pattern:'independent' , roworder:'top to bottom'},
      margin: {l:50, r:0, t:20, b:0},
      paper_bgcolor: 'rgb(0,0,0)',
      plot_bgcolor: 'rgb(0,0,0)',
      dragmode: 'pan',
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

    Plotly.newPlot(chartdiv, data , this.layout, config);

    //chartdiv.on('plotly_legendclick', this.legendClick.bind(this) ); 


  }  

  legendClick(data){
    if (this.subplotview){
      // if subplotview is active, toggle the visibility of the selected axis
      let yaxis = 'yaxis' + ( data.curveNumber==0?'':(data.curveNumber+1)); 
      this.layout[yaxis] = JSON.parse(JSON.stringify(this.yaxis));
      this.layout[yaxis].visible = !this.layout[yaxis].visible;
      Plotly.relayout(chartdiv, this.layout);
    }
  }

  async updateData(message){
    if ( Date.now() - this.lastDataUpdate < this.dataUpdateFrequency) return;
    this.lastDataUpdate = Date.now();

    let time = new Date();

    // Create new trace for each value
    for (let key in message){
      if (key == "checksum" || key == "cmdLed") continue;

      // New field
      if (!(key in this.key2trace)){ 
        this.key2trace[key] = this.countTrace; 
        this.trace.name = key; 
        Plotly.addTraces(chartdiv,[this.trace]);
        this.traces.push(this.countTrace);
        this.countTrace++; 
        // Prepare empty structure
        this.initUpdateStruct();
      }else{
        this.update.x[this.key2trace[key]].push(time);
        this.update.y[this.key2trace[key]].push(message[key]);
        this.newDatapoints++;
      }
    }
  }

  updateGraph(){
    if ( (!this.isPaused) && 
         (view=='chart') && 
         ( Date.now() - this.lastGraphUpdate > this.graphUpdateFrequency) &&
         (this.newDatapoints > 0)
       ){
      // extend traces and relayout
      Plotly.extendTraces(chartdiv, this.update, this.traces);
      this.initUpdateStruct();
      this.relayout();
      this.lastGraphUpdate = Date.now();
      this.newDatapoints = 0;
      //console.log("Graph Updated");
    }
  }

  clear(){
    this.initUpdateStruct();
    Plotly.update(chartdiv, this.update);
  }

  subplot(param){
    this.subplotview = param;
    let update = {yaxis:[]};
    for(let i=0;i<this.countTrace;i++){
      let yaxis = 'yaxis' + ( i==0?'':(i+1));
      update.yaxis.push("y" + (!param ? "" : (i+1)) );
      this.layout[yaxis] = JSON.parse(JSON.stringify(this.yaxis));
      if (!param) {
        this.layout[yaxis]['domain'] = [0,1];
      }else{
        this.layout[yaxis]['domain'] = this.getDomain(i);
      }
    }

    Plotly.update(chartdiv, update,this.layout);
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
    let time = new Date(this.lastDataUpdate);
    var olderTime = time.setSeconds(time.getSeconds() - 10);	
    var futureTime = time.setSeconds(time.getSeconds() + 10);
    
    this.layout.xaxis.range = [olderTime,futureTime];
    this.layout.xaxis.autorange = false;
    this.layout.xaxis.autoscale = true;
    Plotly.relayout(chartdiv, this.layout);
  }
}