//*******************************************************************************
// Dependencies
// d3
// NVD3 - adjusted
// Various helper functions - formatting, values etc., - could be integrated
// css defnitions
//*******************************************************************************
//Grid function
//*******************************************************************************
function jdcGrid(o){
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
			type : function(v) { return v;}, //sum, //could put in average etc.,
			format : rptFmt,
			index: def.c //function
		},
		sparkline : {
			type : function(v) { return v;}, //sparkbar should kick in here
			format : function(v) { return v;},
			index : [def.c,-13],
			//chartType : nv.models.sparklinePlus
		}
	}

	ret.cells = []; //may need linear and 2d arrays
	ret.cellsByRef = {};
	ret.table = "";

	//need to consider checking fields are available
	function createCells(){
		var opt = ret.options;
		var def = opt.def;
		var table = "", row = "";
		for(var r=0;r<def.rows.length;r++){
			row = "";
			for(var c=0;c<def.cols.length;c++){
				var cell = {}; //should force new variable on each loop
				cell.ref = def.name + "_r" + r + "c" + c; //to be used for binding
				cell.css = def.cols[c].css || opt.cell.css || opt.css.cell;
				cell.value = ""; //Default to blank

				if(c===0){ //reserved for row headings
					cell.value = def.rows[r].display;
				}
				else if(r===0){ //reserved for column headings
					cell.value = def.cols[c].display;
					cell.css = def.cols[0].css; //override
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
					cell.index = def.cols[c].index || def.rows[r].index || opt[cell.css].index;
					cell.type = def.cols[c].type || def.rows[r].type || opt[cell.css].type;
					cell.format = def.cols[c].format || def.rows[r].format || opt[cell.css].format;
					cell.chartType = def.cols[c].chartType || def.rows[r].chartType || opt[cell.css].chartType;
					cell.series = cellSeries; //see below - could be anonymous
				}
				row = row += "<td id='" + cell.ref + "' class='"+ cell.css + "'>" + cell.value + "</td>";
				ret.cells.push(cell); //might push to linear and 2d array
				ret.cellsByRef[cell.ref]=cell;
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
		var data = updateData();
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

	return ret.init(o);
}

//*******************************************************************************
//Step 4 - Create Dashboard
//*******************************************************************************
//Defaults for report defnition
function reportDefaults(current,YTDMths){
	var ret = {};
	ret.e = function(){return state.entity();}; //this might be changed
	ret.p = function(){return state.portfolio();};
	ret.u = function(){return state.uom();};

	ret.c = function(){return current;};
	ret.l = function(){return current-1;};
	ret.ly = function(){return current-12;};
	ret.ytd = function(){return YTDMths;};

	return ret;
}

var def = reportDefaults(24,-1);

//*******************************************************************************
//Grid/Dashboard specific helpers - move to Grid
//*******************************************************************************
//Helper for OfTotal
function measureExtended(measure,suffix){
	return function(){return f(measure) + suffix};
};
var OfTotal = measureExtended(def.u,'OfTotal');

//Create a filter on a key with fn and assign label as storage key
function xfFilter(key,label,fn){
	return function(){ return { key: key, label : label, fn : fn}};
}

function ofTotalHelper(measures,suffix,argsArray){
	var uom = { uom : measureExtended(def.u,suffix) };
	var xfn = { xfn : { fn : "ofTotal", args : argsArray } };
	return $.extend({},measures,uom,xfn);
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
						.stacked(true)
						.margin({top: 30, right: 30, bottom: 30, left: 70});

				chart.key = cell.key;
				chart.source = report.source;
				var series = report.source.segment(cell.key,[0,def.c()+1]).map(function(d,i){ return { x: pouDisplay(i,"shortmonths") , y:d };});
				var series1 = series.map(function(d,i){ return { x:d.x , y:(d.y/2) };});
				//var data = series.map(function(d,i){ return { key : "Test" + i, values : d };});
				//var data = [{key:"Test1",values:series},{key:"Test2",values:series1}];
				var data = [{key:f(chart.key["mre"]),values:series}];
				var numDataPoints = data.length;
				//var widthOfpoint = width/numDataPoints;
				//var showXthPoint = 3;

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
	var range = pxf.dims[dim].range;
	var key = $.extend( true, {}, chart.key);
	if(f(chart.key[dimName])!=='_'){ //dimension must not already be filtered
		return '';
	}
	var data = [];
	for(var i=0;i<range.length;i++){
		key[dimName] = range[i];
		var series = chart.source.segment(key,[0,def.c()+1]).map(function(d,i){ return { x: pouDisplay(i,"shortmonths") , y:d };});
		var seriesName = displayNames[dimName][range[i]]|| range[i];
		data.push({key:seriesName,values:series});
	}
	//Check dim is and aggregate
	//get possible values for dim
	//iterate through key and change
	popupChart.update(data);
}
