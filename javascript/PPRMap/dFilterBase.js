//*******************************************************************************
//
//*******************************************************************************
function dFilterBase(options){
    //Too many characters/values set
    var def =  {
        all : '_', //used for where no filter on dimension
        fn : 'fn', //used for function branching
        result : function(){ return 0; }, //to be a function - called for default result and map reduce
        tgt : 'mre',
        val : 'Price',
        data : []
    }
    var ret = {}; //child filters will refer to base
    var o = ret.options = $.extend(def,options); // merge defaults and options

    ret.init = function(options){
        // create public properties
        ret.indexes = {};
        ret.dims={};
        // Initialise Indexes Object for each dimension - should indexes and dims be combined
        o.dims.forEach(function(e,i,a){ // dims will be indexed
            ret.indexes[e] = { "range" : [] }; //range to keep track of values in dimension
            // incorporate dim breakdown
            ret.dims[e] = { 'val' : i };  //associative map
            ret.dims[i] = { 'val' : e }; //ordered map
        });
        // Perform functions on each record
        o.data.forEach(function(e,i,a){
            // Add calculated/group dimensions to each object
            if(o.dimsToAdd){
                o.dimsToAdd.forEach(function(f,j,b){ //e,i,a for dimsToAdd - f = dim To Add
                    e[f["name"]] = f["grpFn"](wlk(e,f["derivedFrom"]));
                });
            }
            // Inflate indexes for each record
            o.dims.forEach(function(f,j,b){ // f = dim To Index
                var v = wlk(e,f);
                if(!ret.indexes[f][v]){
                    ret.indexes[f][v] = { "length" : 0 };
                    ret.indexes[f].range.push(v);
                }
                ret.indexes[f][v][i] = 1;
                ret.indexes[f][v]["length"]++;
            });
        });

        return ret;
    }
    // Extend key for all dimensions (include source dimension) and
    // include an id string in format <dimval1>|<dimval2>|... and
    // include filter which is minimum number of fields i.e. have a selection
    ret.extKey = function(keys,src){ // appending source should perhaps not happen at this level - should happen in dProvider
        var s = src||["_"], d = [] , v = {}, filter = {};
        for(var i=0;i<o.dims.length;i++){
            v[o.dims[i]] = o.all; //using '' causes problems - don't know why - not sure we need full key
            d.push(o.all);
        }
        for(k in keys){ // would $.extend be better? - check k is in result
            if(ret.dims[k]){
                v[k] = f(keys[k]); // use f to resolve function here - need to make this generic - should I use $.extend?
                if(v[k]!==o.all){ filter[k] = v[k]; } // populate filter with keys which have a value
                d[ret.dims[k].val] = v[k].label || v[k]; // ensure order is correct
            } else if(k=o.tgt){ // if is the target = measure
                v[k] = f(keys[k]);
            } else {
                if(k.indexOf(o.fn)<1){
                    console.log("Invalid key: " + k);
                }
            }
        }
        return { "obj" : v, "id" : s.concat(d).join("|"), "filter" :  filter }; //full key and idString returned
    }
    //New Reduce Functionality
    ret.objInKey = function (obj,key){
        res=true;
        for(k in key){
            var v=key[k];
            if(v!=="_"){
                var o=wlk(obj,k); // walks if nested
                if(typeof(v)==='object'){ //allDims firing initial function
                    if(v.fn){
                        res=v.fn(o);
                    }
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
    ret.filterData = function(key){ //should always be a full key
        //return a filtered set of data based finding index for key and value
        var ndx = [];
        for(var k in key){
            if(ret.indexes[k][key[k]]){ // look for index for key and key value
                ndx.push(ret.indexes[k][key[k]]);
            }
        }
        if(ndx.length===0){ return o.data; } // no matching indexes found so return full data set
        ndx.sort(function(a,b){a.length<b.length}); //order by smallest index
        var filtered = Object.keys(ndx[0]); // set to array of keys of smallest index - should remove length property!
        for (var i=1; i<ndx.length; i++) { // include keys if found in other indexes
            filtered = filtered.filter(function(e,i,a){ return ndx[i][e]; }); //may need logical test
        }
        return filtered.map(function(e,i,a){ return o.data[e]; }); //returns array of objects - may remove length at this point
    }
    // may rename to get measures
    ret.getValues = function(key){
        var population = ret.getPopulation(key['filter']).value.reduce(function(r,e,i,a){ if(e[o.val]) { r.push(e[o.val]);} return r; },[]);
        return {
            id : key['id'], // id string
            key : key['obj'], // full key
            filter : key['filter'], //only filtered dimensions
            value : population.stats() // introduces filter on an index - need to parameterise
        }
    }
    // function to return population of array objects without summarisation
    ret.getPopulation = function(key){ //does not take full key
        return {
            key : key,
            value : ret.filterData(key).filter(ret.kFilter(key)) //introduces filter on an index
        }
    }
    // filter used downstream
    ret.kFilter =function(key){
        return function(obj,i,a){
            return ret.objInKey(obj,key);
        }
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
                return ++i;
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
