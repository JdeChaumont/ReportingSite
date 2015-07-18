//*******************************************************************************
//Module Template - not used just a template
//*******************************************************************************
function jdcDataSource(o){
    var ret = {};
    ret.data = [];
    ret.indexes = {};

    var defaults = {
        data : [],
        dimsToIndex : [], //short circuit if not defined
        dimsToAdd : [],
        val : "val" //default - only used if measure is single field
    }

    ret.init = function(options){
        // Extend defaults
        var extended = defaults;
        for (var prop in options) {
          if (options.hasOwnProperty(prop)) {
            extended[prop] = options[prop];
          }
        }
        var o = ret.options = extended; //var o used for shorthand
        //Transform structure of file
        if(o.group){ //grouping of records by key and/or for periods
            groupData(ret.data, o.group, o.measures, o.val, o.pou, o.periods); //could have multiple measures
        } else if(o.measures) { //measures to be grouped in values
            groupMeasures();
        } else { //no transformation required
            ret.data = o.data;
        }
        //Initialise Indexes Object for each dimension
        dimsToIndex.each(function(e,i,a){
            ret.indexes[e] = { "range" : [] }; //range to keep track of values in dimension
        });
        //Perform functions on each record
        ret.data.each(function(e,i,a){
            //Add calculated/group dimensions to each object
            o.dimsToAdd.each(function(f,j,b){ //e,i,a for dimsToAdd - f = dim To Add
                e[f["name"]] = f["grpFn"](wlk(e[f["derivedFrom"]));
            });
            //Inflate indexes for each record
            o.dimsToIndex.each(function(f,j,b){ // f = dim To Index
                if(!ret.indexes[f][e[f]]){
                    ret.indexes[f][e[f]] = { "length" : 0 };
                    ret.indexes[f].range.push(e[f]);
                }
                ret.indexes[f][e[f]][i] = 1;
                ret.indexes[f][e[f]]["length"]++;
            });
        });
        return ret;
    }

    //NOW THINKING SHOULD NOT GROUP ON POU (EXCEPT FOR AGGREGATED DATA) - makes things too complicated
    //Group data into unique combinations and populate ret.data
    function groupData(result, groupBy, mre, val, pou, periods ){
        var res = {}, vals = fillArray(periods.mth.length);
        o.data.each(function(e,i,a){
            var key = "", obj = {}, v;
            if(groupBy.length===1){ //unique key e.g. Account Number
                key = e[groupBy];
                for(var k in e){
                    if(k!==mre&&k!==val){
                        if(!pou){
                            obj[k] = e[k];
                        } else {
                            obj[k] = fillArray(periods.mth.length);
                            if(periods.ndx[e[pou]]){ //allocate if period found
                                res[key][k][periods.ndx[e[pou]]] = v;
                            }
                        }
                    }
                }
            } else {
                groupBy.each(function(f,j,b){ //Array of common properties
                    key += (j>0 ? "|" : "") + e[f];
                    obj[f] = e[f]; //not sure will take a property - may need to put braces around it
                });
            }
            if(!res[key]){
                res[key] = obj;
                res[key][values] = {};
                res[key][values][mre] = fillArray(periods.mth.length); //values are in an array
            };
            mre.each(function(f,j,b){
                v = (mre.length>1) ? e[f] : e[val];
                if(!pou){ //periods not relevant
                    res[key][values][f][0] += v;
                } else {
                    if(periods.ndx[e[pou]]){ //allocate if period found
                        res[key][values][f][periods.ndx[e[pou]]] += v;
                    }
                }
            });
        });
        for(var k in res){
            result.push(res[k]);
        }
    }

    function groupMeasures(){
        o.data.each(function(e,i,a){
            var obj = $.extend({},e);
            obj["values"] = {};
            o.measures.each(function(f,j,b){ //move measures to values - if required
                delete obj[f];
                obj["values"][f] = e[f];
            });
            ret.data.push(obj);
        });
    }

    return ret.init(o);
}

/* New development */
// Expected steps
// 1. Read in text file (expect CSV) - need file load - do we need step to load a configuration/meta data file? - could paste in!
// 2. Reshape to put measures in nested object
// 3. Add new dimensions
// 4. Index required dimensions


//UOM to be addressed
//UOM could be attached to mre but would need to include in an object rather than array
var options = {
    //Source
    file : "<insert or use a file load option>",
    //Information to transform structure - Generally should not use except for pou - can avoid all of these
    group : ["id"], //can be null, account number or could be a multiple key for pre-aggregated data e.g. ["arrs","fb","fbt","npl","nplm","prt","prd","ent"]
    measures : ["mre"], //can be null, single [mre] or ["bal","iLTV","prv","arrs_amt"] - can address this on load e.g. values.bal, values.iLTV, values.prv etc., (null)
    val : "value", //not required if measure not stacked
    pou : "pou", //can be null - ? { field : "pou", periods : { mth : [201401], ndx : {"201401" : 0 }}}
    periods : {mth : [201401], ndx : {"201401" : 0 }}, //can be generated from periodsCreate
    //Information to extend information for access
    dimsToAdd : [ //these will be added to the dims to export
        { "derivedFrom" : "values.iLTV", "name" : "LTV_Band", "grpFn" : grpRanges([0.7,1.0,1.2,1.5],5), "display" : { "1" : "<70%", "2" : "70-100%", "3" : "100-120%", "4" : "120-150%"} },
        { "derivedFrom" : "values.iLTV", "name" : "Negative_Equity", "grpFn" : grpRanges([1.0,2,true), "display" : { "1" : "No", "2" : "Yes"} },
        { "derivedFrom" : "repay", "name" : "I/O", "grpFn" : grpCategories({ "2" : "2", "3" : "2"},1), "display" : { "1" : "C&I", "2" : "I/O"} }
    ],
    dimsToIndex : ["arrs","fb","fbt","npl","nplm","prt","prd","ent","LTV_Band","Negative_Equity","I/O"], //could make dynamic - i.e. added dims automatically indexed
    //to do : measureToAdd : "e.g. Movement",
};

// Export { dims, data, indexes }



// Prototype for adding dimension to pivot - change this to create dims and indices together
function pivotAddDim(name, grpFn, display, field){
    pivot.population.each(function(e,i,a){
        e[name] = grpFn(e[field]); //apply grouping function
    });
    pivot.dim[name].display = display[]; //not a feature at present - display should be embedded in pivot
}

function createIndexes(){
    //Iterate through (categorical) dimensions and add to index
}

// need to develop an index intersection function to refine selection - may need to determine a viable set size to stop intersection checking e.g. 5k records

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
