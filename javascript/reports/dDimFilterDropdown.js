//*******************************************************************************
// Dimension Filter
//*******************************************************************************
//
function dDimFilterDropdown(options){ // wraps customised nvd3 horizontal bar chart
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
    var filterChain = [], filterChainValid = true;
    var filter;
    var expanded = false;

    // Set controls - this is configuratrion really
    var ctrls = d3.select(o.containerCtrls);
    var ctrlsId = ctrls.attr("id");
    if(ctrlsId===""){ ctrlsId = uniqueId(); }  // TODO : generate unique ID
    var inline = "display:inline-block";
    var controls = [
        /*{ id : ctrlsId + "Bk", css :  "btn btn-custom btn-sm back", style : inline, handlers : [hHelper("click","back")], text : "Undo" },*/
        { id : ctrlsId + "Rst", css :  "btn btn-custom reset", style : inline, handlers : [hHelper("click","reset")], text : "Reset" },
        { id : ctrlsId + "Sts", css :  "status", style : inline, text : "" },
        { id : ctrlsId + "DD", css :  "selectivity-input", style : inline, text : "Add Filter", createFn : createDD  },
    ];
    function hHelper(name,property){
        return { "name" : name, "handler" : function(e) { ret['property'](); } }
    }

    function createDD(el){
        var elDom = $('#'+el['id']); //console.log(getDimsValues());
        elDom.selectivity({
            allowClear: true,
            items: getDimsValues(),
            placeholder: el['text'],
            showSearchInputInDropdown: false
        }).on("change",onDDChange(elDom)); // need to add handler
        //console.log(elDom.selectivity('value'));
    }

    function onDDChange(el){
        return function(e){
            var update = {};
            var tuple = e['value'].split("|");
            //console.log(e);
            update[tuple[0]]=tuple[1]; //cannot create the update object direct
            anchor.changeAnchorPart(update);
            el.selectivity('value',null); //timing seems to be important here
        }
    }

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
        ret.dims = {};
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
            ret.dims[e['name']] = i; // add associative array
        }); // console.log(o.dims);
        state.addHandler(0,filterUpdate); // add handler to state object - fired for all anchor changes
        ret.chartData = reshapeFilterData(data);
        createChart();
        createControls(controls);
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
            filterChainValid = true;  // filterChain has been reset and is valid
            o.source.reset();
        } else if(count===1){ // one dim has changed
            var lastFilter = (dim===filterChain[filterChain.length-1]); //alert("dim:"+dim+"; FilterChain[Last]:"+filterChain[filterChain.length-1]+"; Value:"+value);
            var filterValueSelected = (value!==o.all);
            if(filterChain.length>0&&filterChainValid===true&&lastFilter===true){  // toggle off last dim
                filterCache.pop();
                filterChain.pop();
                filter=filterCache[filterCache.length-1];
                o.source.reset(filter);
                if(filterValueSelected===true){ // Dim has been changed to a filtered value - Handles setting of value from controls e.g. change portfolio from HL to BTL
                    filterCache.push(o.source.xFilter(filter,dim,value)); // add new dim JSON.parse(JSON.stringify(o.source.filter));
                    filterChain.push(dim);
                }
            } else if(filterValueSelected===true) { // filter been has selected
                if(filterChain.indexOf(dim)>0){ // check if existing filter - in which case refresh
                    filterCache = filterCache.slice(0,1);
                    filterChain.splice(filterChain.indexOf(dim),1);  // remove
                    filterChainValid = false; // Chain not valid with cache
                    filterCache.push(o.source.xFilter(filter,selected)); //reset
                } else {
                    filterCache.push(o.source.xFilter(filter,dim,value)); // add new dim JSON.parse(JSON.stringify(o.source.filter));
                    filterChain.push(dim);
                }
            } else {
                filterCache = filterCache.slice(0,1);
                filterChain = Object.keys(selected).filter(function(e,i,a){ return selected[e]!=='_'; }); // This creates a problem for status as no chain to populate status
                filterChainValid = false; // Chain not valid with cache
                filterCache.push(o.source.xFilter(filter,selected)); //reset
            }
        } else { //multiple changed - recalculate filter
            filterCache = filterCache.slice(0,1);
            filterChain = Object.keys(selected).filter(function(e,i,a){ return selected[e]!=='_'; }); // This creates a problem for status as no chain to populate status
            filterChainValid = false; // Chain not valid with cache
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
        var key = {}, selectedCount = 0;
        o.dims.forEach(function(e,i,a){
            key[e['name']] = o.state[e['name']]()||'_'; // get values from state - dims have been attached
        });
        ret.chartData = reshapeFilterData(ret.xFilter(key));
        d3.select(o.container)
            .datum(ret.chartData)
            .transition().duration(300)
            .call(ret.chart);
        // update status
        d3.select('#'+ctrlsId+"Sts").html(currentStatus(key)); // don't like the status reference
        d3.selectAll('#'+ctrlsId+"Sts div").on("click",popStatus);
        return ret;
    }

    var popStatus = function(e){
            var update = {};
            update[d3.select(this).attr("value")] = 0;
            anchor.changeAnchorPart(update);
    }

    function currentStatus(key){
        if(filterChain.length===0)
                return "";
        return  filterChain.reduce(function(r,e,i,a){ return r + div(" " + (i+1) + "."+o.dims[ret.dims[e]]['display']  + "=" + ret.decode(e,key[e]),e); }, div("Filter:",""));

        function div(text, dim){ // helper function
            return "<div style='display:inline-block' value='"+dim+"'>"+text+"</div>"
        }
    }

    // Not used at present
    function keysSelected(key){
        return Object.keys(key).reduce(function(r,e,i,a){
            if(key[e]==='_'){
                return r;
            }
            return ++r;
        },0);
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
                    p['display'] = ret.decode(e['name'],d);
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
        }); console.log(res);
        return res;
    }

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

    var getDimsValues = function(){
        // var d = reshapeFilterData(filter['aggregate']); // much more data than necessary - streamline later
        var d = ret.chartData;
        return d.map(function(e,i,a){
            return {
                'id' : e["dim"],
                'text' : e["key"],
                'submenu' : {
                    'items' : e["values"].map(function(f,j,b){
                        return {
                            'id' : e["dim"]+"|"+f["index"],
                            'text' : f["display"]
                        };
                    }),
                    'showSearchInput': false
                }
            };
        });
    }

    // Create controls for the function
    function createControls(){
        // create the controls
        controls.forEach(function(e,i,a){
            var c = ctrls.append('div')
                .attr("id",e["id"])
                .attr("class",e["css"])
                .attr("style",e["style"])
                .text(e["text"]);  // seems to work if no text field
            if(e["handlers"]){
                e["handlers"].forEach(function(f,j,b){
                    c.on(f["event"],f["handler"]);
                });
            }
            if(e["createFn"]){
                e["createFn"](e);
            }
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
