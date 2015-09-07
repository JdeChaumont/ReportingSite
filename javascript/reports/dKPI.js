//*******************************************************************************
// Title
// Figure
// Sparkline
// Stats - MoM, YoY etc., & Derived metrics
// Stacked column
/*
 options = {
 	container : <selection>,
	source : <dataSource>,
	data : {<keys>}, // might want core and keys for derived
	periods : 13, // ?
	title : '',
	barOrLine : , // maybe make this selectable
	colours : ,
	handlers : ?,
	cssPage : <prefix to select different styles?>
 }

container : '#kpi',
source : [pxf, another],
data = { // shoudn't overthink this - could be any format - can be flexible in accessor creation
	a : [{ mre : 'bal', prt : 'HL' }], // assume src 0
 	b : [{ src : 0,  mre : 'bal', prt : 'HL' }],
	c : [{ src : 1,  mre : 'bal', prt : 'HL' }],
},
objects = {
	sparkline : { object : nv.models.sparklinePlus  },
	chart : { object : nv.models.stackedBar }
},
cells = [ // create a div for each
 	{ type : 'title', css : 'title', style :  '', value : "#", tooltip : 'Number of accounts' }
	{ type : 'cell', css : 'kpi', style :  '', value : function(d){ return d["a"][0].slice(def.c)[0]; }, valueApply : [sum,rptFmtN], tooltip : 'I'm a kpi'}
	{ type : 'chart', css : 'sparkline', style :  '', value : function(d){ return d['a'][0].slice(def.c,-13) }, init : createSparkline, object : nv.models.sparklinePlus, tooltip : 'I'm a sparkline'' } }
	{ type : 'cell', css : 'stat', style :  '', value : function(d){ return d }, tooltip : 'I don't know', options : { format : rptFmtN, type : sum, index : def.c } }
	{ type : 'chart', css : 'chart', style :  '', value : function(d){ return d['b'] }, object : 'chart', tooltip : 'I'm a chart' } }
 ]

*/
//*******************************************************************************
//KPI visualisation function - Helper functions
//*******************************************************************************
// Handler for KPI cell clicked
function kpiClicked(source){
	return function(){
		//select, bind and transition
		var rpt = {}; //rpts[this.id.split('_')[0]];
		rpt['source'] = source;
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
}
//Convert Cell Data into Sparkline series
function cellSeries(data){
	var result = []; //console.log(data);
	for(var i=0;i<data.length;i++){
		result.push({x:i+1,y:data[i]});
	} //console.log(result);
	return result;
}

function createSparkline(model){
	return function (cell){
		var chart;
		nv.addGraph(function(){
			chart = model()
							.showValue(false)
							.margin({top: 1, right: 20, bottom: 1, left: 20}); // not recognising the margins???

			chart.xTickFormat(function(d){return d;}); // need to a parameterise
			chart.yTickFormat(function(d){return fmt(',.1f','m')(d);}); // need to a parameterise

			cell['container'].html("<svg id=" + cell.id + "></svg>");

			d3.select('svg#'+cell.id) // reset container to svg created above
				.datum(cell.value(cell['data']))
			.transition().duration(200)
				.call(chart);

			nv.utils.windowResize(chart.update);

			cell.chart = chart;
			return chart;
		});
		// Update cell properties
		cell.chart = function(){ return chart; } // issue with returning chart - this seems to work
		cell.update = function(){ // this will refer to cell
					d3.select('svg#'+this['id']).datum(this.value(this['data']))
					.transition().duration(200)
						.call(this.chart); // console.log("sparkline update complete");
		}
	}
}

function createStacked(model){
	return function (cell){
		var chart;
		nv.addGraph(function(){
			chart = model()
							//.showValue(false)
							.showControls(false)
							.showLegend(false)
							.showXAxis(false)
							.showYAxis(false)
							.stacked(true)
							.groupSpacing(0)
							.color(palettes['grads'])
							.margin({top: 1, right: 1, bottom: 1, left: 1}); // not recognising the margins???

			//chart.xTickFormat(function(d){return d;}); // need to a parameterise
			//chart.yTickFormat(function(d){return fmt(',.1f','m')(d);}); // need to a parameterise

			cell['container'].html("<svg id=" + cell.id + "></svg>");

			//console.log(cell.value(cell['data']));
			d3.select('svg#'+cell.id) // reset container to svg created above
				.datum(cell.value(cell['data']))
			.transition().duration(200)
				.call(chart);

			nv.utils.windowResize(chart.update);

			cell.chart = chart;
			return chart;
		});
		// Update cell properties
		cell.chart = function(){ return chart; } // issue with returning chart - this seems to work
		cell.update = function(){ // this will refer to cell
					d3.select('svg#'+this['id']).datum(this.value(this['data']))
					.transition().duration(200)
						.call(this.chart); // console.log("sparkline update complete");
		}
	}
}

function createCell(){ // assign an update function and execute
	return function(c) { //console.log('cell init called');
		c['update'] = function(){
			var res = c['value'](c['data']);
			if(c['valueApply']){ // functions to apply to value
				res = c['valueApply'].reduce(function(r,e,i,a){
							return e(r);
						},
						res
					)
			}
			return c['container'].html(res);
		}
		c['update']();
	}
}

//*******************************************************************************
//KPI visualisation function
//*******************************************************************************
function dKPI(options){  // should change this to dGrid - need to change references to it
	var ret = {};

	var defaults = {
		data : {},
		sparkline : { init : createSparkline(nv.models.sparklinePlus) },
		sparkbar : { init : createSparkline(nv.models.sparkbarPlus) },
		stacked :  { init : createStacked(nv.models.stackKpiChart) },
		cell : { init : createCell() }
	}

	var o = ret.options = extend(defaults,options); // returns new object - may have nexted issue

	ret.init = function(options){
		ret.container = d3.select(o.container); // create reference to DOM object - may have to consider refresh/redraw scenarios
		ret.populated = false;
		ret.source = o.source;
		//ret.dim = {};
		//orderDims();
		updateData();
		createCells();
		return ret;
	}

	ret.cells = []; // cells will persist with reference to DOM object
	ret.cellsByRef = {};
	var prefixId = '';
	// Helper functions
	function prefix(id){
		//return def.prefix + id;
		return prefixId+ id;
	}

    ret.decode = function(dim,value){
        if(!o.dimsEncoded){
            return value;
        }
        return o.dimsEncoded[dim] ? o.dimsEncoded[dim]['encoded'][value]||value : value;
    }

    function orderDims(){ // add an object to sort
        var k,d,v;
        o.dims.forEach(function(e,i,a){
            if(e['order']){ //order supplied?
                if(typeof e['order']!=="string"){ // ordered array
                    e['dimOrder'] = {};
                    e['order'].forEach(function(f,j,k){
                        v =  ret.decode(e['name'],f);
                        e['dimOrder'][v] = j;
                    });
                }
            }
			ret.dims[e['name']] = i;
        });
    }

	//need to consider checking fields are available
	function createCells(){
		ret.cells = []; // flush cells
		ret['container'].html(''); // Clear out existing visualisation
		//{ type : 'chart', css : 'sparkline', style :  '', value : function(d){ return d['a'][0].slice(def.c,-13) }, object : 'sparkline', tooltip : 'I'm a sparkline'' } }
		o.cells.forEach(function(e,i,a){
			var cell = extendNew({},e);
			cell['id'] = o.name+"_"+i;
			cell['data'] = o.data;
			cell['container'] = ret.container.append('div')
				.attr('id',cell['id'])
				.attr('class',prefix(cell['css']))
				.attr('style',cell['style'])
				.html(cell['css']);
			if(cell['tooltip']){
				cell['container']
					.attr('title',cell['tooltip']);
			}
			if(e.init){
				e.init(cell);
			} else {
				if(o[cell['type']]){
					if(o[cell['type']]['init']){
						o[cell['type']]['init'](cell);
					}
				} else {
					// console.log('No Cell Init found')
					cell['update'] = function(){
						cell['container'].html(updateFn());
					}

					function updateFn(){
						if(typeof(cell['value'])==='function'){
							return cell['value'](cell['data']);
						}
						return f(cell['value'])
					}

					cell['update']();

				}
			}
			ret.cells.push(cell);
			ret.cellsByRef[cell.id]=cell;
			//Handlers
			var hdl = cell['eventHandlers'];
			if(hdl){
				for(k in hdl){ // console.log(k);
					cell['container']
						.on(k,hdl[k])
				}
			}
		}); // console.log(ret.cells);

		return;
	}

	/*ret.sort = function(cell){
		var old = cellValue;
		return function(d){
			var x = cell.value(d).sort(function(a,b){
				var i = ret.dims[a['key']], j = ret.dims[b['key']];
				var x = o.dims[ret.dims[a['key']]['dimOrder'];
				var y = o.dims[ret.dims[a['key']]['dimOrder'];
				return x < y;
			})
		};
	}*/

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

	// Updates data array
	function updateData(){
		for(var k in o.data){
			var d = o.data[k];
			if(d['key']){
				if(typeof(d['key'])==='function'){ // check to see if function - should we allow pre-configured arrays?
					d['value'] = d['key'](o.source); // console.log(d['value']);
				} else {
					d['value'] = o.source.segment(d['key']);
				} // console.log(d['key']); console.log(d['value']);
			}
		}
	}

	function updateCells(){
		for(var e, i=0,a=ret.cells,n=a.length; i<n; i++) { e = a[i];
			// console.log(e); // console.log(e.chart); console.log(e.update);
			e.update(); // add update function to cells?
		}
	}

	ret.update = function(){
		if(ret.populated===false){
			createCells();
			ret.populated = true;
		}
		// Temp stuff for testing
		function rdm(min,max){
			return Math.floor(Math.random() * (max-min+1)) + min;
		}
		function arraySequence(n){
			var res = [];
			for(var i=0;i<n;i++){
				res.push({x:i+1,y:rdm(1,15)});
			}
			return res;
		}
		//o.data['core']['value'] = arraySequence(rdm(5,10));
		//o.data['core']['value'] = [{x:1,y:7},{x:2,y:8},{x:3,y:9},{x:4,y:2},{x:5,y:3},{x:6,y:8},{x:7,y:12}];
		updateData(); // console.log(ret);
		updateCells(); // no separate chart update
	}
	// Redraw/rebuild table - allows for dynamic setting of rows i.e.. items under a grouping e.g. counties under province
	ret.redraw = function(){ // update with parameter won't work well as update is generally parameterless
		createCells();
		ret.populated = true;
		updateCells();
		populateCharts();
	}

	return ret.init(options);
}


/*

function div(id,css){
	return "<div id ='"+ id + "' class='" + css +"'>"+css+"</div>"
}
function createStructure(){
	ret.container = d3.select(o.container);
	//var structure = ['title','kpi','sparkline','stats','chart'].reduce(function(r,e,i,a){
	var structure = ret.cells.reduce(function(r,e,i,a){  // SHOULD WE POPULATE NEW CELLS ARRAY OR ADD TO CELLS OBJECTS PASSED IN
		return r += div(o.container.substr(1)+i,prefix(e['css']));  // POSSIBLY ADD REFERENCE TO DOM OBJECT FOR UPDATE
	},""); console.log(structure);
	ret.container.html(structure);
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


*/
