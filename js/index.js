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

//------------------------------------------------------
//               Basic Utillities
//------------------------------------------------------
//an array of years from 2009 to 2017 in string
var yearsString = _.map(_.range(2009, 2017), function(num){return num.toString();});
//an array of column names of the geoJSON data that store number of crimes in each year
var columnCrimeYears = _.map(_.range(2009, 2017), function(num){return "crime"+num;})
//an object, keys are the year string, values are the corresponding column names
var yearColumnMap = _.object(yearsString, columnCrimeYears)

//------------------------------------------------------
//            Dynamic crime count breaks
//------------------------------------------------------
//an object of crime count breaks of each year, based on ckmeans clustering
//like: {crime2009: array of breaks, ...}
var crimeCountsBreaksYear = _.object(_.map(columnCrimeYears, function(crimeYear){
  var values = _.pluck(_.pluck(crimesTract.features, 'properties'), crimeYear);
  var clustered = ss.ckmeans(values, 5);
  var breaks = _.map(clustered, function(set){
    return _.last(set);
  })
  breaks = _.union([_.first(_.first(clustered))], breaks);
  return [crimeYear, breaks]
}))

//all values of crime count columns from 2009 to 2016
var crimeCountValues = _.chain(columnCrimeYears).map(function(crimeYear){
  return _.chain(crimesTract.features)
          .pluck('properties')
          .pluck(crimeYear)
          .value()
})
.flatten()
.value()

//------------------------------------------------------
//          Static crime count breaks
//------------------------------------------------------
var clusteredCrimeCountValues = ss.ckmeans(crimeCountValues, 5);
var breaksCrimeCountValues = _.union([_.first(_.first(clusteredCrimeCountValues))], _.map(clusteredCrimeCountValues, function(set){return _.last(set);}));

//------------------------------------------------------
//    set census tract fill color
//    based on dynamic crime count breaks
//------------------------------------------------------
var setFillColorDynamic = function(column, count){
  var breaks = _.without(crimeCountsBreaksYear[column], _.first(crimeCountsBreaksYear[column]), _.last(crimeCountsBreaksYear[column]));
  return setFillColorStatic(breaks, count)
}

//------------------------------------------------------
//    set census tract fill color
//    based on static crime count breaks
//------------------------------------------------------
var setFillColorStatic = function(breaks, count){
  if(count <= breaks[0]){
    return {'fillColor': '#edf8fb', fillOpacity: 0.8};
  }else if(count <= breaks[1]){
    return {'fillColor': '#b3cde3', fillOpacity: 0.8};
  }else if(count <= breaks[2]){
    return {'fillColor': '#8c96c6', fillOpacity: 0.8};
  }else if(count <= breaks[3]){
    return {'fillColor': '#8856a7', fillOpacity: 0.8};
  }else{
    return {'fillColor': '#810f7c', fillOpacity: 0.8};
  }
}

//------------------------------------------------------
//    set census tract layer style
//    according to static or dynamic classes
//------------------------------------------------------

var setLayerStyle = function(year){
  layerCrimesTract.setStyle(function(features){
    if($('#option-1').prop('checked')){
      var breaks = _.without(breaksCrimeCountValues, _.first(breaksCrimeCountValues));
      return setFillColorStatic(breaks, features.properties[yearColumnMap[year.toString()]]);
    }else if($('#option-2').prop('checked')){
      return setFillColorDynamic(yearColumnMap[year.toString()], features.properties[yearColumnMap[year.toString()]]);
    }
  })
}

//------------------------------------------------------
//    when the mouse is over a census tract, highlight
//    and show crime count
//    when the mouse moves out of a census tract,
//    set style back to normal
//------------------------------------------------------
var setLayerMouseMove = function(year){
  layerCrimesTract.eachLayer(function(layer){
    layer.on('mouseover', function(e){
      e.target.setStyle({
        weight: 3,
        color: '#666',
        fillOpacity: 1
      });
      var tooltip = 'Crimes: ' + e.target.feature.properties[yearColumnMap[year.toString()]].toString()
      e.target.bindTooltip(tooltip).openTooltip();
    }).on('mouseout', function(e){
      e.target.setStyle({
        weight: 1,
        color: '#4f4f4f',
        fillOpacity: 0.8
      });
    });
  })
}

//------------------------------------------------------
//              set dynamic legend text
//------------------------------------------------------
var setLegendTextDynamic = function(year){
  var breaks = crimeCountsBreaksYear[yearColumnMap[year.toString()]];
  setLegendTextStatic(breaks)
}

//------------------------------------------------------
//              set static legend text
//------------------------------------------------------
var setLegendTextStatic = function(breaks){
  _.each(_.range(0, 5), function(number){
    $('#legend-text-'+ (number+1).toString()).text(breaks[number].toString() + ' - ' + breaks[number + 1].toString())
  })
};

//------------------------------------------------------
//              the slide function
//------------------------------------------------------
var slide = function(){
  _.each(_.range(2009, 2017), function(year, i) {
    _.delay(function(){
      $('#year-slider').val(year);
      $('#year-slider').click();
      $('#title-year').text(year);
      setLayerStyle(year);
      if($('#option-2').prop('checked')){
        setLegendTextDynamic(year);
      }else if($('#option-1').prop('checked')){
        setLegendTextStatic(breaksCrimeCountValues);
      }
    }, i * 800)
  });
}

var layerCrimesTract = L.geoJSON(crimesTract,
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

var scalerBar = L.control.betterscale().addTo(map);

$(function(){

  $('#div-slider').hide();

  $('#switches').on('change', function(e){
    $('#div-slider').show();
  })

  $('#play').click(function(e){
    slide();
  });

  $('#year-slider').on('input', function(){
    $('#title-year').text($(this).val());
    setLayerStyle($(this).val());
    setLayerTooltip($(this).val());
    setLayerMouseMove($(this).val());
    if($('#option-1').prop('checked')){
      setLegendTextStatic(breaksCrimeCountValues);
    }else if($('#option-2').prop('checked')){
      setLegendTextDynamic($(this).val());
    }
  })

});
