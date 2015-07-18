			//Defines a trim function
			String.prototype.trim = function() { return this.replace(/^\s+|\s+$/, ''); };

            //Config - The data itself uses strings like "ppr" to label fields, however the buttons used to select a given data type fire ordinals
            //These objects connect those values
			var portfolio = { 0 : "ppr", 1 : "repo", 2 : "avs", 3 : "redeemed", 4 : "ptsb", 5 : "arrsFb", 6 : "arrs", 7 : "ninetyPlus"}; //could be arrays
			var measure = { 0 : "vol", 1 : "avg", 2 : "ofTotal", 3 : "percentOf"};

            //This function uses d3 to create a set of buttons given a Div to contain them, a set of values to associate with each button,
            //a css class for their visual appearance, and an object specifying the event handlers
			var createButtonSet = function(container,btns,css,events){
				var btns = d3.select(container).selectAll('button')
					.data(btns)
				.enter().append('button')
					.attr("class", css)
					.attr("value", lam("value"))
					.html(lam("name"))
					.on("click",events.click);				
			}

			//Here we have the object that stores the buttons ordinal values and the text they display	
			var pBtns = [ {name:"Price Register",value:0},
							{name:"Repossessions",value:1},
							{name:"Sales (shortfall)",value:2},
							{name:"Sales (closed)",value:3},
							{name:"All Mortgage Assets",value:4},
							{name:"Forbearance or in Arrears",value:5},
							{name:"Arrears",value:6},
							{name:"Default (90+)",value:7}];

            //Uses the function above to create a set of buittons attached to the #portfolio div, with pBtns text and values, with "btn btn-primary" visual appearance,
            //whose click event is set to fire the portfolioClick function below. Note: portfolioClick is really just a wrapper around changeAnchorPart.
			createButtonSet("#portfolio",pBtns,"btn btn-primary",{click : portfolioClick});
			
			//Repeat the same process for the variable setting buttons.
			var mBtns = [ {name:"Volume",value:0},
						{name:"€ Avg",value:1},
						{name:"% Total",value:2},
						{name:"% ...",value:3}];
			
			createButtonSet("#measure",mBtns,"btn btn-primary btn-xs",{click : measureClick});

			//Here we have the two event handlers 
			function portfolioClick(e){
				changeAnchorPart({portfolio:this.value});
				return false;
			};

			function measureClick(e){
				changeAnchorPart({measure:this.value});
				return false;
			};			

			$('#sort').click(function(e) {
			    e.preventDefault();
			    chart.sort();
			});

            //Here we attach an event handler to the "Image" button using jQuery. The event handler itself
            //uses d3 to select the image and canvg to convert it into a static png image.
			$('#mapToImg').click(function(e) {
			    e.preventDefault();
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
			$("#slideShow").click(function(){
				slideShow.run();
			});



			//State Management
			var state = {
				p : 0, //Default portfolio - these will be hidden
				m : 0,   //Default measure - these will be hidden
				selCty : { "clicked" : "All", "highlight" : "" },
				add : function(cty,type){ 
					state.selCty[type] = cty;
					updateStats();
				}, //will this ensure selections not doubled off may need to check first
				remove : function(cty,type){
					state.selCty[type] = "";
					updateStats();
				},
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
				clear : function() { state.selCty = {}; }, //need to unhighlight all - select all active and clicked elements - events should run from state updates
				portfolio : function(v){ 
						if(v!==undefined){
							if(v!==state.p) {
								state.p=v;
							}
						}
						return portfolio[state.p]; 
					},
				measure : function(v){ 
						if(v!==undefined){
							if(v!==state.m) {
								state.m=v;
							}
						}					
						return measure[state.m]; 
					},
				county : function(v){ 
						if(v!==undefined){
							if(v!==state.selCty["clicked"]) {
								state.selCty["clicked"]=v;
							}
						}					
						return state.selCty["clicked"]
					},
				//Data
				data : {},
				series : [],
				categories : ["Carlow", "Cavan", "Clare", "Cork", "Donegal", "Dublin", "Galway", "Kerry", "Kildare", "Kilkenny", "Laois", "Leitrim", "Limerick", "Longford", "Louth", "Mayo", "Meath", "Monaghan", "Offaly", "Roscommon", "Sligo", "Tipperary", "Waterford", "Westmeath", "Wexford", "Wicklow"], //Define this statically as adding some extra categories e.g. Ireland
				initData : function(){
					//Set preliminary order
					if(!state.categories.length) {
						for(cty in dataAll[state.portfolio()]){
							state.categories.push(cty);
						}
						state.categories.sort();
						//console.log(state.categories);
					}
					state.resetData();			
				},
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
					//console.log(state.data.series);				
				},
				updateDashboard : function(){
					state.resetData();
					chart.redrawChart();
					map.updateChoropleth(true); //should be updated from measure change
					smd.update(true);
					highlightTable();
					updateStats();
				},
				updateStateControls : function(){
					$("#portfolio button").removeClass("active");
					$("#measure button").removeClass("active");
					$("#portfolioSelected").html("Selected: " + pBtns[state.p].name);
					$("#portfolio button[value=" + state.p + "]").addClass("active");
					$("#measure button[value=" + state.m + "]").addClass("active");
					//Update map
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
				formatter : d3.format(',.0f') //default
			};

			/* Anchor Map section */
			var anchorMap = {};
			var anchorMapSchema = { 
				portfolio: { 
					0 : true, 1 : true, 2 : true, 3 : true, 4 : true, 5 : true, 6 : true, 7 : true
				},
				measure: {
					0 : true, 1 : true, 2 : true, 3 : true
				},
				county: { Carlow : true, Cavan : true, Clare : true, Cork : true, Donegal : true, Dublin : true, Galway : true, Kerry : true, Kildare : true, Kilkenny : true, Laois : true, Leitrim : true, Limerick : true, Longford : true, Louth : true, Mayo : true, Meath : true, Monaghan : true, Offaly : true, Roscommon : true, Sligo : true, Tipperary : true, Waterford : true, Westmeath : true, Wexford : true, Wicklow : true, All : true
				}
			};

			function copyAnchorMap() {
				return $.extend( true, {}, anchorMap );
			};

			// configure uriAnchor to use our schema
			$.uriAnchor.configModule({
				schema_map : anchorMapSchema
			});

            //*******************************************************************************************
            //This is the main function that updates the map in response to the button clicks.
            //*******************************************************************************************
			function changeAnchorPart( argMap ) {
				var
				  anchorMapRevise = copyAnchorMap(),
				  result = true,
				  k, k_dep;

				//console.log(argMap);
				// Begin merge changes into anchor map
				KEYVAL:
				for ( k in argMap ) {
				  if ( argMap.hasOwnProperty( k ) ) {

				    // skip dependent keys during iteration
				    if ( k.indexOf( '_' ) === 0 ) { continue KEYVAL; }

				    // update independent key value
				    anchorMapRevise[k] = argMap[k];

				    // update matching dependent key
				    k_dep = '_' + k;
				    if ( argMap[k_dep] ) {
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
				  $.uriAnchor.setAnchor( anchorMapRevise );
				}
				catch ( error ) {
				  // replace URI with existing state
				  $.uriAnchor.setAnchor( anchorMap,null,true );
				  result = false;
				}
				// End attempt to update URI...

		    	return result;
			};
			// End DOM method /changeAnchorPart/

			function onHashchange( event ) {
			    var
			      anchorMapPrevious = copyAnchorMap(),
			      anchorMapProposed, stateChanged = false, toggleCty = false;

				// attempt to parse anchor
				try { anchorMapProposed = $.uriAnchor.makeAnchorMap(); }
				catch ( error ) {
					$.uriAnchor.setAnchor( anchorMapPrevious, null, true );
					return false;
				}
				anchorMap = anchorMapProposed;

				for ( k in anchorMapProposed ) {
					if ( ! anchorMapPrevious
						|| anchorMapPrevious[k] !== anchorMapProposed[k]
					) {	
						if(k.indexOf('s_')===-1){
							state[k](anchorMapProposed[k]);
							stateChanged = true;
						}
					}
				};

				if(stateChanged){
					state.updateStateControls();
					state.updateDashboard();
				}

			    return false;
			};
			// End Event handler /onHashchange/

			var tableDef = {
				cols : 5, //include description
				rows : [
					{ display: "Source", cols : { "1": "Volume", "2": "Average (€)", "3": "% of Total", "4": "% of All Stock" } },
					{ key: "ppr" , display: "PPR", cols : { "1": "vol", "2": "avg", "3": "ofTotal", "4": "percentOf" } },
					{ key: "ptsb" , display: "All", cols : { "1": "vol", "2": "avg", "3": "ofTotal", "4": "percentOf" } },
					{ display: "", cols : {} },
					{ display: "Sales", cols : { "1": "Volume", "2": "Average", "3": "% Total", "4": "v CSO Index" } },
					{ key: "repo" , display: "Repos", cols : { "1": "vol", "2": "avg", "3": "ofTotal", "4": "percentOf" } },
					{ key: "avs" , display: "Shortfall", cols : { "1": "vol", "2": "avg", "3": "ofTotal", "4": "percentOf" } },
					{ key: "redeemed" , display: "Sale", cols : { "1": "vol", "2": "avg", "3": "ofTotal", "4": "percentOf" } },
					{ display: "", cols : {} },
					{ display: "Category", cols : { "1": "Volume", "2": "Average", "3": "% Total", "4": "% Book" } },
					{ key: "arrsFb" , display: "Arrs/FB", cols : { "1": "vol", "2": "avg", "3": "ofTotal", "4": "percentOf" } },
					{ key: "arrs" , display: "Arrears", cols : { "1": "vol", "2": "avg", "3": "ofTotal", "4": "percentOf" } },
					{ key: "ninetyPlus" , display: "90+", cols : { "1": "vol", "2": "avg", "3": "ofTotal", "4": "percentOf" } },
					{ display: "", cols : {} },	
					{ display: "Source", cols : { "1": "Volume", "2": "Vacant"} },
					{ key: "census", display: "Census 2011", cols : { "1": "vol", "2": "vacant"} }
				]
			};	

			//*******************************************************************************
			//Apply Choropleth
			//*******************************************************************************
			//colorBrewerBlues6 = ["#89b1d1", "#6c9dc6", "#4682b4", "#2e5576"];
			colorPalette = ["#FFAC70", "#FF8833", "#ff6c00", "#dd5500"];

			function colorScale(d,s){
				var c = colorPalette[parseInt(q.index(d.properties.id,s))];
				return c;
			}

			var q = { //Could d3.quantize be used?
				bands : 4,
				index : function(d,s) {
					q.bands = s || q.bands;
					var v = state.ctyVol(d);
					var i = (state.data.max-state.data.min)/q.bands;
					var n = q.bands-1;
					return Math.min(parseInt((v-state.data.min)/i),n);
				},
				boundaries : function(){
					var result = [];
				    var i = (state.data.max-state.data.min)/q.bands;
				    for(var j=0;j<q.bands;j++){
				    	result.push((parseFloat(parseFloat(state.data.min) + i*j)).toFixed(5));
				    }
				    return result;
				}
			}

			var format = function(v){ var f = v > 2 ? d3.format(',.0f') : d3.format('.2%'); return f(v); };
			var formatWrapper = function(v,f){ return f(v); };

			var mask = {};
			mask["vol"] = d3.format(',.0f'); 
			mask["avg"] = d3.format(',.0f');
			mask["ofTotal"] = d3.format('.2%'); 
			mask["percentOf"] = d3.format('.2%'); 
			mask["default"] = d3.format(',.0f');

			//*******************************************************************************
			//Map
			//*******************************************************************************
			function mainMap(o){
				var map = {};

				var defaults = {
					margin : 10,
					width : 100,
					height : 137, //factor for shape of Ireland
					scale : 1200*(137/85.33)*1,
					projection : d3.geo.albers,
					center : [-3.8, 53.3],
					rotate : [4.4, 0],
					parallels : [52, 56]
				}

                //This subfunction basically draws the main map.
				map.init = function(options){
				    
				    // Extend defaults
				    var extended = defaults;
				    for (var prop in options) {
				      if (options.hasOwnProperty(prop)) {
				        extended[prop] = options[prop];
				      }
				    }
    				var o = map.options = extended; //var o used for shorthand

    				o.width = d3.select(o.container)[0][0].clientWidth-o.margin;
    				o.height = o.width * 1.37;
    				o.scale = 1200*(o.height/85.33)*1;

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

					map.counties=map.map.selectAll("path") //removed async elements
						.data(irl.features)
					.enter().append("path")
						.attr("fill",function(d){ return colorScale(d);})
						.attr("style","stroke:#fff;stroke-width:0.5;")  //applied in here to facilitate image capture
						.attr("id", function(d) { return d.properties.id;})
						.on("mouseover", o.events.mouseover)
						.on("mouseout", o.events.mouseout)
						.on("click", o.events.click)
						.attr("d", map.path);

					return map;
				}

				map.updateChoropleth = function(){
					map.counties.transition().attr("fill",function(d){ return colorScale(d,4);});
				}

				return map.init(o);
			}

			//common handling functions to map and chart
			function highlight(d){
				var item = d3.select(this);
				var cty = item.attr("id");				
				state.add(cty,"highlight");
				var targets = d3.selectAll("#" + cty);
				stateUpdate(targets,"class","active",true);
				return false;
			}

			function unhighlight(d){
				var item = d3.select(this);
				var cty = item.attr("id");
				state.remove(cty,"highlight");
				var targets = d3.selectAll("#" + cty);
				stateUpdate(targets,"class","active",false);
				return false;
			}

			function clicked(d){
				var item = d3.select(this);
				var cty = item.attr("id");
				var add = state.toggle(cty);
				changeAnchorPart({county:add?cty:'All'});
				return false;
			}

			//Helper functions - outside object
			function stateUpdate(items,attr,attrPartValue,add){
				items.each(function(d,i) {
					var item = d3.select(this);
					attrUpdate(item,attr,attrPartValue,add);
				});	
			}

			function attrUpdate(item,attr,attrPartValue,add){
				if(add)
				{
					item.attr(attr,function(d) { return (item.attr(attr) || "").trim() + " " + attrPartValue;})
				} else {
					item.attr(attr,function(d) { return item.attr(attr).replace(attrPartValue,"").trim();})
				}
			}

			//*******************************************************************************
			//Legend
			//*******************************************************************************
			//variables for legend

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

			//*******************************************************************************
			//Chart
			//*******************************************************************************
			function chart(o){
				var cht = {};

				var margin = {top: 0, right: 20, bottom: 20, left: 10};

				var defaults = {
					margin : margin,
					width : 500  - margin.left - margin.right,
					height : 600 - margin.top - margin.bottom, //may not be required
					scale : 1
				}

				cht.init = function(options){
				    
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
					    .on("mouseover",highlight)
					    .on("mouseout",unhighlight)
					    .on("click",clicked)
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

				return cht.init(o);
			}

			//*******************************************************************************
			//Table
			//*******************************************************************************
			//selectedCounty (could be counties) - this needs to be set and accessible
			//Get data - aggregate if necessary - apply definition/tranformation & formatting
			//If nothing highlighted or clicked revert to all data
			//Table could be a d3 object?
			function updateStats(){
				var header = "", table = "", i = 0, displayData,
					cty = (state.selCty["clicked"] || state.selCty["highlight"]) || "All";
				if(cty==="All" && state.selCty["highlight"]){
					cty = state.selCty["highlight"];
				}
				header = cty;
				displayData = dataByCounty[cty];

				$("#statsHeader").html(header);
				if(displayData===undefined){
					displayData=dataByCounty["All"];
				}
				updateTable(displayData);
			};

			function createTableFromDef(d){ //shoud do this once? and bind data
				var table = "", rowDef, rowData, col, cell, rowId, cellId, cssRow, cssCell;
				for(var i=0;i<tableDef.rows.length;i++){
					var row = "", col = "", rowId = "", cssRow = "";
					rowData = null;
					rowDef = tableDef.rows[i];
					if(rowDef.key){ 
						rowData = d[rowDef.key];
						rowId = rowDef.key; 
					} else {
						if(rowDef.display!==""){
							cssRow = " class='rowHeader'";
						}
					}
					row += "<td>" + rowDef.display + "</td>";
					for(var j=1;j<=tableDef.cols;j++){
						cellId = "";
						col = rowDef.cols[j] || "";
						cssCell = "";
						if(col!==""){
							if(rowData){
								cell = rowData[col] || "";
								cssCell = " class='cell'";
								if(cell!==""){ cell=format(cell) };
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

			function updateTable(dataCty){
				var cells = d3.selectAll("td.cell");
				if(cells[0].length===0){
					var table = createTableFromDef(dataCty);
					$("#stats").html(table);
					cells = d3.selectAll("td.cell");
				} 
				cells.each(function(d,i) {
					var item = d3.select(this);
					var key = item.attr("id").split("-");
					var format = (mask[key[1]] || mask["default"]);
					item.text(function(){ return format(dataCty[key[0]][key[1]])}); //Assumes only 2 dimensions - fair for 2d table
				});
			};

			function highlightTable(){ //could split this between row and cell
				//Remove higlhight from existing cells
				var targets = d3.selectAll("tr.highlight");
				stateUpdate(targets,"class","highlight",false);
				targets = d3.selectAll("td.bold");
				stateUpdate(targets,"class","bold",false);
				//Add highlights for active portfolio and measure
				targets = d3.selectAll("tr#" + state.portfolio());
				stateUpdate(targets,"class","highlight",true);
				targets = targets.selectAll("td#" + state.portfolio().trim() + "-" + state.measure().trim());
				stateUpdate(targets,"class","bold",true);
				return false;
			};

			//*******************************************************************************
            //Here we have the slide show. In a sense it operates quite simply. The slideMap
            //variable contains the specific settings for changeAnchor function. the slideShow function 
            //is a middle man that passes these variables to changeAnchor, along with a float indicating a
            //waiting tim before the next changeAnchor firing.
			//*******************************************************************************
			var slideMap = [
				{ state: {portfolio:4, measure:3, county:"All"}, comment: "1. All Ireland held in September" },
				{ state: {portfolio:3, measure:3, county:"Dublin"}, comment: "2. Won the Sam Maguire this year" },
				{ state: {portfolio:7, measure:3, county:"Mayo"}, comment: "3. Lost to Dublin in All-Ireland" },
				{ state: {portfolio:4, measure:3, county:"Kerry"}, comment: "4. Cian wanted to see this one" }
			];

			function slideShow(o){
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
						changeAnchorPart(slidePoint.state);
						if(n+1<s.slideMap.length) { next(n+1); }
					}					
				}
				return s.init(o);
			}

			var slideShow = slideShow({textBox:"#slideText",interval:3000,slideMap:slideMap});

			//*******************************************************************************
			//Initialisation - this starts the map.
			//*******************************************************************************
			state.initData();
			var dataByCounty = state.orderDataByCounty();			
			updateStats();
			highlightTable();


			//call main map
			var map = mainMap({
				container:"#map", 
				//datasource:"./map/ireland.json", 
				datasource: irl, 
				events : { mouseover : highlight, mouseout : unhighlight, click : clicked } 
			});

			//call legend
			var smd = mapLegend({ //will be smd
				container:"#map",
				canvas: "svg"
			});

			//call chart
			var chart = chart({
				container:"#chart",
				canvas: "svg",
				height: map.options.height
			});		


			$(window) //move this to bottom
				.bind( 'hashchange', onHashchange )

			changeAnchorPart({portfolio:0, measure:0, county:"All"});

			//Helper functions from http://phrogz.net/fewer-lambdas-in-d3-js
			// Create a function that returns a particular property of its parameter.
			// If that property is a function, invoke it (and pass optional params).
			function lam(name){ 
			  var v,params=Array.prototype.slice.call(arguments,1);
			  return function(o){
			    return (typeof (v=o[name])==='function' ? v.apply(o,params) : v );
			  };
			}
 
			// Return the first argument passed in
			function I(d){ return d } 