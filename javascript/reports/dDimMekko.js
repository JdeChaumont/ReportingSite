//*******************************************************************************
// Mekko Chart Manager
//*******************************************************************************
function dDimMekko(options){ // wraps customised nvd3 horizontal bar chart
    // Preliminary items - defaults - call base function
    var defaults = {
        state : state,
        palette : palettes['tarnish20'],
        valueFormat : rptFmtN,
        margin : {top: 10, right: 10, bottom: 30, left: 30},
        showValues : true,
        transitionDuration : 250,
        showControls : false,
        showLegend : false,
        stacked : true,
        tooltips : true,
        all : '_'
    };
    var ret = { 'chart' : {}, 'chartData' : {}};
    var o = ret.options = extend(defaults,options); // merge defaults and options
    var chart  = ret.chart;
    var chartData = ret.chartData;
    var filter;
    var chartCreated = false;
    ret.dims = {};

    ret.init = function(options){
        // Process dims
        orderDims();
        var data = o.source.filter['aggregate']; //console.log(data);
        o.dims.forEach(function(e,i,a){
            ret.dims[e['name']] = i; // from dFilter but not using "val"
            ret.dims[i] = e['name']; //ordered map
            e['range'] = {}; // add range to dims
            var id = e['name'];
            var dim = data[id];
            var vals = ['_']; // add default value for all selected - will return 0 - should configure value
            for(var d in dim){
                vals.push(d); // put range of values
                e['range'][d] = (vals.length-1); // add range to put index for stateFilter
            }
        });
        return ret;
    }

    ret.getCurrentFilter = function(){
        //go to filterSelectors - should set these on initalisation
        return o.filter.map(function(e,i,a) { return f(e); } );
    }

    // function to requery and update
    ret.update = function(){ // return 0;
        // function to update - called from state manager
        filter = ret.getCurrentFilter(); //console.log(filter);
        data = o.source.groupBy(filter); //console.log(data);
        ret.chartData = reshapeFilterData(data); //console.log(ret.chartData);
        if(filter.filter(function(e,i,a) { return i==filter.lastIndexOf(e); }).length===filter.length){
            if(chartCreated===false){
                createChart();
                chartCreated===true;
            } else {
                d3.select(o.container)
                    .datum(ret.chartData)
                    .transition().duration(300)
                    .call(ret.chart);
            }
        }
        return ret;
    }

    function orderDims(){ // add an object to sort
        var k,d,v;
        o.dims.forEach(function(e,i,a){
            if(e['order']){ //order supplied?
                if(typeof e['order']!=="string"){ // ordered array
                    e['dimOrder'] = {};
                    e['order'].forEach(function(f,j,k){
                        v =  encode(e['name'],f);
                        e['dimOrder'][v] = j;
                    });
                }
            }
        });
    }

    function reshapeToNestedArrays(data){
        var res = [], node, tree = {}, d;
        for(var e, i=0, a=data, n=a.length; i<n; i+=1){ e = a[i]; // e is object
            node = tree;
            for(var f, j=0, b=filter, p=b.length; j<p; j+=1){ f = b[j]; // selected dimensions
                d = e[f];
                if(!node[d]){
                    node[d] = {};
                }
                node = node[d];
            }
            node['values'] = e['values'];
            node['value'] = e['values'][def.u()][def.c()]; // should be parameterised
        }
        return tree;
    }

    function orderData(data,level){
        var res, ordered = [], unordered = [];
        var dim = filter[level];
        var e = o.dims[ret.dims[filter[level]]];
        var ord = e['dimOrder'];
        for(var d in data){
            var l = level;
            var s = { 'key' : dim,  'label' : d, 'display' : decode(dim,d), 'index' : e['range'][d] , 'value' : data[d]['value'] || 0 };
            if(!data[d]['values']) { s['values'] = data[d]['values'] || orderData(data[d],++l); }
            if(ord&&ord[d]>=0){ // 0 was being evaluated as not found
                ordered[ord[d]] = s;
            } else {
                unordered.push(s);
            }
            res = ordered.concat(unordered).filter(function(e,i,a){ return e !== undefined }); // filter to compact array
            if(e["colours"]){
                res.forEach(function(f,j,b){
                    f['color']=e.colours[j];
                });
            }
        }
        return res;
    }

    function decode(dim,val){
        return (o.dimsEncoded&&o.dimsEncoded[dim]) ? o.dimsEncoded[dim]['encoded'][val]||val : val;
    }

    function encode(dim,val){
        return (o.dimsEncoded&&o.dimsEncoded[dim]) ? o.dimsEncoded[dim]['values'][val]||val : val;
    }

    function reshapeFilterData(data){
        return orderData(reshapeToNestedArrays(data),0);
    }

    function createChart(){
        nv.addGraph(function() {
          ret.chart = nv.models.mekkoChart()
            //.x(function(d) { return d.label }) //required?
            //.y(function(d) { return d.value }) //required?
            .margin(o.margin)
            .showValues(o.showValues)
            .valueFormat(o.valueFormat)
            .tooltips(o.tooltips)
            .color(o.palette)
            .transitionDuration(o.transitionDuration)
            .showControls(o.showControls)
            .showLegend(o.showLegend)
            .stacked(o.stacked);

          ret.chart.yAxis
            .tickFormat(o.valueFormat);

            //console.log(ret.chartData);

            d3.select(o.container)
                .datum(ret.chartData)
                .call(ret.chart);

          nv.utils.windowResize(ret.chart.update);

          ret.chart.dispatch.on('stateChange', function(e) { nv.log('New State:', JSON.stringify(e)); });

          return ret.chart;
        });
    }
    return ret.init(o);
}
