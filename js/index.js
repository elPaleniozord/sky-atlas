//define basic map parameters
var width = document.documentElement.clientWidth,
    height = width/2,
    tx = 0, ty = 0,
    scale = 1,
    rotate =[140,-40]; //default position

//initialize projection - stereographic = inside of a ball
var projection = d3.geo.stereographic()
    .scale(600)                       //overall scale factor
    .clipAngle(120)                    //clipping circle radius
    .rotate(rotate)
    .translate([width/2, height/2]);

var path = d3.geo.path()              //path generator function
    .projection(projection);

var starPath = d3.geo.path()
    .projection(projection)
    .pointRadius(function(d){
      return radius(d.properties.mag);
    })
//dragging function
var drag = d3.behavior.drag()
  .origin(Object)
  .on('drag', function(d) {
    var p = projection.rotate();
    rotate = [p[0] + d3.event.dx/3, p[1]-d3.event.dy/3, p[2]];

    projection.rotate(rotate);
    path=d3.geo.path().projection(projection);
    starPath=d3.geo.path().projection(projection).pointRadius(function(d){  return radius(d.properties.mag)})
    d3.selectAll('.graticule, .lines, .boundaries').attr("d", path);
    d3.selectAll('.stars').attr("d", starPath);
    d3.selectAll('.names').attr('transform', 'translate('+[d3.event.dx/3, d3.event.dy/3]+')')
    })
//zooming FUNCTION
function scrollZoom(){
  d3.event.preventDefault();

  var factor = 1.1;
  var center = d3.mouse(this);  //array[x, y]
  var newScale, newTx, newTy;
  //zoom boundaries
    if(d3.event.deltaY>0){
      newScale = scale*factor;} //zoom in
    else {
      if(scale<1.000){
        newScale=scale} //minimal zoom
      else{
        newScale = scale/factor} //zoom out
    }

  //
  newTx = center[0]-(center[0]-tx)*newScale/scale;
  newTy = center[1]-(center[1]-ty)*newScale/scale;

  //update coords and scale
  scale = newScale;
  tx = newTx/2;
  ty = newTy/2;

  svg.attr('transform', `translate(${tx}, ${ty}) scale(${scale})`);
};
//initialize svg element
var svg = d3.select(".atlas").append("svg")
    .attr("width", width)
    .attr("height", height)
    .call(drag)
    .on('wheel.zoom', scrollZoom)  //zoom function
    .attr('transform', `translate(${tx}, ${ty}) scale(${scale})`);
//scale radius by star magnitude
var radius = d3.scale.linear()
    .domain([-1, 5])
    .range([4, 1.5]);
//
svg.append("path")
    .attr("class", "graticule")
    .datum(d3.geo.graticule()
      .step([8,8]));

svg.append("g")
    .attr("class", "stars");

svg.append("g")
    .attr("class", "names");

svg.append("g")
    .attr("class", "boundaries");

svg.append("g")
    .attr("class", "lines")

//parse data
queue()
  .defer(d3.csv, "https://gist.githubusercontent.com/elPaleniozord/433b888e3ed64da651f18d5c60682c8a/raw/76e8fa3fe6eb6aaf93154927788ecf6fd47e240c/hyg_data.csv")
  .defer(d3.json, "https://gist.githubusercontent.com/elPaleniozord/bb775473088f3f60c5f3ca1afeb88a82/raw/66a84de978c8c787916cb363894a8da6b62bb915/bounds.json")
  .defer(d3.json, "https://gist.githubusercontent.com/elPaleniozord/ed1dd65a955c2c7e1bb6cbc30feb523f/raw/9f2735f48f6f477064f9e151fe73cc7b0361bf2e/lines.json")
  .await(processData);

//controlls, containers
var minMag = 6.0;
var starGeometry=[], linesGeometry=[], boundsGeometry=[];

//map render
function mapRender(){
  svg.select("path")
    .attr("d", path);

  //draw stars
  svg.selectAll('stars').data(starGeometry)
    .enter().append('path')
    .attr('class', 'stars')
    .attr("id", function (d,i) { return "path_" + i; })
    .attr('d', starPath)
    .style('fill', function(d){return d.properties.color})
    .style('stroke-width', .2);

  //add labels
/*
  svg.selectAll('text').data(starGeometry)
    .enter().append('text')
    .attr('class', 'names')
    .attr('x', function(d){ return projection(d.coordinates)[0]+8; })
    .attr('y', function(d){ return projection(d.coordinates)[1]+8; })
    .text(function(d){
      return d.properties.name; })
    .attr('fill', 'white');
*/

  svg.selectAll("text")
                .data(starGeometry)
                .enter()
            .append("text")
                .attr("x", 0)
                .attr("dy", -6)
                .style("pointer-events", "none")
               .append("textPath")
            .attr("xlink:href", function (d,i) { return "#path_" + i; })
            .text(function (d,i) { return d.properties.name; })
            .style('fill', 'white')
            .style('font-size', 3)
            .style("pointer-events", "none");


  //draw boundaries
  svg.selectAll('boundaries').data(boundsGeometry)
    .enter().append('path')
    .attr('class', 'boundaries')
    .attr('d', path)
    .style('fill', 'none')
    .style('stroke', '#ffff80')
    .style('opacity', 0.3)

  //draw lines
  svg.selectAll('lines').data(linesGeometry)
    .enter().append('path')
    .attr('class', 'lines')
    .attr('d', path)
    .style('stroke', '#098bdc')
    .style('fill', 'none')
}

//process data
function processData(error, hyg, bounds, lines){
  //process stars
  hyg.forEach(function(d){
    //translate color index to rgb
    var starColor = d3.scale.linear()
                      .domain([-1, -0,17, 0.15, 0.44, 0.68, 1.15, 2])
                      .range(["#99d6ff", "#ccebff", "#ffffff", "#ffffcc", "#ffff99", "#ffb380", "#ff6666"])
    //filter stars by magnitude
    if(d.mag < minMag){
      starGeometry.push({
        type: "Point",
        coordinates: [-d.ra*15, d.dec],
        properties:{
          color: starColor(d.ci),   //big time sink, change directly in database if no other solution found
          mag: d.mag,
          name: d.proper,
          //distance: d.dist
        }
      })
    }//magnitude filter end
  })//hyg foreach end

  //boundaries data
  bounds.boundaries.forEach(function(d){
    d.shift();
    var points = [];
    for(var i=0;i<d.length;i+=2){
      points.push([-d[i],d[i+1]]);
    }

    boundsGeometry.push({
      type: "LineString",
      coordinates: points
    });
  })//boundaries data render
  //lines data
  lines.features.forEach(function(d){
    let points = d.geometry.coordinates.map(function(d){
      return (
      d.map(function(x){
        var p =[-x[0], x[1]];
        return p;
      }))
    })
    linesGeometry.push({
      type: "MultiLineString",
      coordinates: points
    })
  })
//console.log(boundsGeometry);
//console.log(linesGeometry);
//console.log(starGeometry);
  //process lines
mapRender();
}
