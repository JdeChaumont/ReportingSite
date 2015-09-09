//*****************************************************************************************************
//The regionalMap function accepts an object specifying parameters for the map
//Taking this it then grabs the topojson data to draw the D3 map of Ireland and sets
//all the event functions for each level of the map. It also contains the inverse Mercator 
//projection code used to attach the D3 map to the Leaflet map. 
//
//It returns a reference to the map it has created.
//
//In essence it functions as a small library that takes in a settings object and
//then renders a fully event-handled D3 map in the browser and returns a handle
//to that map for outside code. Javascript closure hides the implementation details
//from outside code. 
//
//
//Note: D3 is simply capable to generating a collection of svgs to render the map directly 
//from topojson data. The functionality to actually create the map confined to the "draw" 
//subfunction of regionalMap. The rest of the regionalMap function sets up the events for components
//of the map
//
//Bottom: Encapsulates the creation and functionality of the d3 map, as well as its interaction with
//the leaflet map
//*****************************************************************************************************
function regionalMap(o) {
    //ret will store the map object itself, and is the object returned to returned to the caller as a
    //reference to the map.
    var ret = {};
    var o;
    var centered = null;
    var x, y, centroid, l;
    var path, svg, g, tooltip, transform, saleTooltip, gMap, ppr;
    var currentLevel = 0, maxLevel = 0;
    var k = 1; //zoom level
    var mapCache = {};

    //Default values for the map. An object like this can be directly read by D3 in combination with
    //topojson to quickly produce a map.
    var defaults = {
        margin: 0,
        width: 100,
        height: 137, //factor for shape of Ireland
        scale: 1200 * (137 / 85.33) * 1,//1200*(137/85.33)*1,
        projection: d3.geo.albers,
        center: [-3.8, 53.3],
        rotate: [4.4, 0],
        parallels: [52, 56]
    }

    //Used to create an object that stores the previous state of the map for the "back" button.
    function mapStateHistory() {
        var s = {};
        var history = [];
        s.save = function () {
            history.push({ "k": k, "x": x, "y": y, "l": currentLevel });
        };
        s.back = function () {
            var r = s.last();
            k = r["k"];
            x = r["x"];
            y = r["y"];
            currentLevel = r["l"];
            history.pop();
        }
        s.last = function () {
            return history[history.length - 1];
        }
        s.clear = function () {
            history = [];
        }
        return s;
    }

    //This function and the one below load the topojson data for the map into the broswer cache. 
    //getMap obtains the data for other objects at the same level. However, if the map has been
    //zoomed in, then fillMapCache is called to populate the Cache and then get the object.
    function getMap(level, selector) {
        return mapCache[selector] || fillMapCache(level, selector);
    }

    function fillMapCache(level, selector) {
        var p, b, f;
        var l = lvl(level);
        var t = l.source;
        if (l.sourceFormat === "geojson") {
            p = t[selector] || t;
            b = p;
        } else {
            f = t["objects"][selector] || t["objects"];
            p = topojson.feature(t, f).features;
            b = topojson.mesh(t, f, function (a, b) { return a !== b; });
        }
        //Add properties
        for (var i = 0; i < p.length; i++) {
            p[i]["properties"] = census2011Data[p[i]["id"]];
        }
        mapCache[selector] = { "paths": p, "borders": b }
        return (mapCache[selector]);
    }

    function initTooltip() {
        return d3.select("body")
            .append("div")
            .attr("id", "tip")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "visible")
            .text("to be defined");
    }

    var radius = d3.scale.pow().exponent(0.75)
                      .domain([0, 2e6])
                      .range([3, 15]);

    function plotPoints(id, scale) {

        //get points for electoral district
        var points = pxf.getPopulation({ "Location.ED": id }).value.sort(function (a, b) { return b.Price - a.Price; }),
          i = -1,
          n = points.length, p, c, u, uniqueCoords = {}, u, r, s = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1], [-1, 1], [1, -1]]; //uC = unique Coordinates - make global?
        var data = points;
        while (++i < n) {
            p = points[i];
            c = ret.projection([p.Location.Geo.Lng, p.Location.Geo.Lat]);
            p.x = c[0];
            p.y = c[1];
            p.radius = radius(Math.min(p.Price, 5e6));
        }

        var properties = ppr.selectAll("circle")
              .data(points, function (d) { return (d ? d._id : this._id); });
        properties.enter().append("circle")
            .attr("class", function (d, i) { return "ppr"; }) //console.log(i+": Price-"+d.Price+" r-"+d.radius);
        .attr("r", function (d) { return d.radius; }) //resized in rescale function
            .attr("cx", function (d) { return d.x; })
            .attr("cy", function (d) { return d.y; })
            .style("fill-opacity", function (d) { return 0.5; })
            .style("stroke", "#fff")
            //.style("fill", function(d) { return "orange"; })
            .on("mouseover", mouseoverPPR)
            .on("mousemove", resetTooltipPPR)
            .on("mouseout", mouseoutPPR)
        ;
        properties.exit().remove();

        var force = d3.layout.force()
            .nodes(points)
            .gravity(function () { return 1 / k; })
            .charge(function () { return -0.01 / k; })
            .friction(0.0)
            .on("tick", tick)
            .start();

        function tick(e) {
            properties
                .attr("cx", function (d) { return (d.x); }) //d.radius/k);})
                .attr("cy", function (d) { return (d.y); }); //d.radius/k);});
        }
    }

    function lvl(level) {
        return o.level[level || currentLevel];
    }

    function lvlId(level) {
        return " Level" + lvl(level)["id"];
    }

    //This function redraws the map based on the current state
    function drawLevel(level, selector) {

        var l, map, p, b;
        l = lvl(level);
        map = getMap(level, selector);
        p = map["paths"];
        b = map["borders"];

        gMap.append("g")
          .selectAll("path")
            .data(p)
          .enter().append("path")
            .attr("id", function (d) { return d["id"]; })  //not correct for county
            .attr("class", function (d) { return l.style.path + " " + d["id"] + lvlId(); }) //not correct for county
            .on("mouseover", mouseover)
            .on("mousemove", resetTooltip)
            .on("mouseout", mouseout)
            .on("click", clicked)
            .attr("d", path)
            .attr("style", function (d) { return ""; });

        gMap.append("path")
          .datum(b)
          .attr("d", path)
          .attr("class", l.style.border + " Level" + lvlId());
    }

    //The following two functions fill out the tip info boxes with text and numerical data.
    //fillTooltip takes an array storing a filtered version of the Census Data.
    function fillTooltip(item) {
        d3.select("#tip .zip").text(item["Name"]);
        d3.select("#tip .ineq .val").text(item["HS2011"]);
        d3.select("#tip .high .val").text(item["Unocc2011"]);
        d3.select("#tip .mid .val").text(item["Vacant2011"]);
        d3.select("#tip .low .val").text(item["PCVac2011"]);
    }

    //fillPPRTooltip takes an array representing the specific info for that property.
    function fillPPRTooltip(item) {
        d3.select("#tip_ppr .addr").text(item["Addr"]);
        d3.select("#tip_ppr .date .val").text(item["Date"]);
        d3.select("#tip_ppr .price .val").text(fd(item["Price"]));
        d3.select("#tip_ppr .fmp .val").text(item["FMP"] === "true" ? "Yes" : "No");
        d3.select("#tip_ppr .vatex .val").text(item["VAT_Ex"] === "true" ? "Yes" : "No");
        d3.select("#tip_ppr .type .val").text(item["Type"]);
        d3.select("#tip_ppr .proptype .val").text(item["Property"]["Type"]);
        d3.select("#tip_ppr .beds .val").text(item["Property"]["Bedrooms"] === 0 ? "" : item["Property"]["Bedrooms"]);
        d3.select("#tip_ppr .baths .val").text(item["Property"]["Bathrooms"] === 0 ? "" : item["Property"]["Bathrooms"]);
        d3.select("#tip_ppr .id .val").text(item["_id"]);
    }

    /*
        The folowing are the main mouse events for elements of the map
    */
    function mouseoverPPR(d) {
        highlight.call(this, d);
        var item = d3.select(this);
        var p = item[0][0].__data__;
        fillPPRTooltip(p);
        pprTooltip
          .style("display", "block");
    }

    function highlight(d) {
        var item = d3.select(this);
        stateUpdate(item, "class", "highlight", true);
        return false;
    }

    function unhighlight(d) {
        var item = d3.select(this);
        stateUpdate(item, "class", "highlight", false);
        return false;
    }

    function mouseoutPPR(d) {
        unhighlight.call(this, d);
        pprTooltip.style("display", "none");
    }

    function resetTooltipPPR(d) {
        var item = d3.select(this);
        pprTooltip
          .style("top", (event.pageY) - 10 + "px").style("left", (event.pageX + 50) + "px");
    }

    function mouseover(d) {
        highlight.call(this, d);
        var item = d3.select(this);
        var p = item[0][0].__data__.properties;
        fillTooltip(p);
        tooltip
            .style("display", "block");
        window.fetchRegionData = setTimeout(function () {
            s.setRegion(p["id"], currentLevel);
            reportUpdate();
        }, 400);
    }

    function mouseout(d) {
        unhighlight.call(this, d);
        tooltip.style("display", "none");
        clearTimeout(window.fetchRegionData);
    }

    function resetTooltip(d) {
        var item = d3.select(this);
        tooltip
          .style("top", (event.pageY) - 10 + "px").style("left", (event.pageX + 50) + "px");
    }

    function clearSubunitDetails() {
        g.selectAll(".subunit")
          .remove();
        g.selectAll(".subunit-border")
          .remove();
    }

    function clearProperties() {
        g.selectAll(".ppr")
          .remove();
    }

    function clearLevel(level) {
        g.selectAll("." + lvlId(level).trim())
          .remove();
    }

    ret.reset = function () {
        clicked();
    }

    ret.back = function () {
        clicked("zoomOut");
    }

    function resetMapParameters() {
        x = o.width / 2;
        y = o.height / 2;
        centroid = [x, y];
        k = 1;
        currentLevel = 0; //reset level
    }

    //Computes screen position of NorthEast corner of area clicked.
    //Also computes "k", a size ratio between the previous area and the new one.
    //More specifically k is scaling constant controlling how much the D3 map must be resized.
    function resizeMapParameters(d) {
        centroid = path.centroid(d);
        var bounds = path.bounds(d);
        var newWidth = 2 * Math.max(Math.abs(centroid[0] - bounds[0][0]), Math.abs(centroid[0] - bounds[1][0]));
        var newHeight = 2 * Math.max(Math.abs(centroid[1] - bounds[0][1]), Math.abs(centroid[1] - bounds[1][1]));
        k = lvl().smoothScaleMultiple(Math.min(o.width / (newWidth * 1.0), o.height / (newHeight * 1.0)), o.scale);
        x = centroid[0];
        y = centroid[1];
        centered = d;
    }

    //p is the mouse position when clicked, n is how much to increase the zoom level (always 1 in this app)
    function zoomMap(p, n) {
        k = zoomIncrement(n); //adjust scaling to zoom level
        x = p[0];
        y = p[1];
        centered = p;

        //Recalculates k for new zoom level. Calls the zoom function.
        function zoomIncrement(n) {
            var maxZoom = 19;
            return (1 << 8 + Math.min(zoom() + n, maxZoom)) / 2 / Math.PI / o.scale; //adjust scaling to zoom level
        }

        function zoom() {
            return parseInt(Math.log((k * o.scale * Math.PI * 2) >> 8) / Math.LN2); //determine closest integer zoom level
        }
    }

    //This function handles the actual zoom in process on the D3 map.
    function resizeMap(d, properties) {
        g.transition()
          .duration(250)
          .attr("transform", "translate(" + o.width / 2 + "," + o.height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");
        o.eventHandlers.onRescale(g, k, l);
    }

    //Determines what action to perform on the map based on the current level, i.e. either "zoom" or "displacing + zoom"
    function mapAction(d) {
        var pathLevel = (function (level) {
                                if (level === "ED") {
                                    return 1;
                                }
                                if (level === "SA") {
                                    return 2;
                                }
                                return 0;
                            })(d["properties"]["Level"]);
        
        if (currentLevel === maxLevel && pathLevel === currentLevel) {
            return "zoomAll";
        }
        if (pathLevel === (currentLevel - 1)) {
            return "movePolygon";
        }
        return "zoomPolygon";
    }

    //Sets all variables controlling current map level, data, e.t.c. back to their initial properties
    //Used with the reset button.
    function resetMapFeatures() {
        if (currentLevel === 0) {
            clearSubunitDetails();
            var item = d3.select("#mapCurtain");
            item.classed("off", false);
        }
        if (currentLevel === 1) {
            var item = d3.select("#mapCurtain");
            item.classed("off", false);
        }
        if (currentLevel < maxLevel) {
            clearProperties();
            clearLevel(currentLevel + 1)
        }
    }

    //Main function that is called when any map area is clicked
    function clicked(d) {
        //d represents the D3 area that has been clicked
        var action;
        if (!d) {
            //The "reset map" button calls this function without passing in a d value
            //Clears history, returns map to original state, centers the map (setRegion), and 
            //makes a call to reset the table (reportUpdate)
            ret.history.clear();
            resetMapParameters();
            resetMapFeatures();
            s.setRegion('_', 0);
            reportUpdate();
        } else if (!d["properties"]) {
            //The "back" button passes in a d value that is just a name, with no properties field
            ret.history.back(); //loads in previous parameters to the state variable, "o"
            resetMapFeatures(); //changes map to correspond to settings in "o"
        } else {
            //The following code executes if an actual map area is clicked. We call the mapAction function to
            //determine what to do.
            action = mapAction(d);
            //zoomAll -> Used at SA level to zoom in on the same SA area
            if (action === "zoomAll") {
                //save current state before zoom, but only at current zoom
                if (ret.history.last()["l"] < currentLevel) { ret.history.save(); }; 
                zoomMap(d3.mouse(this), 1); //zoom map by 1 level centred on point clicked
            } else {
                //movePolygon -> used at the SA level to move to another SA area
                if (action === "movePolygon") {
                    clearLevel(currentLevel);
                } else {
                    //Zooms between County -> ED, ED -> SA.
                    //Save previous state, calculate zoom in parameter
                    ret.history.save();
                    currentLevel = Math.min(currentLevel + 1, maxLevel);
                }
                //Calculate new map paramters and perform the zoom
                resizeMapParameters(d);
                drawLevel(currentLevel, d.id);
            }
        }
        l = lvl();
        //Here we calculate the zoom in on the Leaflet map
        var item = d3.select("#mapCurtain");
        attrUpdate(item, "class", "off", l.showBackgroundMap);

        if (l.showBackgroundMap) {
            //We compute an object which stores the Long-Lat limits of the area we have selected to zoom in on.
            //These are calculated by using D3's inverse mercator projection to map screen coordinates to Long/Lat.
            var b = scaledProjectionBounds(x, y, ret.projection, k, o.width, o.height);
            if (b.N < 54.4) {
                var southWest = new L.LatLng(b.S, b.W);
                var northEast = new L.LatLng(b.N, b.E);
            } else { //D3's Mercator projection becomes slightly inaccurate above Sligo, constants determined using NDSFutility library
                if (b.N < 55.2) {
                    var southWest = new L.LatLng(b.S + 0.004, b.W);
                    var northEast = new L.LatLng(b.N - 0.005, b.E);
                } else {
                    var southWest = new L.LatLng(b.S + 0.04, b.W + 0.04);
                    var northEast = new L.LatLng(b.N - 0.04, b.E - 0.04);
                }

            }
            //The Long/Lat of the main diagonal are stores in the bound variable and Leaflet zooms in until the map encompasses
            //that boundary.
            var bounds = new L.LatLngBounds(southWest, northEast);
            mapL.fitBounds(bounds);
        }

        //The D3 map is then resized.
        resizeMap(d);
        if (action !== "zoomAll" && currentLevel === maxLevel) { plotPoints(d.id, k); }

        g.selectAll(".ppr") //could access properties
          .attr("r", function (d) { return radius(Math.min(d.Price, 5e6)) / k })
          .style("stroke-width", 0.5 / k);
    }

    //This function computes the Long/Lat limits of the D3 box, to be used with the Leaflet map.
    function scaledProjectionBounds(x, y, projection, scaleFactor, width, height) {
        var k = scaleFactor, p = projection;
        var N, S, E, W;
        var centroid = p.invert([x, y]);
        var original = p.invert([width / 2, height / 2]);
        var o = p.invert([0, 0]);
        W = (k * centroid[0] - original[0] + o[0]) / k;
        N = (k * centroid[1] - original[1] + o[1]) / k;
        E = 2 * centroid[0] - W;
        S = 2 * centroid[1] - N;
        return { N: N, S: S, E: E, W: W };
    }

    /******************************************************************
    This is the function which initialises the map

    *******************************************************************/
    ret.init = function (options) {

        // Extend defaults
        var extended = defaults;
        for (var prop in options) {
            if (options.hasOwnProperty(prop)) {
                extended[prop] = options[prop];
            }
        }
        o = ret.options = extended; //var o used for shorthand

        o.width = d3.select("#" + o.container)[0][0].clientWidth - o.margin;
        o.height = o.width * 1.37;
        o.scale = 700 * (o.height / 85.33) * 1;
        maxLevel = o.level.length - 1;

        ret.projection = d3.geo.mercator()
          .center(o.center)
          .scale(o.scale)
          .rotate(o.rotate)
          .translate([o.width / 2, o.height / 2]);

        tooltip = d3.select("#tip");
        pprTooltip = d3.select("#tip_ppr");

        var l = o.level[0]; //draw from first level of map

        path = d3.geo.path()
            .projection(ret.projection)
            .pointRadius(2);

        svg = d3.select("#" + o.container).append("svg")
            .attr("width", o.width)
            .attr("height", o.height);

        svg.append("rect")
            .attr("class", "background")
            .attr("width", o.width)
            .attr("height", o.height)
            .on("click", clicked);

        g = svg.append("g");

        gMap = g.append("g");

        ppr = g.append("g") //appending to g as translation already performed here //could make properties global
            .attr("class", "ppr_sales");

        //Level specific
        drawLevel(0, "IE");

        ret.o = o;
        ret.history = mapStateHistory();

        return ret;
    }

    return ret.init(o);
}
