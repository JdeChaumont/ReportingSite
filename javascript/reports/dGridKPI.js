//*******************************************************************************
// Dependencies
// d3
// NVD3 - adjusted
// Various helper functions - formatting, values etc., - could be integrated
// css defnitions
//*******************************************************************************
//Grid function
//*******************************************************************************
function jdcGrid(o){  // should change this to dGrid - need to change references to it
	var ret = {};

	var defaults = {
		css: {
			table: 'table table-default', //bootstrap
			row: '',
			cell : 'cell'
		},
		header: {
			css: 'strong' //not used
		},
		cell: {
			type : sum, //could put in average etc.,
			format : rptFmtN,
			index: def.c, //function
			style : ''
		},
		sparkline : {
			type : function(v) { return v;}, //sparkbar should kick in here
			format : function(v) { return v;},
			index : [def.c,-13],
			chartType : nv.models.sparklinePlus,
			style : ''
		}
	}

	ret.cells = []; //may need linear and 2d arrays

	//need to consider checking fields are available
	function createCells(){
		// 20150705 - Reset when
		ret.cells = []; //may need linear and 2d arrays
		ret.cellsByRef = {};
		ret.table = "";
		ret.pages = { "_" : [] };

		var opt = ret.options;
		var def = f(opt.def); // 20150705 Amended to allow function or object to be passed in - allows dynamic generation
		var table = "", row = "";
		for(var r=0;r<def.rows.length;r++){
			row = "";
			for(var c=0;c<def.cols.length;c++){
				var cell = {}; //should force new variable on each loop
				var type = "";
				cell.ref = def.name + "_r" + r + "c" + c; //to be used for binding
				cell.css = def.cols[c].css || def.rows[r].css  || opt.cell.css || opt.css.cell;
				type = cell.css;
				if(!opt[type]){ //not a valid cell type
					cell.css = opt.cell.css || opt.css.cell + " " + cell.css; // over ride to valid type
					type = opt.cell.css || opt.css.cell; // over ride to valid type
				}
				cell.value = ""; //Default to blank

				if(c===0){ //reserved for row headings
					cell.value = def.rows[r].display;
					cell.css = def.cols[0].css; //override
				}
				else if(r===0){ //reserved for column headings
					cell.value = def.cols[c].display;
					cell.css = def.cols[0].css + (def.cols[c].css ? " " + def.cols[c].css : ""); // 20150102 added code to take css from column to support hiding
					cell.css += " header";
				}
				else if(def.rows[r].css==="blank" || def.cols[c].css==="blank"){
					cell.css="blank";
					cell.value=" ";
				}
				else{
					cell.key = {};
					$.extend(cell.key, def.key, def.rows[r].key, def.cols[c].key); //used to query datasource
					cell.formula = def.cols[c].type; //should there be a recalc aspect - can we get data at this point?
					cell.index = def.cols[c].index || def.rows[r].index || opt[type].index; // changed from cell.css to type
					cell.type = def.cols[c].type || def.rows[r].type || opt[type].type;
					cell.format = def.cols[c].format || def.rows[r].format || opt[type].format;
					cell.chartType = def.cols[c].chartType || def.rows[r].chartType || opt[type].chartType;
					cell.series = cellSeries; //see below - could be anonymous
					cell.style = def.cols[c].style || def.rows[r].style || opt[type].style;
				}
				// 20150106 Pages - support partial update
				cell.page = def.cols[c].page || def.rows[r].page || '_';
				if(!ret.pages[cell.page]){
					ret.pages[cell.page] = [];
				}
				ret.pages[cell.page].push(cell);  // is reference to cell pushed
				// could update css and add active/inactive page
				if(cell.page!=='_') { cell.css+= ' pg'+cell.page + ' inactivePage'; }
				if(o.pageCtrl){ if(cell.page===o.pageCtrl()) { cell.css = cell.css.replace('inactivePage','activePage'); } };
				row = row += "<td id='" + cell.ref + "' class='"+ cell.css + "' style='"+ cell.style + "'>" + cell.value + "</td>";
				ret.cells.push(cell); //might push to linear and 2d array
				ret.cellsByRef[cell.ref]=cell; // used for pop up when cell clicked
			}
			table += "<tr id='r" + r + "' class='" + opt.css.row + "'>" + row + "</tr>";
		}
		ret.table = "<table id='" + def.name + "' class='" + opt.css.table + "'>" + table + "</table>"
		//Populate table
		$('#'+def.container).html(ret.table);
		//Handlers
		var hdl = def.eventHandlers;
		if(hdl){
			for(k in hdl){
				for(l in hdl[k]){
					d3.selectAll('#'+def.name+' '+k)
						.on(l,hdl[k][l])
				}
			}
		}
	}

	//Convert Cell Data into Sparkline series
	function cellSeries(){
		var result = [];
		for(var i=0;i<this.data.length;i++){
			result.push({x:i+1 ,y: this.data[i], z: periods.mth[def.c()-this.data.length+1]});
		}
		return result;
	}

	ret.cells.display = function(){
		var result = "";
		for(var i=0;i<ret.cells.length;i++)
		{
			var c = ret.cells[i];
			result += "Ref: " + c.ref + " Index " + f(c.index) + " Key: { ";
			for(k in c.key){
				result += k + ": " + f(c.key[k]) + ", ";
			}
			result += "}\n";
		}
		return result;
	}

	function objToStr(obj){
		var result = "";
		for(o in obj){
			if(typeof(o)==='function'){
				result += "";
			}
			else if(typeof o ==='object' || o instanceof Array)
				result += o + ":" + objToStr(o) + ", ";
			else {
				result += o + ": " + obj[o] + ", ";
			}
			result += "\n";
		}
		return result;
	}

	ret.init = function(options){
	    // Extend defaults
	    var extended = defaults;
	    for (var prop in options) { //use jQuery?
	      if (options.hasOwnProperty(prop)) {
	        extended[prop] = options[prop];
	      }
		}
		var o = ret.options = extended; //var o used for shorthand
		ret.populated = false;
		ret.source = o.source;
		return ret;
	}

	function updateData(){
		var res = [];
		for(var i=0;i<ret.cells.length;i++)
		{
			var c = ret.cells[i];
			if(c.key){
				//console.log(c.key);
				c.data = c.format(c.type(ret.options.source.segment(c.key,c.index))); //need to sum response
				//console.log(c.data);
				res.push({id : c.ref, val : c.data });
			}
		}
		return res;
	}
	// 20150106 New version to handle pages
	function updateData(){
		var res = [];
		// Default Array
		fillData(ret.pages['_']);
		// Active page
		if(o.pageCtrl){ //console.log(o.pageCtrl())
			fillData(ret.pages[o.pageCtrl()]);
		}
		function fillData(cells){
			for(var c, i=0,a=cells,n=a.length; i<n; i++) { c = a[i];
				if(c.key){ //console.log(c.key);
					c.data = c.format(c.type(ret.options.source.segment(c.key,c.index))); //console.log(c.data);
					res.push({id : c.ref, val : c.data });
				}
			}
		}
		return res;
	}

	function populateCharts(){

		d3.selectAll(".sparkline")
		    .attr('width', 290)
		    .attr('height', 35);

		//sparklines
		for(var i=0;i<ret.cells.length;i++){
			var c = ret.cells[i];
			if(c.css==='sparkline'){
				if(!c.chart){
					c.chart = createsparklines(c);
				} else {
					c.chart.update(c);
				}
			}
		}

		function createsparklines(cell){
			var chart;
			nv.addGraph(
					function(){
						chart = cell.chartType()
										.showValue(false)
										.margin({top: 1, right: 20, bottom: 1, left: 20})
										.width(250)
										.height(30);

						chart.xTickFormat(function(d){return d;});
						chart.yTickFormat(function(d){return fmt(',.1f','m')(d);});

						d3.select('#'+cell.ref).append('svg')
							.attr('id',cell.ref)
							.attr('height', 28);

						d3.select('svg#'+cell.ref)
							.datum(cell.series())
						.transition().duration(200)
							.call(chart);

						nv.utils.windowResize(chart.update);

						return chart;
					});
			return {
				graph : chart,
				update : function(cell){
							d3.select('svg#'+cell.ref)
								.datum(cell.series())
							.transition().duration(200)
								.call(chart);
				}
			}
		}
	}

	function updateCells(){
		var data = updateData(); //console.log(data);
		//select, bind and transition
		d3.selectAll(".cell")
		    .data(data, function(d) { return (d ? d.id : this.id); })
		.transition().duration(500)
		    .style("opacity",function() { return 0.25; })
		.transition().duration(500)
			.style("opacity",function() { return 1; })
		    .text(function(d) { return d.val; });
	}


	ret.update = function(){
		if(ret.populated===false){
			createCells();
			ret.populated = true;
		}
		updateCells();
		populateCharts();
	}
	// Redraw/rebuild table - allows for dynamic setting of rows i.e.. items under a grouping e.g. counties under province
	ret.redraw = function(){ // update with parameter won't work well as update is generally parameterless
		createCells();
		ret.populated = true;
		updateCells();
		populateCharts();
	}

	return ret.init(o);
}

//*******************************************************************************
//Grid/Dashboard specific helpers - move to Grid
//*******************************************************************************
//Helper for OfTotal
function measureExtended(measure,suffix){
	return function(){return f(measure) + suffix};
};
//var OfTotal = measureExtended(def.u,'OfTotal');

//Create a filter on a key with fn and assign label as storage key
function xfFilter(key,label,fn){
	return function(){ return { key: key, label : label, fn : fn}};
}
//This needs to be re-engineered to remove reliance on uom
function ofTotalHelper(measures,suffix,argsArray,uom){
	var u = { uom : measureExtended(uom||def.u,suffix) };
	var xfn = { xfn : { fn : "ofTotal", args : argsArray } };
	return $.extend({},measures,u,xfn);
}
// New version - overwrite old
function ofTotalHelper(measures,suffix,argsArray,mre){
	var u = { mre : measureExtended(mre||'bal',suffix) }; // this is not right - should set reference to default measure like def.u
	var xfn = { xfn : { fn : "ofTotal", args : argsArray } };
	return $.extend({},measures,u,xfn);
}

//Filter function to exclude all object where no forbearance
inFB = function(d){return d!=='NO';};

var popupChart;

function cellClicked(){
	//select, bind and transition
	var rpt = rpts[this.id.split('_')[0]];
	var cell = rpt.cellsByRef[this.id];
	$('#myModalLabel').html(displayFilters(cell.key,false));
	popupChart = createPopupChart('#popupChartBS svg',cell,rpt);
	$('#myModal').modal({
		backdrop : false,
		keyboard : true,
		show : true
	});
	return false;
}

//*******************************************************************************
//Step 6 - Popup Chart NVD3
//*******************************************************************************
function createPopupChart(container,cell,report){
	var chart={};
	d3.select(container + ' svg').remove();
	d3.select(container).append("svg");
	nv.addGraph(
			function(){
				chart.chart = nv.models.multiBarChart()
						.color(palettes['grads'])
						.stacked(true)
						.margin({top: 30, right: 30, bottom: 30, left: 70});

				chart.key = cell.key;
				chart.source = report.source;
				var series = report.source.segment(cell.key,[0,def.c()+1]).map(function(d,i){ return { x: pouDisplay(i,"shortmonths") , y:d };});
				var data = [{key:f(chart.key["mre"]),values:series}];
				var numDataPoints = data.length;

				var maxY = 0, minY = 0;

				data[0].values.forEach(function(d,i) {
					var y0pos = 0, y0neg = 0;
					data.forEach(function(key,series){
						var y0 = 0, val = data[series].values[i].y;

						if(val<0){
							y0 = y0neg;
							y0neg += val;
						}
						else{
							y0 = y0pos;
							y0pos += val;
						}
						maxY=Math.max(maxY,y0pos);
						minY=Math.min(minY,y0neg);
					});
				});

				chart.chart.yAxis.tickFormat(scaleNumberFormat(Math.max(Math.abs(minY),Math.abs(maxY))));

				d3.select(container + ' svg')
					.datum(data)
				.transition().duration(200)
					.call(chart.chart);

				nv.utils.windowResize(chart.chart.update);

			});
	return {
		graph : chart,
		update : function(data){ //update function to take a dimension to iterate
					d3.select('#popupChartBS svg')
						.datum(data)
					.transition().duration(200)
						.call(chart.chart);
		}
	}
}

function pouDisplay(index,monthFormat){
	var pou=periods.mth[index];
	var mth=pou%100;
	var yr=parseInt(pou/100);
	//if((pou+1)%showXthPoint!==0){
	//	return "";
	//}
	return utilsValues[monthFormat][mth-1]+"-"+(yr-2000)
}

function updatePopupChart(dim){
	var chart = popupChart.graph;
	var dimName = dataDims[dim];
	//console.log('updatePopupChart ' + dim);
	//Check dim is and aggregate
	//iterate through key and change if displayNames exists
	var data = pxf.segmentSubAnalyse(chart.key,[0,def.c()+1],dimName); //console.log(data); console.log(displayNames);
	var data1 = data.map(function(e,i,a){
		if(displayNames&&displayNames[dimName]){
			e.key = displayNames[dimName][e.key] || e.key;
		}
		return e;
	});
	var data2 = sortDims(data1,dimsOrdered[dimName]);
	popupChart.update(data2);
}
