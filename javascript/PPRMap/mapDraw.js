//*******************************************************************************
//Module Template - not used just a template
//*******************************************************************************
function moduleTemplate(o) {
    var ret = {};

    var defaults = {

    }

    ret.init = function (options) {

        // Extend defaults
        var extended = defaults;
        for (var prop in options) {
            if (options.hasOwnProperty(prop)) {
                extended[prop] = options[prop];
            }
        }
        var o = ret.options = extended; //var o used for shorthand

        return ret;
    }

    ret.update = function () {

    }

    return ret.init(o);
}

//*******************************************************************************
//Module Template - not used just a template
//*******************************************************************************
function regionalMap(o) {
    var ret = {};
    var o;
    var centered = null;
    var x, y, centroid, l;
    var path, svg, g, tooltip, transform, saleTooltip, gMap, ppr;
    var currentLevel = 0, maxLevel = 0;
    var k = 1; //zoom level
    var mapCache = {};

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
        //initialise
        return s;
    }

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
        o.scale = 700 * (o.height / 85.33) * 1;//(1 << 8 + 7) / 2 / Math.PI;
        maxLevel = o.level.length - 1;

        ret.projection = d3.geo.mercator()
          .center(o.center)
          .scale(o.scale)
          .rotate(o.rotate)
          .translate([o.width / 2, o.height / 2]);

        tooltip = d3.select("#tip");
        pprTooltip = d3.select("#tip_ppr");
        draw();

        ret.o = o;
        ret.history = mapStateHistory();

        return ret;
    }

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

    function draw() {

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
    }

    function hex() {

        var points = dataPPR.map(function (e, i) { return ret.projection([e.Location.Geo.Lng, e.Location.Geo.Lat]) });

        var color = d3.scale.linear()
            .domain([0, 20])
            .range(["white", "steelblue"])
            .interpolate(d3.interpolateLab);

        var hexbin = d3.hexbin()
            .size([o.width, o.height])
            .radius(14);

        var opacity = d3.scale.linear()
            .domain([0, 1000])
            .range([0, 1])
            .interpolate(d3.interpolateNumber);

        var hexagon = svg.append("g")
            .attr("class", "hexagons")
          .selectAll("path")
            .data(hexbin(points))
          .enter().append("path")
            .attr("d", hexbin.hexagon(14))
            .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; })
            .style("fill", function (d) { return color(d.length); });
    }


    var radius = d3.scale.pow().exponent(0.75)
                      .domain([0, 2e6])
                      .range([3, 15]);

    function rescalePropertySales() {
        g.selectAll(".ppr") //could access properties
          .attr("r", function (d) { return radius(Math.min(d.Price, 5e6)) / k })
          .style("stroke-width", 0.5 / k);
    }

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


        function collide(jitter) {
            return function (d) {
                return data.forEach(function (d2) {
                    var distance, minDistance, moveX, moveY, x, y, random, quadrant;
                    if (d !== d2) {
                        x = (d.x - d2.x);
                        y = (d.y - d2.y);
                        distance = Math.sqrt(x * x + y * y);
                        minDistance = (d.radius + d2.radius) / k;
                        if (distance < minDistance) {
                            if (distance === 0) {
                                distance = minDistance * jitter;
                                random = Math.random();
                                quadrant = Math.random < 0.5 ? -1 : 1;
                                moveX = distance * random;
                                moveY = Math.sqrt(2 * (distance * random) * (random * random)) * quadrant;
                            } else {
                                distance = (distance - minDistance) / distance * jitter;
                                moveX = x * distance;
                                moveY = y * distance;
                            }
                            d.x -= moveX;
                            d.y -= moveY;
                            d2.x += moveX;
                            d2.y += moveY;
                        }
                    }
                });
            };
        };


        function collide2(jitter) {
            return function (d) {
                return data.forEach(function (d2) {
                    var distance, minDistance, moveX, moveY, x, y, random, quadrant;
                    if (d !== d2) {
                        x = (d.x - d2.x);
                        y = (d.y - d2.y);
                        distance = Math.sqrt(x * x + y * y);
                        minDistance = (d.radius + d2.radius) / k;
                        if (distance < minDistance) {
                            distance = (distance - minDistance) / distance * jitter;
                            moveX = x * distance;
                            moveY = y * distance;
                        }
                        d.x -= moveX;
                        d.y -= moveY;
                        d2.x += moveX;
                        d2.y += moveY;
                    }
                });
            };
        };

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
                //.each(collide2(0.5))
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

    function drawLevel(level, selector) {

        var l, map, p, b;
        l = lvl(level);
        //console.log("Level:" + level + " Selector:" + selector);
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

    function fillTooltip(item) {
        d3.select("#tip .zip").text(item["Name"]);
        d3.select("#tip .ineq .val").text(item["HS2011"]);
        d3.select("#tip .high .val").text(item["Unocc2011"]);
        d3.select("#tip .mid .val").text(item["Vacant2011"]);
        d3.select("#tip .low .val").text(item["PCVac2011"]);
    }

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

    function mouseoverPPR(d) {
        highlight.call(this, d);
        var item = d3.select(this);
        var p = item[0][0].__data__;
        fillPPRTooltip(p);
        pprTooltip
          .style("display", "block");
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

    //function to structure data for current view
    function setViewData() {
        //Level will determine which level is taken
        var dataSales = dataPPR_Cty_Ed_SA;
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
        //fetchRegionData();
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

    function selSubMap(d, k) {
        drawLevel(currentLevel, d.id);
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

    function getPathLevel(level) {
        if (level === "ED") {
            return 1;
        }
        if (level === "SA") {
            return 2;
        }
        return 0;
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

    function zoomMap(p, n) {
        k = zoomIncrement(n); //adjust scaling to zoom level
        x = p[0];
        y = p[1];
        centered = p;
    }

    function zoomIncrement(n) {
        var maxZoom = 19;
        return (1 << 8 + Math.min(zoom() + n, maxZoom)) / 2 / Math.PI / o.scale; //adjust scaling to zoom level
    }

    function zoom() {
        return parseInt(Math.log((k * o.scale * Math.PI * 2) >> 8) / Math.LN2); //determine closest integer zoom level
    }

    function resizeMap(d, properties) {
        g.transition()
          .duration(250)
          .attr("transform", "translate(" + o.width / 2 + "," + o.height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");
        o.eventHandlers.onRescale(g, k, l);
    }

    function mapAction(d) {
        var pathLevel = getPathLevel(d["properties"]["Level"]);
        if (currentLevel === maxLevel && pathLevel === currentLevel) {
            return "zoomAll";
        }
        if (pathLevel === (currentLevel - 1)) {
            return "movePolygon";
        }
        return "zoomPolygon";
    }

    function resetMapFeatures() {
        if (currentLevel === 0) {
            clearSubunitDetails();
        }
        if (currentLevel < maxLevel) {
            clearProperties();
            clearLevel(currentLevel + 1)
        }
    }

    function clicked(d) {
        //console.log(d);
        var action;
        if (!d) {
            //no polygon or parameter - reset map
            ret.history.clear();
            resetMapParameters();
            resetMapFeatures();
            s.setRegion('_', 0);
            reportUpdate();
        } else if (!d["properties"]) {
            //zoom out
            ret.history.back(); //unwind to last saved position
            resetMapFeatures();
        } else {
            //polygon with properties has been provided
            action = mapAction(d);
            if (action === "zoomAll") {
                if (ret.history.last()["l"] < currentLevel) { ret.history.save(); }; //save at SA
                zoomMap(d3.mouse(this), 1); //zoom map by 1 level centred on point clicked
            } else {
                if (action === "movePolygon") {
                    clearLevel(currentLevel);
                } else {
                    ret.history.save();
                    currentLevel = Math.min(currentLevel + 1, maxLevel);
                }
                resizeMapParameters(d);
                selSubMap(d, k);
            }
        }
        l = lvl();
        mapCurtain(l.showBackgroundMap);
        if (l.showBackgroundMap) {
            //Find edges and call map.fitBounds()
            var p = path.bounds(d);
            // console.log("Path Bounds inverted: WN" + ret.projection.invert([p[0][0],p[0][1]]) + " ES: " + ret.projection.invert([p[1][0],p[1][0]]));
            var b = scaledProjectionBounds(x, y, ret.projection, k, o.width, o.height);
            var southWest = new L.LatLng(b.S, b.W);
            var northEast = new L.LatLng(b.N, b.E);
            var bounds = new L.LatLngBounds(southWest, northEast);
            mapL.fitBounds(bounds);
        }
        resizeMap(d);
        if (action !== "zoomAll" && currentLevel === maxLevel) { plotPoints(d.id, k); }
        rescalePropertySales();
    }

    function scaledProjectionBounds2(centroid, projection, width, height) {
        var p = projection;
        var WN = p.invert([centroid[0] - width / 2, centroid[1] - height / 2]);
        var ES = p.invert([centroid[0] + width / 2, centroid[1] + height / 2]);
        return { N: WN[1], S: ES[1], E: ES[0], W: WN[0] };
    }

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

    function mapCurtain(off) {
        var item = d3.select("#mapCurtain");
        attrUpdate(item, "class", "off", off);
    }

    return ret.init(o);
}

function mouseover(d) {
    highlight.call(this, d);
    var item = d3.select(this);
    var p = item[0][0].__data__.properties;
    tooltip
      .style("display", "block")
      .text(p.COUNTYNAME);
}

function mouseout(d) {
    unhighlight.call(this, d);
    tooltip.style("display", "none");
}

function mousemoved(d) {
    var item = d3.select(this);
    tooltip
      .style("top", (event.pageY) - 10 + "px").style("left", (event.pageX + 10) + "px");
}



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
          eventHandlers: { mouseover: highlight, mouseout: unhighlight, mousemove: mousemoved },
          showBackgroundMap: false,
          smoothScaleMultiple: function (k) { return k; }
      },
      {
          description: "electoralDistricts",
          //source : mapElectoralDistrictsbyCounty,
          source: mapED, //this should perhaps be text to support asynchronous approach
          sourceFormat: "topojson",
          id: "CSOED",
          name: "EDNAME",
          style: { path: "subunit", border: "subunit-border", label: "subunit-label" },
          eventHandlers: { mouseover: highlight, mouseout: unhighlight, mousemove: mousemoved },
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
          eventHandlers: { mouseover: highlight, mouseout: unhighlight, mousemove: mousemoved },
          showBackgroundMap: true,
          smoothScaleMultiple: function (k, scale) {
              var zoom = parseInt(Math.log((k * scale * Math.PI * 2) >> 8) / Math.LN2);
              return (1 << 8 + zoom) / 2 / Math.PI / scale;
          }
      }
    ],
    eventHandlers: {
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

function loadCensusData(dsvFile, delimiter) { //use | to parse
    //var dsv = d3.dsv(delimiter, "text/plain");
    var dsv = d3.dsv(delimiter, "text/plain");
    var csv = dsv.parse(dsvFile, function (d) {
        return {
            "Level": d["Level"],
            "id": d["id"],
            "Name": d["Name"],
            "Parent": d["Parent"],
            "Male2011": +d["Male2011"],
            "Female2011": +d["Female2011"],
            "Total2011": +d["Total2011"],
            "PPOcc2011": +d["PPOcc2011"],
            "Unocc2011": +d["Unocc2011"],
            "HS2011": +d["HS2011"],
            "Vacant2011": +d["Vacant2011"],
            "PCVac2011": +d["PCVac2011"]
        }
    }, function (error, rows) {
        console.log(rows);
    });
    return csv;
}

var census2011DataArray = loadCensusData(dataCensus2011, "|");
//console.log(census2011DataArray[0]);
var census2011Data = {};
for (var i = 0; i < census2011DataArray.length; i++) {
    census2011Data[census2011DataArray[i]["id"]] = census2011DataArray[i];
}
//console.log(census2011Data["10"]);
var map = regionalMap(mapOptions);

$(function () {
    $('#mapReset').on('click', function (e) {
        map.reset();
    });
});
$(function () {
    $('#mapBack').on('click', function (e) {
        map.back();
    });
});
//Send in a projection
//Send in id's
//Send

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

function subunitHighlight(d) {
    var item = d3.select(this);
    stateUpdate(item, "class", "highlight", true);
    return false;
}

function subunitUnhighlight(d) {
    var item = d3.select(this);
    stateUpdate(item, "class", "highlight", false);
    return false;
}

//Helper functions - outside object
function stateUpdate(items, attr, attrPartValue, add) {
    items.each(function (d, i) {
        var item = d3.select(this);
        attrUpdate(item, attr, attrPartValue, add);
    });
}

function attrUpdate(item, attr, attrPartValue, add) {
    if (add) { //amended to remove if already set to value
        item.attr(attr, function (d) { return (item.attr(attr) || "").replace(attrPartValue, "").trim() + " " + attrPartValue; })
    } else {
        item.attr(attr, function (d) { return item.attr(attr).replace(attrPartValue, "").trim(); })
    }
}