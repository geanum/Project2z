
var createMap = () => {

  //Width and height of map
  var width = 960,
      height = 480;

  // D3 Projection
  var projection = d3.geoAlbersUsa()
           .translate([width/2, height/2])    // translate to center of screen
           .scale([1000]);          // scale things down so see entire US

  // Define path generator
  var path = d3.geoPath()               // path generator that will convert GeoJSON to SVG paths
           .projection(projection);  // tell path generator to use albersUsa projection

  //Create SVG element and append map to the SVG
  var svg = d3.select('#map')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
          
  // Append Div for tooltip to SVG
  var div = d3.select('body')
          .append('div')   
          .attr('class', 'tooltip')               
          .style('opacity', 0);

  drawMap(svg, path);
};


var drawMap = (svg, path) => {

  // Load GeoJSON data and merge with states data
  d3.json('states.json', function(json) {

    // Bind the data to the SVG and create one path per GeoJSON feature
    svg.selectAll('path')
      .data(json.features)
      .enter()
      .append('path')
      .attr('d', path)
      .style('stroke', '#fff')
      .style('stroke-width', '1')
      .style('fill', 'steelblue')
      .on('click', function(d) { mapOnClick(d.properties.name); });
  });
}

// On map single click: update chart with state info
var mapOnClick = (selectState) => {

  var width = 500,
      height = 350,
      margin = {top: 20, right: 0, bottom: 30, left: 50};

  //var selectState = d.properties.name;

  console.log(data[selectState])

  var t = d3.transition()
      .duration(750);

  var chart = d3.select('#chart')
    .select('svg')

  var x = d3.scaleTime().range([0, width - margin.left - margin.right]),
      y = d3.scaleLinear().range([0, height - margin.bottom - margin.top]);

  var drawLine = d3.line()
    .curve(d3.curveBasis)
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.value); });

  x.domain([new Date(1996, 04), new Date(2016,12)]);
  y.domain([calculateMax(selectState),0]);

  chart.select(".axisY") // change the x axis
    .transition()
      .duration(750)
      .call(d3.axisLeft(y))

  // ENTER new elements present in new data.
  chart.append('path')
      .datum(data[selectState])
      .attr('class', 'line')
      .attr('id', selectState)
      .attr('d', function(d) { return drawLine(d); })
      .attr('transform', 'translate(' + 30 + ',0)')
      .style('opacity', 1e-6)
      .transition()
        .duration(400)
        .style("opacity", 1);

  chart.selectAll('path.line')
    .attr('d', function(d) { return drawLine(d); });

  chart.selectAll('path.line')
    .on('click', removeLine());

  console.log(selectState);
}

var removeLine = (id) => {
  console.log('lel');
  //d3.select('#' + id).remove();
}

var createChart = () => {
  
  var width = 500,
      height = 350;

  var svg = d3.select('#chart').append('svg')
    .attr('width', width)
    .attr('height', height);
    
  var margin = {top: 20, right: 0, bottom: 30, left: 50},
      g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  var x = d3.scaleTime().range([0, width - margin.right - margin.left]),
      y = d3.scaleLinear().range([0, height - margin.bottom - margin.top]);

  var line = d3.line()
    .curve(d3.curveBasis)
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.value); });

  x.domain([new Date(1996, 04), new Date(2016,12)]);
  y.domain([0,0]);

  svg.append('g')
      .attr('class', 'axisX')
      .attr('transform', 'translate(' + 30 + ',' + (height - margin.bottom - margin.top) + ')')
      .call(d3.axisBottom(x));

  svg.append('g')
      .attr('class', 'axisY')
      .attr('transform', 'translate(' + 30 + ',0)')
      .call(d3.axisLeft(y))
    .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '0.71em')
      .attr('fill', '#000')
      .text('($)');

  console.log(data);

}

var calculateMax = (state) => {
  //Can probably be done in getData
  var stateArray = data[state];
  var stateMax = 0;

  for(var i in stateArray) {
    if (isNaN(stateArray[i].value))
      continue;

    if (stateArray[i].value > stateMax) 
      stateMax = stateArray[i].value;
  }

  console.log('stateMax: ' + stateMax);
  console.log(chartMax);

  if (chartMax < stateMax)
    chartMax = stateMax;

  console.log(chartMax);

  return chartMax;
}

var getData = (callback) => {

  var parseTime = d3.timeParse('%Y-%m');
  var data = {}; // Will hold KVP with key: states and value: array of datapoints (date,value)

  d3.csv('State_MedianValuePerSqft_AllHomes.csv', function(err, dat) {
    if (err) throw err;

    dat.forEach(function(d) {

      var points = [];

      for (const key of Object.keys(d)) {

        if (key == 'RegionID' | key == 'RegionName' | key == 'SizeRank')
          continue;

        if (isNaN(parseInt(d[key])))
          continue;
          
        dateValue = {
          date: parseTime(key),
          value: parseInt(d[key])
        };

        points.sort(function(a,b) {
          return a.date - b.date;
        }); 

        points.push(dateValue);
      }

      data[d.RegionName] = points;
    });

    callback(data);
  });

}

var getDataPie = (callback) => {

  var parseTime = d3.timeParse('%Y-%m');

  var data = {};

  d3.csv('State_PctOfHomesSellingForGain_AllHomes.csv', function(err, dat) {
    if (err) throw err;

    dat.forEach(function(d) {

      var dateGainLoss = {};

      for (const key of Object.keys(d)) {

        dataPoints = [];

        if(key == 'SizeRank')
          continue;

        dateGain = {
          type: 'gain',
          date: parseTime(key),
          value: parseInt(d[key])
        };

        dateLoss = {
          type: 'loss',
          date: parseTime(key),
          value: 100 - parseInt(d[key])
        };

        dataPoints.push(dateGain);
        dataPoints.push(dateLoss);

        dateGainLoss[key] = dataPoints;

        data[d.RegionName] = dateGainLoss;
      }
    })

    callback(data);
  });

}

var createPie = () => {

  var width = 320,
    height = 320,
    radius = Math.min(width, height) / 2;

  var color = d3.scaleOrdinal()
    .range(['#5858a7','#a75858', '#edf8b1']);

  var arc = d3.arc()
    .innerRadius(radius - 70)
    .outerRadius(radius - 10);

  var labelArc = d3.arc()
      .outerRadius(radius - 10)
      .innerRadius(radius - 70);

  var pie = d3.pie()
      .sort(null)
      .value(function(d) { return d.value; })

  var svg = d3.select("#pie").append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  var selectedData = dataPie['California'];

  console.log(selectedData);

  var path = svg.selectAll('.arc')
    .data(pie(selectedData['2016-12']))
    .enter()
    .append('path')
    .attr('d', arc)
    .attr('fill', function(d, i) {
      return color(d.data.type)
    });
}



var data;
var dataPie;
var chartMax = 0;
getData(function(d) {
  data = d;
  getDataPie(function(d2) {
    dataPie = d2;
    createMap();
    createChart();
    createPie();
  })
});
