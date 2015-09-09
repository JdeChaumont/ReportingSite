//************************************************************************************************************************
//The regionalMap function functions as a mini-library from which the map can be initialised, as mentioned previously.
//
//In this script, we actually initialise the D3 map using regionalMap. We first define the events and settings objects which 
//regionalMap requires to set up the map.
//
//We then initialise
//************************************************************************************************************************



//*******************************************************************************************************
//Leaflet initialisation
//*******************************************************************************************************
//mp holds the default centre point and initial zoom level of the map
var mp = {};
mp.centre = [53.3, -8.2];
mp.zoom = 7;

/*
 * Note: L is the object storing all functions within the Leaflet library. Similar to $ for
 *          jQuery and d3 for d3.
 */

//The L.map('str') function attaches a map to the div element with name 'str'
//This map then has its initial centre and zoom level set with "setView"
//A reference to the map is then stored in the mapL variable.
var mapL = L.map('map', { zoomControl: false }).setView(mp.centre, mp.zoom);

//The tileLayer function attaches a specific world map image (ours taken from
// tile.osm.org) and attaches certain properties to, in our case we only set its 
// maximum zoom level.
// We then add this image, with these settings to our map.
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(mapL);




//*******************************************************************************************************************
//D3 map initialisation
//*******************************************************************************************************************
var mapOptions = {
    container: "regionalMap", //container should determine height/width
    level: [
      {
          description: "adminCounties",
          source: mapAdminCty, //this should perhaps be text to support asynchronous approach
          sourceFormat: "topojson",
          id: "COUNTY",
          name: "COUNTYNAME",
          style: { path: "county", border: "county-border", label: "county-label" },
          showBackgroundMap: false,
          smoothScaleMultiple: function (k) { return k; }
      },
      {
          description: "electoralDistricts",
          source: mapED, //this should perhaps be text to support asynchronous approach
          sourceFormat: "topojson",
          id: "CSOED",
          name: "EDNAME",
          style: { path: "subunit", border: "subunit-border", label: "subunit-label" },
          showBackgroundMap: false,
          smoothScaleMultiple: function (k) { return k; }
      }, //each level needs selector from previous level
      {
          description: "smallAreas",
          source: mapSA, //this should perhaps be text to support asynchronous approach
          sourceFormat: "topojson",
          id: "SMALL_AREA",
          name: "SMALL_AREA",
          style: { path: "subunit", border: "subunit-border", label: "subunit-label" },
          showBackgroundMap: true,
          smoothScaleMultiple: function (k, scale) {
              var zoom = parseInt(Math.log((k * scale * Math.PI * 2) >> 8) / Math.LN2);
              return (1 << 8 + zoom) / 2 / Math.PI / scale;
          }
      }
    ],
    eventHandlers: {
        //onRescale redraws the maps border lines and changes the opacity of D3 map to allow a view of the Leaflet map.
        onRescale: function (g, k, l) {
            g.selectAll(".county-border")
              .style("stroke-width", 1.0 / k + "px");
            g.selectAll(".subunit-border")
              .style("stroke-width", 1.0 / k + "px");
            if (l.showBackgroundMap === true) {
                g.selectAll(".LevelCOUNTY")
                  .style("fill-opacity", 0.1);
                g.selectAll(".LevelCSOED")
                  .style("fill-opacity", 0.2);
            } else {
                g.selectAll(".LevelCOUNTY")
                  .style("fill-opacity", 1.0);
                g.selectAll(".LevelCSOED")
                  .style("fill-opacity", 1.0);
            }
        }
    }
}

var map = regionalMap(mapOptions);

//Sets the click event for the "reset" and "back" buttons on the map
d3.select('#mapReset').on('click', function (e) {map.reset();});
d3.select('#mapBack').on('click', function (e) {map.back();});