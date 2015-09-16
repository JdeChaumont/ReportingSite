//*******************************************************************************
// Dimension Filter
//*******************************************************************************
//
function dDimFilter(options){ // wraps customised nvd3 horizontal bar chart
    // Preliminary items - defaults - call base function
    var defaults = {
        state : state,
        palette : palettes['tarnish20'],
        valueFormat : rptFmtN,
        margin : {top: 10, right: 10, bottom: 30, left: 80},
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
    var currentFilter = ret.filter;
    var filterCache = [];
    var filterChain = [];
    var filter;
    var expanded = false;

    ret.expanded = function(){
        expanded=!expanded;
        ret.update();
        return expanded;
    }

    ret.init = function(options){
        // Process dims
        orderDims();
        // need to hook up to state object - create properties and values
        filter = filterCache[0] = o.source.filter;
        var data = filter['aggregate']; //console.log(data);
        o.dims.forEach(function(e,i,a){
            e['range'] = {}; // add range to dims
            var id = e['name'];
            var dim = data[id];
            var vals = ['_']; // add default value for all selected - will return 0 - should configure value
            for(var d in dim){
                vals.push(d); // put range of values
                e['range'][d] = (vals.length-1); // add range to put index for stateFilter
            }
            stateFilter(o.state,id,vals); // create stateFilter for each dim - do not need map and handlers
        });
        state.addHandler(0,filterUpdate); // add handler to state object - fired for all anchor changes
        ret.chartData = reshapeFilterData(data);
        createChart();
        return ret;
    }

    function filterUpdate(stateObj,refNo){
            return ret.update;
    }

    // general purpose entry point for filter  - to be renamed to xFilter (xFilter to oneFilter or fastFilter)
    ret.xFilter = function(key){ // key sourced from state manager
        var t = debugTimer("dDimFillter.xFilter");
        var delta={}, count=0, filtered=false, d, dim, v, s, value, selected = {};
        if(key){
            o.dims.forEach(function(e,i,a){ //console.log(e);
                d = e['name'];
                v = key[d];
                s = filter['selected'][d];
                selected[d] = s; // get currently selected value
                if(v){
                    if(v!==s){ // filtered value has changed
                        count++; //console.log("v:"+v+";s:"+s);
                        dim = d; // store selected dim
                        value = v; // store selected value
                        delta[d] = v; // capture changes
                        selected[d] = v;  // update selected
                    }
                }
                if(selected[d]!==o.all){
                    filtered=true;
                }
            });
        }
        t.lap("key parsed");
        if(count===0){ // THIS HAS BECOME REALLY HORRIBLE AND NEEDS TO BE REVIEWED - POSSIBLY MOVED TO FILTER
            // do nothing
        } else if((!key&&filterCache.length>1)||(count>0&&filtered===false)){ // reset to no filter
            filterCache = filterCache.slice(0,1);
            filterChain = [];
            o.source.reset();
        } else if(count===1){ // one dim has changed
            var lastFilter = (dim===filterChain[filterChain.length-1]); //alert("dim:"+dim+"; FilterChain[Last]:"+filterChain[filterChain.length-1]+"; Value:"+value);
            var filterValueSelected = (value!==o.all);
            if(filterChain.length>0&&lastFilter===true){  // toggle off last dim
                filterCache.pop();
                filterChain.pop();
                filter=filterCache[filterCache.length-1];
                o.source.reset(filter);
                if(filterValueSelected===true){ // Dim has been changed to a filtered value
                    filterCache.push(o.source.xFilter(filter,dim,value)); // add new dim JSON.parse(JSON.stringify(o.source.filter));
                    filterChain.push(dim);
                }
            } else if(filterValueSelected===true) { // filter has selected
                if(filterChain.indexOf(dim)>0){ // check not existing filter
                    filterCache = filterCache.slice(0,1);
                    filterChain = [];
                    filterCache.push(o.source.xFilter(filter,selected)); //reset
                } else {
                    filterCache.push(o.source.xFilter(filter,dim,value)); // add new dim JSON.parse(JSON.stringify(o.source.filter));
                    filterChain.push(dim);
                }
            } else {
                filterCache = filterCache.slice(0,1);
                filterChain = [];
                filterCache.push(o.source.xFilter(filter,selected)); //reset
            }
        } else { //multiple changed - recalculate filter
            filterCache = filterCache.slice(0,1);
            filterChain = [];
            filterCache.push(o.source.xFilter(filter,selected)); //reset
        }
        t.lap("cache updated");
        filter = filterCache[filterCache.length-1];
        return filter['aggregate'];
    }

    // function to requery and update
    ret.reset = function(){
        var update = {};
        o.dims.forEach(function(e,i,a){
            //console.log(i); console.log(e); console.log(o.state[e['name']]());
            if(o.state[e['name']]()!=='_'){
                update[e['name']] = 0; // get values from state - dims have been attached
            }
        });
        anchor.changeAnchorPart(update);
    }
    // function to requery and update
    ret.back = function(){
        var update = {};
        update[filterChain[filterChain.length-1]] = 0;
        anchor.changeAnchorPart(update);
    }

    // function to requery and update
    ret.update = function(){
        // function to update - called from state manager
        var key = {};
        o.dims.forEach(function(e,i,a){
            key[e['name']] = o.state[e['name']]()||'_'; // get values from state - dims have been attached
        });
        ret.chartData = reshapeFilterData(ret.xFilter(key));
        d3.select(o.container)
            .datum(ret.chartData)
            .transition().duration(300)
            .call(ret.chart);
        return ret;
    }

    function orderDims(){ // add an object to sort
        var k,d,v;
        o.dims.forEach(function(e,i,a){
            if(e['order']){ //order supplied?
                if(typeof e['order']!=="string"){ // ordered array
                    e['dimOrder'] = {};
                    e['order'].forEach(function(f,j,k){
                        v =  (o.dimsEncoded&&o.dimsEncoded[e['name']]) ? o.dimsEncoded[e['name']]['values'][f] || f : f;
                        e['dimOrder'][v] = j;
                    });
                }
            }
        });
    }

    // Reshape output from filter to work in bar chart
    function reshapeFilterData(data){
        var p,d,ord,sort,res = [], s = {}, filtered = {};
        // Establish filtered dimensions for highlighting
        for(var k in filter['selected']){
            if(filter['selected'][k]!==o.all){ filtered[k] = true; }
        }
        o.dims.forEach(function(e,i,a){
            var dim, ordered = [], unordered = [];
            if(expanded||!e['hide']){ // New condition to ignore hidden dims
                dim = data[e['name']];
                if(e['order']&&(typeof e['order']==="string")) {
                    sort = e['order'];
                } else{
                    sort = null;
                }
                s = { 'key':e['display']||e.name, 'dim' : e.name, 'values':[], 'sort' : sort };
                ord = e['dimOrder'];
                for(d in dim){ //could push and then order
                    p = { 'label' : d, 'index' : e['range'][d],'value' : dim[d]['sum'][def.u()][def.c()] }; // NEEDS TO CHANGE HARD CODED INDEX
                    p['display'] = (o.dimsEncoded&&o.dimsEncoded[e['name']]) ? o.dimsEncoded[e['name']]['encoded'][d]||d : d;
                    if(p['value']>0&&filtered[e.name]) { p['filtered']=true; }
                    if(ord&&ord[d]>=0){ // 0 was being evaluated as not found
                        ordered[ord[d]] = p;
                    } else {
                        unordered.push(p);
                    }
                }
                s['values'] = ordered.concat(unordered).filter(function(e,i,a){ return e !== undefined });
                if(e["colours"]){
                    s['values'].forEach(function(f,j,b){
                        f['color']=e.colours[j];
                    });
                }
                res.push(s);
            }
        });
        return res;
    }

    // get new filter from state
    // compare with existing filter
    // if no difference - do nothing
    // if one difference  - re-run filter
    //
    // else reset

    function createChart(){
        nv.addGraph(function() {
          ret.chart = nv.models.multiBarHorizontalFilterChart()
            //.x(function(d) { return d.label }) //required?
            .y(function(d) { return d.value }) //required?
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

            ret.chart.multibar.dispatch.on('elementClick',function(e){
                var update = {};
                var value = e['point']['index'];
                //console.log(e);
                if(e['point']['label']===o.state[e['series']['dim']]()){ // check if value is already selected
                    value = 0; // set to unselected
                }
                update[e['series']['dim']]=value; //cannot create the update object direct
                anchor.changeAnchorPart(update);
            });

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

function stateFilter(stateObj,id,states,map,handlers){ //code should be segmented
    var values = {}, schema = {}, selectors = [], s = stateObj || state, h = "stateHandlers", refNo;

    selectors = states.map(function(e,i,a){
        values[i] = map ? map[i] : e;
        schema[i] = true;
        return { name : e , value : i };
    });

    refNo  = s.addControl(id,values,schema,stateProperty); // no default control handler required

    if(handlers){
        handlers.forEach(function(e,i,a){ stateObj.addHandler(refNo,e); });
    }
    return refNo; //not sure there is any need to return an object
}

/* Format of objects passed in...
    state : <?> //should we hook up handlers directly
    source : <filter> //not provider
    container : "",
    dims :
        [
            {
                dim : <dim1>,
                display : '',
                order : < null, 'asc', 'desc', [<val1>,<val2>...],
                colours : paletteSelect(palette,reverse)
            }
        ]

*/

var palettes = {};
//palettes['portfolio'] = { 'HL' : '#f58025', 'BTL' : '#221f73', 'CRE' : '#006393', 'SB' : '#777777', 'UNS' : '#333333', 'CHL' : '#0091bf'};
palettes['portfolio'] = ['#f58025', '#221f73', '#006393', '#777777', '#333333', '#0091bf'];
//palettes['binary'] = ["#99000d","#989898"];
palettes['binary'] = ["#08306b","#6baed6"];
palettes['tarnish20'] = ["#3C4244","#D2C1C2","#83817E","#A6BCC3","#556469","#95929D","#726B78","#AEACBB","#544953","#BBBBB3","#707E84","#CBC5D1","#CBB7AE","#949999","#696D6E","#C3C5C8","#7C8A8E","#686770","#C4BBB2","#596164"];
palettes['shades20'] =["#D4E2B2","#2F271B","#8F8E8B","#BCA377","#F2F7E8","#FCD2A3","#B9BFB5","#8DA286","#B1B98D","#B4A795","#EEEBA9",
"#E9DCB7","#F3F8D6","#ACC8A3","#CBD8C8","#CAA383","#E9E2D5","#A6BAB1","#D4EBBF","#C5AF7C"];
palettes['regions'] = ["#395692","#91B2D9","#2F699D","#915B5B","#CC7F80","#4B564E","#9DB8A4","#5A4C4C"];
palettes['mekkoA'] = createMekkoColours(['Oranges','Blues','Greys','Reds','Greens','Purples','Set1','Set2','Set3','Pastel1','Pastel2'], colorbrewer, 8, 7);
palettes['mekko'] = ['#001144','#202020','#440000','#004400','#110044','#004444','#440011','#000044','#444400','#440044','#114400','#441100'];
var paletteSelector = function(palette,reverse){
    return function(e,i){
            return palette[e]?palette[e]:palette[(reverse?palette.length-i:i)];
    }
}

function createMekkoColours(colours,source,range,index){
    return colours.map(function(e,i,a){
        return source[e][range][index];
    });
}
