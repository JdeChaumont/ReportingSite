//*******************************************************************************
//
//*******************************************************************************
function dFilter(options){
    //Too many characters/values set
    var def =  {
        all : '_', //used for where no filter on dimension
        fn : 'fn', //used for function branching
        result : fillArray, //to be a function - called for default result and map reduce
        tgt : 'mre',
        val : ['bal','count'], //needs to be an array
        data : [],
        vProperty : null, // values are contained within a specific property
        vDynamic : null, // value is dynamic
        vArray : null, // values are returned as an array
        pNested : null,
        mreInDim : false, // measure is a dimension (in rows)
        periods : 1,
        cubes : [],
        measures : []
    }
    var ret = {}; //child filters will refer to base
    var o = ret.options = extend(def,options); // merge defaults and options
    var filter;

    ret.vAccessor = function(obj){ return obj; };
    ret.vSelect = function(obj,key,tgt) { return obj; };
    ret.vSum = function(r,e){ // amended as was passing by value
        for(var i=0;i<r.length;i++){
            r[i]+=e;
        }
        return r;
    }
    ret.skip = function(v,k){ return v===o.all; };
    ret.pAccessor = function(obj,prp) { return obj[prp] || 'null'; };

    ret.init = function(options){
        // Update accessors
        if(o.vProperty!==null){
            ret.vAccessor = function(obj){
                return obj[o.vProperty];
            }
        }
        if(o.vDynamic!==null){
            ret.vSelect = function(obj,key,tgt){
                return obj[key[tgt]];
            }
        }
        if(o.vArray!==null){
            ret.vSum = function(r,e){
                for(var i=0;i<r.length;i++){
                    r[i]+=e[i];
                }
                return r;
            }
        }
        if(o.pNested!==null){
            ret.pAccessor = function(obj,prp){
                return wlk(obj,prp) || 'null'; //wlk is expensive - only use if necessary
            }
        }
        if(o.mreInDim===false){
            ret.skip = function(v,k){
                return (v===o.all||k===o.tgt);
            }
        }
        // create public properties
        ret.dims={};
        ret.filters = []; // replacement for indexes and filters
        filter = ret.filter = ret.filters[0] = { 'population' : o.data, 'indexes' : {}, 'aggregate' : {}, 'selected' : {} };
        // Initialise Indexes Object for each dimension - should indexes and dims be combined
        for(var e, i=0, a=o.dims, n=a.length; i<n; i+=1){ e = a[i];
            // incorporate dim breakdown
            ret.dims[e] = { 'val' : i }; //associative map
            ret.dims[i] = { 'val' : e }; //ordered map
            filter['indexes'][e] = { "range" : [] }; // inflate filters
            filter['aggregate'][e] = {}; //could just use filter object
            filter['selected'][e] = o.all;
        }
        // Helper for filtering
        o.ndx = [];
        // Set key to summarise values for
        o.tgtKey = [];
        //console.log(o.val);
        for(var e, i=0, a=o.val, n=a.length; i<n; i+=1){ e = a[i];
            var tgtKey = {};
            tgtKey[o.tgt] = e;
            o.tgtKey.push(tgtKey);
        }
        ret.initEach(); // run for each record
        filter['population'] = o.ndx;
        //console.log(JSON.stringify(dimsFilterHelper2(filter['indexes'])));
        ret.cube = []; //20150504 New functionality for creating partial cubes
        for(var e, i=0, a=o.dims, n=a.length; i<n; i+=1){ e = a[i];
            // initialise cube for all dimensions (less one)
            ret.cube[i] = [];
        }
        for(var e, i=0, a=o.cubes, n=a.length; i<n; i+=1){ e = a[i];
            var seg = {};
            seg['bitMask'] = ret.bitEncode(e);
            seg['population'] = ret.groupBy(e,o.measures);  // must cube all measures - need better way
            ret.cube[e.length].push(seg);
        }
        return ret;
    }
    // Encode dimensions selected in bit
    ret.bitEncode = function (dims){
        var r = 0;
        for(var e, i=0, a=dims, n=a.length; i<n; i+=1){ e = a[i];
            r+= (1 << ret.dims[e]['val']);
        }
        return r;
    }

    // Set up to allow override
    ret.initEach = function(){
        var ndx, agg; //dim
        // Perform functions on each record
        for(var e, i=0, a=o.data, n=a.length; i<n; i+=1){ e = a[i]; //console.log(e);
            // Add calculated/group dimensions to each object
            if(o.dimsToAdd){
                for(var f, j=0, b=o.dimsToAdd, p=b.length; j<p; j+=1){ f = b[j];  //e,i,a for dimsToAdd - f = dim To Add
                    e[f["name"]] = f["grpFn"](wlk(e,f["derivedFrom"]));
                }
            }
            // Inflate indexes for each record
            for(var f, j=0, b=o.dims, p=b.length; j<p; j+=1){ f = b[j];  // f = dim To Index
                var v = ret.pAccessor(e,f);
                //var v = e[f];
                ndx = filter['indexes'][f];
                agg = filter['aggregate'][f];
                if(!ndx[v]){
                    ndx[v] = { "length" : 0, "ref" : {} };
                    agg[v] = { 'sum' : {}, 'count' : 0 };
                    for(var g, k=0, c=o.val, q=c.length; k<q; k+=1){ g = c[k];
                        agg[v]['sum'][g] = o.result(0,o.periods);
                    }
                    ndx.range.push(v);
                }
                // Update Filter Object
                ndx[v]["ref"][i] = 1;
                ndx[v]["length"]++;
                agg[v]['count']++;
                for(var g, k=0, c=o.val, q=c.length; k<q; k+=1){ g = c[k];
                    ret.vSum(agg[v]['sum'][g],ret.vSelect(ret.vAccessor(e),o.tgtKey[k],o.tgt)); // needs to be parameterised
                    //ret.vSum(agg[v]['sum'][g],ret.vSelect(e[o.vProperty],o.tgtKey[k],o.tgt));
                }
            }
            o.ndx[i] = i;
        }
    }

    //New Reduce Functionality
    ret.objInKey = function (obj,key){
        res=true;
        for(var k in key){
            var v=key[k];
            if(ret.skip(v,k)===false){ //should be o but confusing it with - assumes tgt not in key
                var o = ret.pAccessor(obj,k);
                //var o = obj[k];
                if(v.fn){
                    res=v.fn(o);
                } else {
                    if(o){
                        res=((o===v)||(+o===+v));
                    } else { return false; } //value key with no corresponding key in object
                }
            }
            if(res===false){ return false };
        }
        return true;
    }
    // Function to filter the entire population based on the indexes available - works on categorical basis
    ret.filterData = function(key,keys,filter){ //should always be a key of the net selected dimensions (no all/'_')
        //return a filtered set of data based finding index for key and value
        var keys = keys || Object.keys(key).filter(function(e,i,a){ return ret.skip(key[e],e)===false; }); // array of valid selected dimensions
        var indexes = ret.filter['indexes']; // if(print===true){ console.log(JSON.stringify(ret.filter['indexes']));}
        var filtered, remKey = {}, ndx = [];
        for(var e, i=0, a=keys, n=a.length; i<n; i+=1){ e = a[i];
            if(indexes[e][key[e]]){ // look for index for key and key value
                ndx.push(indexes[e][key[e]]);
            } else {
                remKey[e] = key[e]; // if key not found in index - set-up 2nd stage filter
            }
        } //console.log(key);
        if(ndx.length===0){ //console.log("No index found");
            filtered = ret.filter['population']; // no matching indexes found so return full data set
        } else {
            ndx.sort(function(a,b){a.length<b.length}); //order by smallest index
            filtered = Object.keys(ndx[0]["ref"]); // set to array of keys of smallest index
            for(var e, i=0, a=ndx.slice(1), n=a.length; i<n; i+=1){ e = a[i];
                filtered = filtered.filter(function(f,j,b){ return e["ref"][f]; }); // performed better than loop
            }
        }
        //return filtered.map(function(e,i,a){ return o.data[e]; }).filter(ret.kFilter(remKey)); //returns array of objects - may remove length at this point
        return map(filtered,ret.kFilter(remKey));
    }
    // Function to filter the entire population based on the indexes available - works on categorical basis
    ret.filterDataForValues = function(key){ //should always be a key of the net selected dimensions (no all/'_')
        //return a filtered set of data based finding index for key and value
        var filtered, remKey = {}; //console.log("filterDataForValues"); console.log(key);
        // Use lower dimension cube if has required dimensions
        var keys = Object.keys(key).filter(function(e,i,a){ return ret.skip(key[e],e)===false; }); // array of valid selected dimensions
        var filtered = ret.cubePopulation(keys); // get lowest dimension cube if useful
        if(filtered!==null) { // use returned lower dimension dataset
            //console.log("cube used"); console.log(key);
            keys.forEach(function(e,i,a){ remKey[e] = key[e]; });
            return filtered.filter(ret.kFilter(remKey));
        }
        return ret.filterData(key, keys, ret.filter);

    }
    ret.cubePopulation = function(dims){
        if(o.cubes.length>0){
            var dimMask = ret.bitEncode(dims);
            for(var e, i=dims.length, a=ret.cube, n=a.length; i<n; i+=1){ e = a[i];
                for(var f, j=0, b=e, p=b.length; j<p; j+=1){ f = b[j];
                    //console.log(i);console.log(f['bitMask']);console.log(dimMask);console.log(f['bitMask'] & dimMask);
                    if((f['bitMask'] & dimMask)===dimMask) { // bitwise comparison
                        return f['population'];
                    }
                }
            }
        }
        return null;
    }

    // Map function using loop to filter data set
    function map(index,include){
        var res = [];
        for(var e, i=0, a=index, n=a.length; i<n; i+=1){ e = a[i];
            filter(o.data[e]);
        }
        return res;
        //Helper method - better than assigning variable within loop
        function filter(obj){
            if(include(obj)){
                res.push(obj);
            }
        }
    }
    // may rename to get measures
    ret.getValues = function(key){ //same interface as previous - key has already been processed though fullkey function
        var population;
        //if(print===true){ console.log(JSON.stringify(key));}
        //if(print===true){ console.log(JSON.stringify(filter['indexes']));}
        if(Object.keys(key['subFilter']).length>0){
            population = ret.getPopulation(key);
        } else if(!key['all']){
            population = ret.filterData(key['filter'],null,ret.filter);
        } else {
            population = ret.filterDataForValues(key['filter']);
        }
        return {
            id : key['id'], // id string
            key : key['obj'], // full key
            filter : key['filter'], //only filtered dimensions
            value : ret.valuesReduce(population,key['filter']) // was ret.keyReduce
        }
    }
    // function to return population of array objects without summarisation
    ret.getPopulation = function(key){ // amended to take full key and deal with subFilter
        var res = ret.filterData(key['filter'],null, (key['all'] ? ret.filter : filter));
        if(key['subFilter']){
            res = res.filter(ret.kFilter(key['subFilter']));
        }
        return res;
    }
    ret.valuesReduce = function(population,key){
        var res = o.result(0,o.periods);
        for(var e, i=0, a=population, n=a.length; i<n; i+=1){ e = a[i];
            sum(e);
        }
        return res;
        //Helper method - better than assigning variable within loop
        function sum(obj){
            var v = ret.vSelect(ret.vAccessor(obj),key,o.tgt);
            if(v){ret.vSum(res,v);}
        }
    }
    // filter used downstream
    ret.kFilter =function(key){
        return function(obj,i,a){
            return ret.objInKey(obj,key);
        }
    }
    // keyReduce is new function - does not overwrite - does not need to be on the object
    ret.keyReduce = function(key){
        return function(res,obj,i,a) {
            if(obj[o.val[0]]){
                res.push(obj[o.val[0]]); // no way to pass o.val in except at init - CURRENTLY BROKEN
            }
            return res;
        }
    }
    // Helper to provide range for indexed dimension
    ret.range = function(dim){
        return filter['indexes'][dim]['range'];
    }
    // reset filter
    ret.reset = function(lastFilter){
        if(!lastFilter){
            ret.filter = ret.filters[0];
        } else {
            ret.filter = lastFilter;
        }
    }
    // Entry point for filter update
    ret.xFilter = function(lastFilter,dim,value){
        var last = lastFilter || ret.filter;
        var filter = inflateFilter();
        updateFilterPopulation(dim,value);
        updateFilter(o.tgtKey); //needs to be set to dimension being summed - should be o.val - no longer required
        return ret.filter=filter;
        // Entry point for filter update
        function updateFilterPopulation(key,value){
            if(!key){
                filter['population'] = o.ndx;
            } else {
                if(!value){
                    filter['population'] = ret.getPopulationFromIndices(key); //won't deal with function
                    for(var k in filter['selected']) { if(key[k]){ filter['selected'][k] = key[k]; }}
                } else { // we've sent in a single dim and value
                    filter['population'] = getFilterPopulation(key,value); //won't deal with function
                    filter['selected'][key] = value;
                } //console.log(filter);
            }
        }
        // Function to filter the entire population based on the indexes available - works on categorical basis
        function getFilterPopulation(dim,value){
            //return index for filter
            var k, ret = [], pop = last['indexes'][dim][value]['ref'];
            for(k in pop){
                ret.push(k); // index within source
            }
            return ret;
        }
        // Provide object to inflate filter
        function inflateFilter(){
            var agg = {}, ndx = {}, sel = {};
            // Create object to store indexes and aggregates for dims and mres for filter
            for(var e, i=0, a=o.dims, n=a.length; i<n; i+=1){ e = a[i]; // e = dim
                agg[e] = {}; //could just use filter object
                ndx[e] = { "range" : [] };
                sel[e] = last['selected'][e];
                for(var f, j=0, b=ret.range(e) , p=b.length; j<p; j+=1){ f = b[j]; // f = keys/range in dim
                    agg[e][f] = { 'sum' : {}, 'count' : 0 };
                    ndx[e][f] = { "length" : 0, "ref" : {} };
                    //o.val.forEach(function(g,k,c){
                    for(var g, k=0, c=o.val, q=c.length; k<q; k+=1){ g = c[k];
                        agg[e][f]['sum'][g] = o.result(0,o.periods);
                    }//);
                }
            }
            return { 'population' :null, 'indexes' : ndx, 'aggregate' : agg, 'selected' : sel };
        }
        // Update indexes and aggregates in filter
        function updateFilter(key,target){
            var ndx, agg; //dim
            // Perform functions on each record
            for(var e, i=0, a=filter['population'], n=a.length; i<n; i+=1){ e = a[i]; // e is object
                // Inflate indexes for each record
                for(var f, j=0, b=o.dims, p=b.length; j<p; j+=1){ f = b[j]; // f = dim
                    var v = ret.pAccessor(o.data[e],f); // returns value for dim
                    //var v = o.data[e][f]; // Hack speed optimisation
                    ndx = filter['indexes'][f];
                    agg = filter['aggregate'][f];
                    ndx[v]["ref"][e] = 1; // e is index within o.source
                    ndx[v]["length"]++;
                    agg[v]['count']++;
                    for(var g, k=0, c=o.val, q=c.length; k<q; k+=1){ g = c[k];
                        ret.vSum(agg[v]['sum'][g],ret.vSelect(ret.vAccessor(o.data[e]),o.tgtKey[k],target||o.tgt)); // needs to be parameterised
                        //ret.vSum(agg[v]['sum'][g],ret.vSelect(o.data[e][o.vProperty],o.tgtKey[k],target||o.tgt)); // Hack speed optimisation
                    }
                }
            }
        }

    }
    // Duplicated function (ret.filterData) to filter the entire population based on the indexes available - works on categorical basis
    ret.getPopulationFromIndices = function(key){ //should always be a full key
        //return a filtered set of data based finding index for key and value
        var indexes = ret.filters[0]['indexes'], ndx = [], intersect;
        for(var k in key){
            if(indexes[k][key[k]]){ // look for index for key and key value
                ndx.push(indexes[k][key[k]]);
            }
        }
        if(ndx.length===0){ // no matching indexes found so return full data set (index version)
            alert("Returning full data set");
            return o.ndx;  // return fill as filters should only operate on single values
        }
        ndx.sort(function(a,b){a.length<b.length}); //order by smallest index
        var filtered = Object.keys(ndx[0]["ref"]); // set to array of keys of smallest index
        for(var e, i=0, a=ndx.slice(1), n=a.length; i<n; i+=1){ e = a[i];
            filtered = filtered.filter(function(f,j,b){ return e["ref"][f]; }); // performed better than loop
        }
        return filtered;
    }
    // New functionality
    ret.filtered = function(){
        if(o.filtered){
            return true;
        }
        return false;
    }
    // 20150423 New functionality to support retrieving all values within a set of dimensions
    ret.groupBy = function(dims,mre){
        var res = [], resObj = {}, measures = mre || o.val;
        inflateResults(combinations(dims));
        sumPopulation();
        flattenResults();
        //console.log(res);
        return res;
        // Recursive function to fill out results structure
        function inflateResults(dimsNext,partKey){
            var key = partKey || "";
            for(var e, i=0, a=dimsNext[0], n=a.length; i<n; i+=1){ e = a[i];
                var id = idString(key,e);
                if(dimsNext.length>1) {
                    inflateResults(dimsNext.slice(1),id);
                } else {
                    resObj[id] = {};
                    if(o.vProperty) { resObj[id][o.vProperty] = {}; }
                    for(var g, k=0, c=measures, q=c.length; k<q; k+=1){ g = c[k];
                        var val = ret.vAccessor(resObj[id]);
                        val[g] = o.result(0,o.periods);
                    }
                }
            }
        }
        // Sum population across selected dimensions
        function sumPopulation(){
            var obj, key, r;
            var tgtKey = measures.map(function(e,i,a) { var res = {}; res[o.tgt] = e; return res;  } ); // awful hack due to structure of vSelect
            //console.log(tgtKey); console.log(ret.filter['population'].length);
            for(var e, i=0, a=ret.filter['population'], n=a.length; i<n; i+=1){ e = a[i]; // e is object
                obj = o.data[e];
                key = "";
                for(var f, j=0, b=dims, p=b.length; j<p; j+=1){ f = b[j];
                    key = idString(key,ret.pAccessor(obj,f)); //String to use as key
                }
                for(var g, k=0, c=measures, q=c.length; k<q; k+=1){ g = c[k];
                    var val = ret.vAccessor(resObj[key]);
                    ret.vSum(val[g],ret.vSelect(ret.vAccessor(obj),tgtKey[k],o.tgt)); // changed tgtKey[k] to g from
                }
            }
        }
        // Rehape results to an array of objects
        function flattenResults(){
            for(k in resObj){
                var o = {}, vals = k.split('|');
                for(var f, j=0, b=dims, p=b.length; j<p; j+=1){ f = b[j];
                    o[f] = vals[j];
                }
                extend(o,resObj[k]);
                res.push(o);
            }
        }
        // Helper function
        // Returns an array of dim values for an array of dims
        function combinations(dims){
            var res = [];
            for(var e, i=0, a=dims, n=a.length; i<n; i+=1){ e = a[i];
                res.push(ret.filters[0]['indexes'][e]['range']);
            }
            return res;
        }
        // Concatenates the inputs and returns a string to use as a key
        function idString(key,ext){
            return (key + (key!=="" ? "|" : "") + ext);
        }
    }

    // 20150810 - Function to retrieve dims and ranges
    ret.dimsValues = function(){
        var res = {}, ndx = ret.filter['indexes'];
        for(var k in ndx){
            if(ndx.hasOwnProperty(k)){
                res[k] = ret.decodeRange(k,ndx[k]['range']);
            }
        }
        return res;
    }

    ret.decodeRange = function(dim,range){
        if(!o.dimsEncoded){
            return range;
        }
        return range.map(function(e,i,a){
            return ret.decode(dim,e);
        });
    }

    ret.decode = function(dim,value){
        return o.dimsEncoded[dim] ? o.dimsEncoded[dim]['encoded'][value]||value : value;
    }

    return ret.init(o);
}

/***********************************************************************************/
// Function to provide groupings for ranges over a dimension
// g = grouping, d = default, lte = less than equal, f = field
// usage grpRanges([0.7,1.0,1.2,1.5],5,true)
function grpRanges(g,d,lte){
    return function(f){
        for(var i=0;i<g.length;i++){
            if( f<g[i] && (lte && f===g[i]) ){
                return i+=1;
            }
        }
        return d || i+1; //no not found - assume greater than last
    }
}
//To do - produce a version which looks at extent and segments into a certain number of categories
//To do - produce a version which looks at extent and segments into a certain number of categories driven by population distribution
// Function to provide groupings for ranges over a dimension
function grpCategories(g,d){
    return function(f){
        if(f in g){
            return g[f];
        }
        return d || 0;
    }
}

//*******************************************************************************
// dFilter extension to deal with arrays
//*******************************************************************************
function dFilterArray(options){
    // Preliminary items - defaults - call base function
    var def = {
        result : fillArray, //to be a function - called for default result and map reduce
        val : ['bal','count'], // override required
        periods : 13, // periods
        vProperty : 'values', // values are contained within a specific property
        vDynamic : true, // value is dynamic
        vArray : true, // values are returned as an array
    }
    var ret = dFilter(extend(def,options));  //inital set up from dFilterBase
    var o = ret.options;

    ret.init = function(options){
        // Extend defaults
        return ret;
    }
    //Helper function
    function fillArray(value, len) {
      var arr = [];
      for (var i=0; i<len; i++) {
        arr.push(value);
      };
      return arr;
    }

    return ret.init(o);
}


/***********************************************************************************/
// Helper functions

function dimsFilterHelper(index){
    var res = [];
    for(var k in index){
        var r = {};
        r['name'] = k;
        r['display'] = k;
        r['order'] = index[k]['range'];
        r['colours'] = null;
        res.push(r);
    }
    return res;
}

function dimsFilterHelper2(index){
    var res = {};
    for(var k in index){
        res[k] = index[k]['range'];
    }
    return res;
}

function dimsFilterHelper2(index){
    var res = {};
    for(var k in index){
        var r = {};
        r['colours'] = null;
        res[k]=r;
    }
    return res;
}
