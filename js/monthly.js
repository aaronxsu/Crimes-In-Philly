var map = L.map('map', {
  center: [40.006816, -75.1193933],
  zoom: 11
});

var cartoBasemapLite = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png', {
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: 'abcd',
  minZoom: 0,
  maxZoom: 20,
  ext: 'png'
}).addTo(map);

var layerCrimesTractMonthly = L.geoJSON(crimeTractsMonthly,
{
  'style': function(featues){
    return {
      weight: 1,
      opacity: 1,
      color: '#4f4f4f',
      fillOpacity: 0,
      fillColor: 'white'
    }
  }
}).addTo(map);

console.log(crimeTractsMonthly)

var scalerBar = L.control.betterscale().addTo(map);

//------------------------------------------------------
//below code were used to calculate crime count breaks based on ckmeans
//since the map display should use the same breaks all the time
//the breaks will not be calculated on the fly - it takes time!
//------------------------------------------------------
// var crimeCounts = _.chain(crimeTractsMonthly.features)
//  .map(function(datum){
//    return _.chain(columnMapOrder)
//            .pluck('key')
//            .map(function(key){
//              return datum.properties[key]
//            })
//            .value();
//  })
//  .flatten()
//  .value();
// var clusters = ss.ckmeans(crimeCounts, 5);
// console.log(clusters)
// var breaksCrimeCountValues = _.union([_.first(_.first(clusters))], _.map(clusters, function(set){return _.last(set);}));
// console.log(breaksCrimeCountValues)
//the breaks: 0, 27, 51, 83, 141, 375

var setFillColor = function(count){
  if(count <= 27){
    return {'fillColor': '#ffffb2', fillOpacity: 0.8};
  }else if(count <= 51){
    return {'fillColor': '#fecc5c', fillOpacity: 0.8};
  }else if(count <= 83){
    return {'fillColor': '#fd8d3c', fillOpacity: 0.8};
  }else if(count <= 141){
    return {'fillColor': '#f03b20', fillOpacity: 0.8};
  }else{
    return {'fillColor': '#bd0026', fillOpacity: 0.8};
  }
}

var setLayerStyle = function(column){
  layerCrimesTractMonthly.setStyle(function(features){
    return setFillColor(features.properties[column]);
  })
};

var slide = function(){
  _.each(_.range(1, 136), function(order, i) {
    _.delay(function(){
      var object = _.chain(columnMapOrder)
                  .filter(function(datum){
                    return datum.order == order;
                  })
                  .first()
                  .value();
      $('#title-year').text(object.year);
      $('#title-month').text(monthMap[object.month.toString()]);
      setLayerStyle(object.key);
    }, i * 500)
  });
};

$(function(){

  $('#play').click(function(e){
    slide();
  });

});
