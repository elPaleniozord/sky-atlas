//define basic map parameters
var width = document.documentElement.clientWidth,
    height = width/2,
    tx = 0, ty = 0,
    scale = 1,
    rotate=[0,0];

//initialize projection - stereographic = inside of a ball
var projection = d3.geo.stereographic()
    .scale(600)                       //overall scale factor
    .clipAngle(120)                    //clipping circle radius
    .translate([width/2, height/2])

var path = d3.geo.path()              //path generator function
    .projection(projection);

//initialize svg element
var svg = d3.select('.atlas').append("svg")
    .attr("width", width)
    .attr("height", height)
    .on('wheel.zoom', scrollZoom)  //zoom function
    .attr('transform', `translate(${tx}, ${ty}) scale(${scale})`);

var radius = d3.scale.linear()
    .domain([-1, 5])
    .range([4, 1.5]);

svg.append("path")
    .attr("class", "graticule")
    .datum(d3.geo.graticule()
  .step([8,8]));

svg.append("g")   //group
    .attr("class", "stars");
svg.append("g")
    .attr("class", "lines");

//parse data
queue()
  .defer(d3.csv, "https://gist.githubusercontent.com/elPaleniozord/433b888e3ed64da651f18d5c60682c8a/raw/76e8fa3fe6eb6aaf93154927788ecf6fd47e240c/hyg_data.csv")
  .defer(d3.json, "https://gist.githubusercontent.com/elPaleniozord/bb775473088f3f60c5f3ca1afeb88a82/raw/66a84de978c8c787916cb363894a8da6b62bb915/bounds.json")
  .defer(d3.json, "https://gist.githubusercontent.com/elPaleniozord/ed1dd65a955c2c7e1bb6cbc30feb523f/raw/9f2735f48f6f477064f9e151fe73cc7b0361bf2e/lines.json")
  .await(mapRender);

starGeometry=[];
//process data
function mapRender(hyg, bounds, lines){
  //colors
  //filter magnitude
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
}
//map render
console.log(starGeometry);
