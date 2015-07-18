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
        o.dims.each(function(e,i,a){ // dims will be indexed
            ret.indexes[e] = { "range" : [] }; //range to keep track of values in dimension
            console.log(i);
            console.log(e);
            // incorporate dim breakdown
            ret.dims[e] = { 'val' : i };  //associative map
            ret.dims[i] = { 'val' : d }; //ordered map
        });
        // Add target i.e. measure to dims if not present - should not be indexed - may not need this as long as mre is not in id string
        /*if(!ret.dims[o.tgt]){
            ret.dims[o.tgt] = { 'val' : ret.dims.length }; //associative map
            ret.dims[ret.dims.length] = { 'val' : o.tgt }; //ordered map
        }*/
        // Perform functions on each record
        o.data.each(function(e,i,a){
            // Add calculated/group dimensions to each object
            o.dimsToAdd.each(function(f,j,b){ //e,i,a for dimsToAdd - f = dim To Add
                e[f["name"]] = f["grpFn"](wlk(e[f["derivedFrom"]));
            });
            // Inflate indexes for each record
            o.dims.each(function(f,j,b){ // f = dim To Index
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
        /*if(!v[o.tgt]){ - mre not in key
            v[o.tgt] = o.all;
        }*/
        for(k in keys){ // would $.extend be better? - check k is in result
            if(ret.dims[k]){
                v[k] = f(keys[k]); // use f to resolve function here - need to make this generic - should I use $.extend?
                if(v[k]!==o.all){ filter[k] = v[k]; } // populate filter with keys which have a value
                d[ret.dims[k].val] = v[k].label || v[k]; // ensure order is correct
            } else {
                if(k.indexOf(o.fn)<1){
                    console.log("Invalid key: " + k);
                }
            }
        }
        d[ret.dims[o.tgt].val]=o.all; //Set mre to all as measures in object
        delete filter[o.tgt];
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
                    //console.log("fn objInKey - value comparison - " + obj[k] + " with " + v);
                    } else { return false; } //value key with no corresponding key in object
                }
            }
            if(res===false){ return false };
        }
        return true;
    }
    // Debatable whether should be on object
    function kFilter(key){
        return function(obj,i,a){
            return ret.objInKey(obj,key);
        }
    }
    // Should be general purpose filter function
    ret.filterData = function(key){ //should always be a full key
        //return a filtered set of data based on ordered indices supplied
        //if(o.indices.length>0){ //need to ensure default value
        //o.indices.each(function(index,i,a)){ //object with indices - confirmed can rely on ordering - won't work as return won't exit loop
        for (var i=0; i<ret.indices.length; i++) {
            var index = o.indices[i];
            if(index["field"]){
                if(index["field"] in key){ //should maybe use hasOwnProperty
                    var v=key[index["field"]]; //index used
                    if(v!=="_" && typeof(v)!=='object'){ //not all and not an object
                        return index["index"][v].map(function(e,i,a){
                            index["indexMap"][e]; //iterate through index to return array of objects
                        });
                    }
                }
            }
        }
        return o.data;
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
            value : ret.filterData(key).filter(Filter(key)) //introduces filter on an index
        }
    }

    return ret.init(o);
}


/***********************************************************************************/
