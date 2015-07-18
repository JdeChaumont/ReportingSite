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