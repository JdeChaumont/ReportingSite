//******************************************************************************************
//Helper functions
//******************************************************************************************

//Helper functions from http://phrogz.net/fewer-lambdas-in-d3-js
// Create a function that returns a particular property of its parameter.
// If that property is a function, invoke it (and pass optional params).
function lam(name) {
    var v, params = Array.prototype.slice.call(arguments, 1);
    return function (o) {
        return (typeof (v = o[name]) === 'function' ? v.apply(o, params) : v);
    };
}

//A function which updates the properties of a given D3 object.
function stateUpdate(items, attr, attrPartValue, add) {
    items.each(function (d, i) {
        var item = d3.select(this);
        if (add) {
            item.attr(attr, function (d) { return (item.attr(attr) || "").trim() + " " + attrPartValue; })
        } else {
            item.attr(attr, function (d) { return item.attr(attr).replace(attrPartValue, "").trim(); })
        }
    });
}

//***************************************************************************************************
//Functionality references
//
//Here we create variables that can be used to access the functionality of our mini-libraries
//***************************************************************************************************
var dashboardHandler = dashboardMiniLib();
var URIcontroller = URImanager();
var buttonSettings = Buttons();

//*******************************************************************************************
//Button configuration. 
//Used to set button text and events, also declares objects which link button properties to dashboard and histogram settings.
//*******************************************************************************************
function Buttons() {
    var buttonSettings = {
        //Config - The data itself uses strings like "ppr" to label fields, however the buttons which select a given data type use ordinals
        //These objects connect those values
        portfolio: { 0: "ppr", 1: "repo", 2: "avs", 3: "redeemed", 4: "ptsb", 5: "arrsFb", 6: "arrs", 7: "ninetyPlus" }, //could be arrays
        measure: { 0: "vol", 1: "avg", 2: "ofTotal", 3: "percentOf" },
        //Here we have the object that stores the buttons ordinal values and the text they display	
        pBtns: [{ name: "Price Register", value: 0 },
                                { name: "Repossessions", value: 1 },
                                { name: "Sales (shortfall)", value: 2 },
                                { name: "Sales (closed)", value: 3 },
                                { name: "All Mortgage Assets", value: 4 },
                                { name: "Forbearance or in Arrears", value: 5 },
                                { name: "Arrears", value: 6 },
                                { name: "Default (90+)", value: 7 }],

        mBtns: [{ name: "Volume", value: 0 },
            { name: "&#8364 Avg", value: 1 },
            { name: "% Total", value: 2 },
            { name: "% ...", value: 3 }]
    }

    //This function uses d3 to create a set of buttons given a Div to contain them (container), a set of values to associate with each button (btns),
    //a css class for their visual appearance (css), and an object specifying the event handlers (events)
    var createButtonSet = function (container, btns, css, events) {
        var btns = d3.select(container).selectAll('button')
            .data(btns)
        .enter().append('button')
            .attr("class", css)
            .attr("value", lam("value"))
            .html(lam("name"))
            .on("click", events.click);
    }

    //Here we have the two event handlers which alter the URI in response to portfolio and measure choices. Used in the function calls below.
    function portfolioClick(e) {
        URIcontroller.mapChange({ portfolio: this.value });
        return false;
    };

    function measureClick(e) {
        URIcontroller.mapChange({ measure: this.value });
        return false;
    };

    //Uses the function above to create a set of buittons attached to the #portfolio div, with pBtns text and values, with "btn btn-primary" visual appearance,
    //whose click event is set to fire the portfolioClick function below. Note: portfolioClick is really just a wrapper around changeAnchorPart.
    createButtonSet("#portfolio", buttonSettings.pBtns, "btn btn-primary", { click: portfolioClick });

    //Repeat the same process for the variable setting buttons.
    createButtonSet("#measure", buttonSettings.mBtns, "btn btn-primary btn-xs", { click: measureClick });

    //Attaches the sort function of the histogram charts to the sort button
    document.querySelector("#sort").addEventListener("click", function () { chart.sort(); });

    //Here we attach an event handler to the "Image" button using jQuery. The event handler itself
    //uses d3 to select the image and canvg to convert it into a static png image.
    document.querySelector('#mapToImg').addEventListener("click", function (e) {
        var html = d3.select("#ireland")
            .attr("title", "test2")
            .attr("version", 1.1)
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .node().parentNode
            .innerHTML;

        var content = html;
        var canvas = document.getElementById("map_cvs");
        canvg(canvas, content);
        var img = canvas.toDataURL("image/png");
        imgOut = d3.select('#map_img');
        imgOut.html(""); //Clear out existing
        imgOut.append("img")
            .attr("src", img);
    });

    //Attaches the slideshow executing function to the Slideshow button
    document.querySelector("#slideShow").addEventListener("click", function () {
        slideShow.run();
    });

    return buttonSettings;

};

//***************************************************************************************************************
//State managment
//
//Creates an object, "state", used to hold the current settings for the app. Specifically which portfolio and measure variables are in use,
//what county is highlighted or selected, as well as the actuall app data.
//***************************************************************************************************************
var state = {
	p : 0, //Property the portfolio variable currently in use
	m: 0,   //Stores the measure currently in use.
	//selCty stores which county is clicked and which is highlighted (by mouseover). Defaults are all clicked and none highlighted
	//clicked here freezes the dashboard to only display that county's data. When clicked = "All", the dashboard is free to respond
    //to the highlighted county.
	selCty : { "clicked" : "All", "highlight" : "" },
    //Used to update dashboard when county is selected
	add: function (cty, type) {
		state.selCty[type] = cty;
		dashboardHandler.updateDash();
	},
    //Updates dashboard when county is unselected
	remove : function(cty,type){
		state.selCty[type] = "";
		dashboardHandler.updateDash();
	},
    //Used to "deselect" a county that has been clicked.
	toggle : function(cty){
		var added = true;
		if(state.selCty["clicked"]===cty) {
				state.remove(cty,"clicked");
				added=false;
		} else {
			state.add(cty,"clicked");
			added=true;
		}
		return added; //added or updated to clicked
	},
    //Removes county selections.
	clear: function () { state.selCty = {}; }, //need to unhighlight all - select all active and clicked elements - events should run from state updates
	//Returns ordinal associated with a given portfolio variable.
	//Next function returns ordinal associated with a measure variable.
    //Both functions are used by the map and the histograms to set their properties, that is they query the state objects for the correct variables to display. 
	portfolio : function(v){ 
			if(v!==undefined){
				if(v!==state.p) {
					state.p=v;
				}
			}
			return buttonSettings.portfolio[state.p]; 
		},
	measure : function(v){ 
			if(v!==undefined){
				if(v!==state.m) {
					state.m=v;
				}
			}					
			return buttonSettings.measure[state.m];
	},
    //Returns highlighting and "clicked" settings from the selCty property.
	county : function(v){ 
			if(v!==undefined){
				if(v!==state.selCty["clicked"]) {
					state.selCty["clicked"]=v;
				}
			}					
			return state.selCty["clicked"]
		},
    //Stores the data associated with the current portfolio/measure variable choice, as well as that data's min and max. Set by the resetData function.
    //Used with the histogram charts.
	data : {},
    //Stores county values
	categories : ["Carlow", "Cavan", "Clare", "Cork", "Donegal", "Dublin", "Galway", "Kerry", "Kildare", "Kilkenny", "Laois", "Leitrim", "Limerick", "Longford", "Louth", "Mayo", "Meath", "Monaghan", "Offaly", "Roscommon", "Sligo", "Tipperary", "Waterford", "Westmeath", "Wexford", "Wicklow"], //Define this statically as adding some extra categories e.g. Ireland
    //Used when app first loads to store the initial values for state.data
	initData: function () {
		if(!state.categories.length) {
			for(cty in dataAll[state.portfolio()]){
				state.categories.push(cty);
			}
			state.categories.sort();
		}
		state.resetData();			
	},
    //Recalculates the D3 arrays associated with the map and charts for the current variable choice.
	resetData : function(){
		var series = [], data = [];
		var cat, cty, d;
		for(var i=0;i<state.categories.length;i++){
			cat = state.categories[i];
			cty = dataAll[state.portfolio()][cat];
			d =  { id : cat, vol : parseFloat(cty[state.measure()])};
			data.push(d);
			series.push(d.vol); 
		}
		state.data.series = data;
		state.data.min = d3.min(series);
		state.data.max = d3.max(series);
		state.formatter = state.data.max < 2 ? d3.format('.2%') : d3.format(',.0f');				
	},
    //Reloads the dashboard, map and charts based on current settings.
	updateApp : function(){
		state.resetData();
		chart.redrawChart();
		map.updateChoropleth(true); //should be updated from measure change
		smd.update(true);
		dashboardHandler.highlightDash();
		dashboardHandler.updateDash();
	},
    //Alters which button is selected and the "clicked" status of the counties.
	updateStateControls: function () {
	    $("#portfolio button").removeClass("active");
	    $("#measure button").removeClass("active");
	    $("#portfolioSelected").html("Selected: " + buttonSettings.pBtns[state.p].name);
	    $("#portfolio button[value=" + state.p + "]").addClass("active");
	    $("#measure button[value=" + state.m + "]").addClass("active");
		var targets = d3.selectAll(".clicked");
		stateUpdate(targets,"class","clicked",false);
		targets = d3.selectAll("#" + state.county());
		stateUpdate(targets,"class","clicked",true);
	},
	ctyVol : function(cty){
		return dataAll[state.portfolio()][cty][state.measure()];
	},
	orderDataByCounty : function(){
		var result = {};
		var cty;
		for(var i = 0;i<state.categories.length;i++){
			cty = state.categories[i];
			result[cty] = {};
			for(p in dataAll){
				result[cty][p] = dataAll[p][cty] || {};
			}
		}
		result["All"]={};
		for(p in dataAll){
			result["All"][p] = dataAll[p]["All"] || {};
		}			
		return result;
	},
	formatter : d3.format(',.0f') //default formatting for any D3 object on the page. The Dashboard has more specific ones.
};

//*********************************************************************************************************
//URI management.
//
//Here we set up the URI so that it and the variable choices (portfolio, measure, county) are connected, i.e.
//a change in one alters the other
//*********************************************************************************************************
function URImanager() {

    //anchorMap is a dummy variable used to manipulate URI settings
    var anchorMap = {};

    //anchorMapSchema is an object storing the variables (and their possible values) to display in the URI. It is immediately
    //passed to the jQuery.uriAnchor library' "configModule" function which causes the uri to be capable of displaying those values.
    //However, without the "" function below this would have no connection to the functionality of the app.
    var anchorMapSchema = {
        portfolio: {
            0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true
        },
        measure: {
            0: true, 1: true, 2: true, 3: true
        },
        county: {
            Carlow: true, Cavan: true, Clare: true, Cork: true, Donegal: true, Dublin: true, Galway: true, Kerry: true, Kildare: true, Kilkenny: true, Laois: true, Leitrim: true, Limerick: true, Longford: true, Louth: true, Mayo: true, Meath: true, Monaghan: true, Offaly: true, Roscommon: true, Sligo: true, Tipperary: true, Waterford: true, Westmeath: true, Wexford: true, Wicklow: true, All: true
        }
    };

    $.uriAnchor.configModule({
        schema_map: anchorMapSchema
    });

    //*******************************************************************************************
    //This is the main function that updates the URI in response to the button clicks.
    //*******************************************************************************************
    function changeAnchorPart(argMap) {
        var
            anchorMapRevise = $.extend(true, {}, anchorMap),
            result = true,
            k, k_dep;

        // Begin merge changes into anchor map
        KEYVAL:
            for (k in argMap) {
                if (argMap.hasOwnProperty(k)) {

                    // skip dependent keys during iteration
                    if (k.indexOf('_') === 0) { continue KEYVAL; }

                    // update independent key value
                    anchorMapRevise[k] = argMap[k];

                    // update matching dependent key
                    k_dep = '_' + k;
                    if (argMap[k_dep]) {
                        anchorMapRevise[k_dep] = argMap[k_dep];
                    }
                    else {
                        delete anchorMapRevise[k_dep];
                        delete anchorMapRevise['_s' + k_dep];
                    }
                }
            }
        // End merge changes into anchor map

        // Begin attempt to update URI; revert if not successful
        try {
            $.uriAnchor.setAnchor(anchorMapRevise);
        }
        catch (error) {
            // replace URI with existing state
            $.uriAnchor.setAnchor(anchorMap, null, true);
            result = false;
        }
        // End attempt to update URI...

        return result;
    };

    //********************************************************************************
    //Function which responds to changes in the URL, calling into the state object.
    //********************************************************************************
    function onHashchange(event) {
        var
            anchorMapPrevious = $.extend(true, {}, anchorMap),
            anchorMapProposed, stateChanged = false, toggleCty = false;

        // attempt to parse anchor
        try { anchorMapProposed = $.uriAnchor.makeAnchorMap(); }
        catch (error) {
            $.uriAnchor.setAnchor(anchorMapPrevious, null, true);
            return false;
        }
        anchorMap = anchorMapProposed;

        for (k in anchorMapProposed) {
            if (!anchorMapPrevious
                || anchorMapPrevious[k] !== anchorMapProposed[k]
            ) {
                if (k.indexOf('s_') === -1) {
                    state[k](anchorMapProposed[k]);
                    stateChanged = true;
                }
            }
        };

        if (stateChanged) {
            state.updateStateControls();
            state.updateApp();
        }

        return false;
    };

    return { uriChange: onHashchange, mapChange: changeAnchorPart };

}

//******************************************************************************************************************
//Q is an object used in both the Map and the Map Legend to essentially compute the quartile partitions for the 
//color scheme
//
//bands indicates the number of divisions, index returns the band a given value belongs to and boundaries returns the
//limits of each band.
//******************************************************************************************************************
var q = { 
    bands: 4,
    index: function (d, s) {
        q.bands = s || q.bands;
        var v = state.ctyVol(d);
        var i = (state.data.max - state.data.min) / q.bands;
        var n = q.bands - 1;
        return Math.min(parseInt((v - state.data.min) / i), n);
    },
    boundaries: function () {
        var result = [];
        var i = (state.data.max - state.data.min) / q.bands;
        for (var j = 0; j < q.bands; j++) {
            result.push((parseFloat(parseFloat(state.data.min) + i * j)).toFixed(5));
        }
        return result;
    }
}

//******************************************************************************************
//This function houses a small library that handles the main map at the center of the page.
//
//It initialises the map when called and returns an object reference to map to calling code.
//******************************************************************************************
function mainMap(o) {

    //This is the reference object that is returned, starts empty
    var map = {};

    //Default map properties
    var defaults = {
        margin: 10,
        width: 100,
        height: 137, //factor for shape of Ireland
        scale: 1200 * (137 / 85.33) * 1,
        projection: d3.geo.albers,
        center: [-3.8, 53.3],
        rotate: [4.4, 0],
        parallels: [52, 56]
    }

    //This subfunction draws the main map when the page first loads, it also sets up the properties
    //of the object used to reference the map.
    //Drawing of the map is almost automatically handled by the D3 library, using the geo and svg sub-libraries
    //Geo handles all mercator <-> 2D screen coordinates projections and svg generates the actual images.
    //The data for the map is obtained via an AJAX call in getData.js
    //
    //All events for the map are also set up.
    map.init = function (options) {

        // Extend defaults
        var extended = defaults;
        for (var prop in options) {
            if (options.hasOwnProperty(prop)) {
                extended[prop] = options[prop];
            }
        }
        var o = map.options = extended; //var o used for shorthand

        o.width = d3.select(o.container)[0][0].clientWidth - o.margin;
        o.height = o.width * 1.37;
        o.scale = 1200 * (o.height / 85.33) * 1;

        map.proj = o.projection()
					.center(o.center)
					.rotate(o.rotate)
					.parallels(o.parallels)
					.scale(o.scale)
					.translate([o.width / 2, o.height / 2]);

        map.path = d3.geo.path().projection(map.proj);

        map.svg = d3.select(o.container)
						.append("svg")
						.attr("width", o.width)
						.attr("height", o.height)
						.attr("id", "ireland");

        map.map = map.svg.append("g");

        //**********************************
        //Event functions for the map
        //**********************************
        function ctyHighlight(d) {
            var item = d3.select(this);
            var cty = item.attr("id");
            state.add(cty, "highlight");
            var targets = d3.selectAll("#" + cty);
            stateUpdate(targets, "class", "active", true);
            return false;
        }

        function ctyUnhighlight(d) {
            var item = d3.select(this);
            var cty = item.attr("id");
            state.remove(cty, "highlight");
            var targets = d3.selectAll("#" + cty);
            stateUpdate(targets, "class", "active", false);
            return false;
        }

        function ctyClicked(d) {
            var item = d3.select(this);
            var cty = item.attr("id");
            var add = state.toggle(cty);
            URIcontroller.mapChange({ county: add ? cty : 'All' });
            return false;
        }

        //************************************************************************
        //It is in this step that we actually draw the map and set up the events
        //************************************************************************
        map.counties = map.map.selectAll("path") //removed async elements
			.data(irl.features)
		.enter().append("path")
			.attr("fill", function (d) { return colorScale(d); })
			.attr("style", "stroke:#fff;stroke-width:0.5;")  //applied in here to facilitate image capture
			.attr("id", function (d) { return d.properties.id; })
			.on("mouseover", ctyHighlight)
			.on("mouseout", ctyUnhighlight)
			.on("click", ctyClicked)
			.attr("d", map.path);

        return map;
    }

    //*******************************************************************************
    //This subsection of the mainMap function handles the colour gradient of the map
    //
    //colorPalette defines the colours used.
    //
    //colorScale sets the correct colour based on the county's data (d).
    //
    //updateChoropleth is function (added to the reference object) which transitions
    //the counties to a new colour scheme whenever a new variable is selected.
    //*******************************************************************************
    colorPalette = ["#FFAC70", "#FF8833", "#ff6c00", "#dd5500"];

    function colorScale(d, s) {
        var c = colorPalette[parseInt(q.index(d.properties.id, s))];
        return c;
    }

    map.updateChoropleth = function () {
        map.counties.transition().attr("fill", function (d) { return colorScale(d, 4); });
    }

    //*******************************************
    //Initialises map and returns reference
    //*******************************************
    return map.init(o);
};

//*******************************************************************************
//Map Legend
//
//This function sets up the legend on the map, using the Q-object to compute the
//partitions and assign the colour scheme.
//*******************************************************************************
function mapLegend(o){
	var smd = {};

	var defaults = {
		unit : 11,
		margin : 10,
		width : 100,
		scale : 1
	}

	smd.init = function(options){

		var legendSwatches = q.boundaries();

		// Extend defaults
		var extended = defaults;
		for (var prop in options) {
			if (options.hasOwnProperty(prop)) {
			extended[prop] = options[prop];
			}
		}
    	var o = smd.options = extended; //var o used for shorthand

    	smd.container = d3.select(o.container);
    	o.width = smd.container[0][0].clientWidth-o.margin;
    	smd.canvas = smd.container.select(o.canvas);
    	o.formatter = state.data.max > 1 ? d3.format(',.0f') : d3.format('.2%'); //should have data reference sent in?

		// Ensure we have something to make a legend with
		if (legendSwatches.length === 0) {
			return; // smd;
		}
				    
		// Specific to scale type, unfortunately
		if (legendSwatches && legendSwatches.length > 0) {
			// Make a wrapper for dragging
			smd.draggableLegendGroup = smd.canvas.append('g')
			.attr('class', 'draggable-legend')
			.attr('width', o.width);	

			// Make group for legend objects
			smd.legendGroup = smd.draggableLegendGroup.append('g')
			.attr('class', 'legend-group');

			// Make container and label for legend
			smd.legendGroup.append('rect')
			.attr('class', 'legend-container')
			.attr('width', 100)
			.attr('height', legendSwatches.length * (o.unit * 2) + (o.unit * 3))
			.attr('x', 0)
			.attr('y', 0)
			.attr("fill","#ffffff")

			// Add colors swatches
			smd.legendGroup
			.selectAll('rect.legend-swatch')
				.data(legendSwatches)
			.enter().append('rect')
				.attr('class', 'legend-swatch')
				.attr('width', o.unit)
				.attr('height', o.unit)
				.attr('x', (o.unit * 1))
				.attr('y', function(d, i) { return ((i-1) * o.unit * 2) + (o.unit * 3); })
				//.style(smd.options.stylesLegendSwatch)
				.style('fill', function(d, i) { return colorPalette[i]; });
				          
			// Add text label
			smd.legendGroup
			.selectAll('text.legend-amount')
				.data(legendSwatches)
			.enter().append('text')
				.attr('class', 'legend-amount')
				.attr('font-size', o.unit)
				.attr('x', (o.unit * 3))
				.attr('y', function(d, i) { return ((i-1) * o.unit * 2) + (o.unit * 4 - 1); })
				.text(function(d, i) { return '>= ' + o.formatter(d); });
				      
			// Scale legend
			smd.legendGroup
			.attr("transform", "translate(10,3)");
		}
		return smd;
	}

	smd.update = function(){
		var formatter = state.data.max > 1 ? d3.format(',.0f') : d3.format('.2%'); 
		smd.legendGroup
			.selectAll('text.legend-amount')
			.data(q.boundaries)
			.text(function(d, i) { return '>= ' + formatter(d); })
	}				

	return smd.init(o); //returns smd
}

//**************************************************************************************************************************************
//This function sets up the histogram charts on the left of the page and returns
//a reference to them for use with calling code. The input is an object o having the properties:
//
//container, canvas, height
//Container being the charts' container div, canvas the image format (e.g. svg) and height being the height of the container div.
//
//The flow of this function is as follows:
//Append references to charts as properties of the "cht" object, attach functions to this object corresponding to redrawing
//and ordering, then call the initialisating function to set up the charts. Finally return "cht"
//**************************************************************************************************************************************
function chart(o) {
    //cht will be the object used to reference the charts.
	var cht = {};
    //Default margin settings within the container div
	var margin = {top: 0, right: 20, bottom: 20, left: 10};
    //Chart default settings
	var defaults = {
		margin : margin,
		width : 500  - margin.left - margin.right,
		height : 600 - margin.top - margin.bottom, //may not be required
		scale : 1
	}

    //Event functions for the charts
	function chtHighlight(d) {
	    var item = d3.select(this);
	    var cty = item.attr("id");
	    state.add(cty, "highlight");
	    var targets = d3.selectAll("#" + cty);
	    stateUpdate(targets, "class", "active", true);
	    return false;
	}

	function chtUnhighlight(d) {
	    var item = d3.select(this);
	    var cty = item.attr("id");
	    state.remove(cty, "highlight");
	    var targets = d3.selectAll("#" + cty);
	    stateUpdate(targets, "class", "active", false);
	    return false;
	}

	function chtClicked(d) {
	    var item = d3.select(this);
	    var cty = item.attr("id");
	    var add = state.toggle(cty);
	    URIcontroller.mapChange({ county: add ? cty : 'All' });
	    return false;
	}

	//Draws the intial configuration for the charts. Adds several properties to the "cht" reference object corresponding to
	//the charts x,y axis (cht.x, cht.y), the collection of svgs attached to it (cht.svg) and a more direct reference to
    //the chart svgs (bar)
	init = function(options){
				    
		// Extend defaults
		var extended = defaults;
		for (var prop in options) {
			if (options.hasOwnProperty(prop)) {
			extended[prop] = options[prop];
			}
		}
    	var o = cht.options = extended; //var o used for shorthand

    	o.width = d3.select(o.container)[0][0].clientWidth-o.margin.left-o.margin.right;

		cht.index = d3.range(26);
					 
		cht.x = d3.scale.linear()
			.domain([Math.min(state.data.min*1.1,0), Math.max(state.data.max,0)]) 
			//could set fixed domains for measures based on max of max and min of min - definitely will work for avg value
			.range([0, o.width]);

		cht.y = d3.scale.ordinal()
			.domain(cht.index)
			.rangeRoundBands([0, o.height], .1);
					 
		cht.svg = d3.select(o.container).append(o.canvas)
			.attr("width", o.width + o.margin.left + o.margin.right)
			.attr("height", o.height + o.margin.top + o.margin.bottom)
			.append("g")
			.attr("transform", "translate(" + o.margin.left + "," + o.margin.top + ")");
					 
		cht.bar = cht.svg.selectAll(".bar")
			.data(state.data.series) //should be passed in
			.enter().append("g")
			.attr("class", "bar")
			.attr("transform", function(d, i) { return "translate(0," + cht.y(i) + ")"; });

		cht.bar.append("rect")
			.attr("id", function(d) { return d.id;})
			.attr("class", function(d) { if(d.vol<0) return "bar negative"; return "bar"; })				
			.attr("height", cht.y.rangeBand())
			.attr("x", function(d) { return cht.x(Math.min(0, d.vol)); })
			.attr("width", function(d) { return Math.abs(cht.x(d.vol)-cht.x(0)); });
					 
		cht.bar.append("text")	   			
			.attr("text-anchor", "end")
			.attr("x", function(d) { return cht.x(state.data.max)-3; })
			.attr("y", cht.y.rangeBand() / 2)
			.attr("dy", ".35em")
			.text(function(d, i) { return d.id; });

		cht.bar.append("rect")
			.attr("id", function(d) { return d.id;})
			.attr("class", function(d) { return "clear";})
			.attr("height", cht.y.rangeBand())
			.on("mouseover",chtHighlight)
			.on("mouseout",chtUnhighlight)
			.on("click",chtClicked)
			.attr("width", function(d) { return cht.x(state.data.max); });			    

		cht.xAxis = d3.svg.axis()
			.ticks(5)
			.tickFormat(state.formatter)
			.scale(cht.x)
			.orient("bottom");

		cht.svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + o.height + ")")
			.call(cht.xAxis);
					 
		cht.sorted = false;
		return cht;
	}

    //Redraws the histograms in response to the data.
	cht.redrawChart = function(){
					
		cht.x = d3.scale.linear()
			.domain([Math.min(state.data.min*1.1,0), Math.max(state.data.max,0)]) //data could be referenced in the chart members
			.range([0, cht.options.width]);

		cht.xAxis = d3.svg.axis()
			.ticks(5)
			.tickFormat(state.formatter)
			.scale(cht.x)
			.orient("bottom");

		var gx = d3.selectAll("g.x").transition().duration(500).call(cht.xAxis);

		var bars = cht.svg.selectAll("rect.bar")
					.data(state.data.series)
				.transition()
					.duration(500)
				.attr("class", function(d) { 
					var css = d3.select(this).attr("class"); 
					if(d.vol<0) { 
						if(css.indexOf("negative")===-1) {
							return (css || "").trim() + " negative"; 
						}
					} else if(css.indexOf("negative")!==-1) {
						return css.replace("negative","").trim(); 
					}
					return css;
				})
				.attr("x", function(d) { return cht.x(Math.min(0, d.vol)); })
				.attr("width", function(d) { return Math.abs(cht.x(d.vol)-cht.x(0)); });

		return cht;
	}

    //Sorts the histograms based on the current variable
	cht.sort = function() {
					
		if (cht.sorted = !cht.sorted) {
			cht.index.sort(function(a, b) { return state.data.series[b].vol - state.data.series[a].vol; });
		} else {
			cht.index = d3.range(26);
		}

		cht.y.domain(cht.index);
					 
		cht.bar.transition()
			.duration(200)
			.delay(function(d, i) { return i * 50; })
			.attr("transform", function(d, i) { return "translate(0," + cht.y(i) + ")"; });

		return cht;
	}

    //We call the init function to set up the charts. It returns the cht object, which we then return again.
	return init(o);
}

//*******************************************************************************************************************************
//Dashboard
//
//This function sets up the dashboard and its updating functions. When fired it intialises the dashboard to it starting appearance
//and then returns a reference object used by other mini-libraries to affect the dashboard.
//*******************************************************************************************************************************
function dashboardMiniLib() {
    //Defines the fields displayed in the dashboard.
    var tableDef = {
        cols: 5, //include description
        rows: [
            { display: "Source", cols: { "1": "Volume", "2": "Average (&#8364)", "3": "% of Total", "4": "% of All Stock" } },
            { key: "ppr", display: "PPR", cols: { "1": "vol", "2": "avg", "3": "ofTotal", "4": "percentOf" } },
            { key: "ptsb", display: "All", cols: { "1": "vol", "2": "avg", "3": "ofTotal", "4": "percentOf" } },
            { display: "", cols: {} },
            { display: "Sales", cols: { "1": "Volume", "2": "Average", "3": "% Total", "4": "v CSO Index" } },
            { key: "repo", display: "Repos", cols: { "1": "vol", "2": "avg", "3": "ofTotal", "4": "percentOf" } },
            { key: "avs", display: "Shortfall", cols: { "1": "vol", "2": "avg", "3": "ofTotal", "4": "percentOf" } },
            { key: "redeemed", display: "Sale", cols: { "1": "vol", "2": "avg", "3": "ofTotal", "4": "percentOf" } },
            { display: "", cols: {} },
            { display: "Category", cols: { "1": "Volume", "2": "Average", "3": "% Total", "4": "% Book" } },
            { key: "arrsFb", display: "Arrs/FB", cols: { "1": "vol", "2": "avg", "3": "ofTotal", "4": "percentOf" } },
            { key: "arrs", display: "Arrears", cols: { "1": "vol", "2": "avg", "3": "ofTotal", "4": "percentOf" } },
            { key: "ninetyPlus", display: "90+", cols: { "1": "vol", "2": "avg", "3": "ofTotal", "4": "percentOf" } },
            { display: "", cols: {} },
            { display: "Source", cols: { "1": "Volume", "2": "Vacant" } },
            { key: "census", display: "Census 2011", cols: { "1": "vol", "2": "vacant" } }
        ]
    };

    //Stores number formatting for the dashboard in general
    var format = function (v) { var f = v > 2 ? d3.format(',.0f') : d3.format('.2%'); return f(v); };

    //Stores specific formatting for given fields
    var mask = {};
    mask["vol"] = d3.format(',.0f');
    mask["avg"] = d3.format(',.0f');
    mask["ofTotal"] = d3.format('.2%');
    mask["percentOf"] = d3.format('.2%');
    mask["default"] = d3.format(',.0f');

    //This function grabs the data needed to update map and then feeds it into the "updateTable" function
    //which updates the dashboard
    function updateStats() {
        var header = "", table = "", i = 0, displayData,
            cty = (state.selCty["clicked"] || state.selCty["highlight"]) || "All";
        //This line unfreezes the dashboard if no county is selected.
        if (cty === "All" && state.selCty["highlight"]) {
            cty = state.selCty["highlight"];
        }
        header = cty;
        displayData = dataByCounty[cty];

        d3.select("#statsHeader").html(header);
        if (displayData === undefined) {
            displayData = dataByCounty["All"];
        }
        updateTable(displayData);
    };

    //This function creates the table using the definitions given above.
    function createTableFromDef(d) {
        var table = "", rowDef, rowData, col, cell, rowId, cellId, cssRow, cssCell;
        for (var i = 0; i < tableDef.rows.length; i++) {
            var row = "", col = "", rowId = "", cssRow = "";
            rowData = null;
            rowDef = tableDef.rows[i];
            if (rowDef.key) {
                rowData = d[rowDef.key];
                rowId = rowDef.key;
            } else {
                if (rowDef.display !== "") {
                    cssRow = " class='rowHeader'";
                }
            }
            row += "<td>" + rowDef.display + "</td>";
            for (var j = 1; j <= tableDef.cols; j++) {
                cellId = "";
                col = rowDef.cols[j] || "";
                cssCell = "";
                if (col !== "") {
                    if (rowData) {
                        cell = rowData[col] || "";
                        cssCell = " class='cell'";
                        if (cell !== "") { cell = format(cell) };
                        cellId = " id='" + rowId + "-" + col + "'";
                    } else {
                        cell = col;
                    }
                } else {
                    cell = "";
                }
                row += "<td" + cellId + cssCell + ">" + cell + "</td>";
            }
            table += "<tr id='" + rowId + "'" + cssRow + ">" + row + "</tr>"; //cssRow not necessary?
        }
        return table;
    };

    //This updates the cell values based on the current county highlighted.
    //Works by using D3 to select all of the cells, then uses the "each" method (a D3 method) to iterate through
    //the cells updating their values
    function updateTable(dataCty) {
        var cells = d3.selectAll("td.cell");
        if (cells[0].length === 0) {
            var table = createTableFromDef(dataCty);
            d3.select("#stats").html(table);
            cells = d3.selectAll("td.cell");
        }
        cells.each(function (d, i) {
            var item = d3.select(this);
            var key = item.attr("id").split("-");
            var format = (mask[key[1]] || mask["default"]);
            item.text(function () { return format(dataCty[key[0]][key[1]]) }); //Assumes only 2 dimensions - fair for 2d table
        });
    };

    //This function is used to highlight a specific row (portfolio variable) orange and one column
    //within that row black (measure variable) Like all functions it does this by inspecting the state variable.
    function highlightTable() { //could split this between row and cell
        //Remove higlhight from existing cells
        var targets = d3.selectAll("tr.highlight");
        stateUpdate(targets, "class", "highlight", false);
        targets = d3.selectAll("td.bold");
        stateUpdate(targets, "class", "bold", false);
        //Add highlights for active portfolio and measure
        targets = d3.selectAll("tr#" + state.portfolio());
        stateUpdate(targets, "class", "highlight", true);
        targets = targets.selectAll("td#" + state.portfolio().trim() + "-" + state.measure().trim());
        stateUpdate(targets, "class", "bold", true);
        return false;
    };

    return { updateDash: updateStats, highlightDash: highlightTable };

}

//**********************************************************************************************
//Here we have the slide show. In a sense it operates quite simply. The slideMap
//variable contains the specific settings for changeMap function of the URIcontroller. 
//The slideShow function is a middle man that passes these variables to changeMap, 
//along with a float indicating a waiting time before the next changeMap firing.
//**********************************************************************************************
function slideShow(o) {

	var s = {};

	s.init = function(options){
		s.slideMap = options.slideMap;
		s.interval = options.interval;
		s.text = d3.select(options.textBox);
		return s;
	}

	s.run = function(){ 
		var n = 0;
		setTimeout(next(n),s.interval);
	}

	var next = function(n){	
		setTimeout(display(s.slideMap[n],n),s.interval);			
	}

	var display = function(slidePoint,n){
		return function(){
			s.text.html(slidePoint.comment);
			URIcontroller.mapChange(slidePoint.state);
			if(n+1<s.slideMap.length) { next(n+1); }
		}					
	}
	return s.init(o);
}

var slideMap = [
{ state: { portfolio: 4, measure: 3, county: "All" }, comment: "1. All Ireland held in September" },
{ state: { portfolio: 3, measure: 3, county: "Dublin" }, comment: "2. Won the Sam Maguire this year" },
{ state: { portfolio: 7, measure: 3, county: "Mayo" }, comment: "3. Lost to Dublin in All-Ireland" },
{ state: { portfolio: 4, measure: 3, county: "Kerry" }, comment: "4. Cian wanted to see this one" }
];

var slideShow = slideShow({textBox:"#slideText",interval:3000,slideMap:slideMap});