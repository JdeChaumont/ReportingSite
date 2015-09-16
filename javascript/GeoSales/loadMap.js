//*******************************************************************************
//Initialisation
//
//Here we load the app using the functions above. 
//*******************************************************************************
//Grab initial data and set the Dashboard to display it.
state.initData();
var dataByCounty = state.orderDataByCounty();
dashboardHandler.updateDash();
dashboardHandler.highlightDash();

//Create the main map
var map = mainMap({
    container: "#map",
    datasource: irl
});

//Create the map legend
var smd = mapLegend({ //will be smd
    container: "#map",
    canvas: "svg"
});

//Create the histogram charts
var chart = chart({
    container: "#chart",
    canvas: "svg",
    height: map.options.height
});

//Binds the onHashChange function to the window.hashchange event. This allows the app to switch between variables via the URL.
window.addEventListener("hashchange", URIcontroller.uriChange);

//Initialises the URI to the starting variable choices, and as a consequence starts the
//map, charts and dashboard with those quantities.
URIcontroller.mapChange({ portfolio: 0, measure: 0, county: "All" });