//*******************************************************************************
//
//*******************************************************************************
function dFilterArray(options){
    // Preliminary items - defaults - call base function
    var def = {
        result : fillArray, //to be a function - called for default result and map reduce
        val : 'Price', // override required
        periods : 13 // periods
    }
    var ret = dFilterBase($.extend(def,options));  //inital set up from dFilterBase
    var o = ret.options;

    ret.init = function(options){
        // Extend defaults
        return ret;
    }
    // getValues overwritten
	ret.getValues = function(key){ //same interface as previous - key has already been processed though fullkey function
		return {
            id : key['id'], // id string
            key : key['obj'], // full key
            filter : key['filter'], //only filtered dimensions
			value : o.data.reduce(keyReduce(key), o.result(0,o.periods)) //This is hard coded
		}
	}
    // function to return population of array objects without summarisation
    ret.getPopulation = function(key){ //does not take full key
        return {
            key : key,
            value : ret.filterData(key).filter(ret.kFilter(key)) //introduces filter on an index
        }
    }
    // Functions to
    // keyReduce is new function - does not overwrite - does not need to be on the object
    function keyReduce(key){
        return function(res, obj) {
            if(ret.objInKey(obj,key)){
                if(key[def.tgt] in obj.values){
                    var v=obj.values[key[def.tgt]];
                    for(var i=0;i<v.length;i++){
                        res[i]+=v[i];
                    }
                }
            }
            return res;
        }
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
