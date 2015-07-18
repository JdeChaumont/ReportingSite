//*******************************************************************************
//
//*******************************************************************************
function dFilter(o){
    //Too many characters/values set
    var ret = {};
    var o;

    var def = {
        all : '_', //used for where no filter on dimension
        fn : 'fn', //used for function branching
        result : function(){ return 0; }, //to be a function - called for default result and map reduce
        indices : [],
        tgt : 'mre',
        val : 'Price'
    }

    ret.init = function(options){
        // Extend defaults
        o = ret.options = $.extend(def,options); //var o used for shorthand - will this lead to trouble later overriding o?

        ret.dims={};

        for(var i=0;i<o.dims.length;i++){
            console.log(i);
            var d = o.dims[i];
            console.log(d);
            ret.dims[i] = {}; //ordered map
            ret.dims[d] = {};  //associative map
            ret.dims[i].val=d; //e.g. [0].val = "dim 1 Name"
            ret.dims[d].val=i; //e.g. [name].val = order
            ret.dims[i].range = [];
        }
        console.log(o.dims.length);
        //New version - iterates over population once
        var res={}, mre, val;
        for(var j=0;j<o.dims.length;j++){
            res[o.dims[j]]={};
        }
        var vals = o.data.reduce(function(res,e,i,a){ //could create indices at this point
            for(var j=0;j<o.dims.length;j++){
                mre=o.dims[j];
                val=wlk(e,mre);
                if(!res[mre][val]){
                    res[mre][val]={ "n":0, "val":0.0 };
                    ret.dims[j].range.push(val);
                }
                res[mre][val]["n"]++;
                res[mre][val]["val"]+=e[def.val]; //too specific
            }
            return res;
        },res);
        for(var j=0;j<o.dims.length;j++){
            ret.dims[j].range.sort();
        }
        console.log(res);
        return ret;
    }
    // Extend key for all dimensions (include source dimension) and
    // include an id string in format <dimval1>|<dimval2>|... and
    // include filter which is minimum number of fields i.e. have a selection
    ret.extKey = function(keys,src){ // appending source should perhaps not happen at this level - should happen in dProvider
        var s = src||["_"], d = [] , v = {}, filter = {};
        for(var i=0;i<o.dims.length;i++){
            v[o.dims[i]] = def.all; //using '' causes problems - don't know why
            d.push(def.all);
        }
        for(k in keys){ // would $.extend be better? - check k is in result
            if(ret.dims[k]){
                v[k] = f(keys[k]); // use f to resolve function here - need to make this generic
                if(v[k]!==def.all){ filter[k] = v[k]; } // populate filter with keys which have a value
                d[ret.dims[k].val] = v[k].label || v[k]; // ensure order is correct
            } else {
                if(k.indexOf(def.fn)<1){
                    console.log("Invalid key: " + k);
                }
            }
        }
        d[ret.dims[def.tgt].val]=def.all; //Set mre to all as measures in object
        delete filter[def.tgt];
        return { "obj" : v, "id" : s.concat(d).join("|"), "filter" :  filter }; //full key and idString returned
    }
    //New Reduce Functionality
    function objInKey(obj,key){
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

    function kFilter(key){
        return function(obj,i,a){
            return objInKey(obj,key);
        }
    }

    function filterData(key){ //should always be a full key
        //return a filtered set of data based on ordered indices supplied
        //if(o.indices.length>0){ //need to ensure default value
        //o.indices.each(function(index,i,a)){ //object with indices - confirmed can rely on ordering - won't work as return won't exit loop
        for (var i=0; i<o.indices.length; i++) {
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
        var population = ret.getPopulation(key['filter']).value.reduce(function(r,e,i,a){ if(e[def.val]) { r.push(e[def.val]);} return r; },[]);
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
            value : filterData(key).filter(kFilter(key)) //introduces filter on an index
        }
    }

    /***********************************************************************************/
    /***********************************************************************************/
    /*Deprecated*************************************************************************/
    /***********************************************************************************/
    /***********************************************************************************/
    //Where should order of keys be controlled?
    ret.idString = function(keys){
        var res = [];
        for(var i=0;i<o.dims.length;i++){
            res.push(def.all); //Push blank for no filter
        }
        for(k in keys){
            if(ret.dims[k]){
                var r = f(keys[k]);
                res[ret.dims[k].val] = r.label || r; //use f to resolve function here - need to make this generic
            } else {
                if(k.indexOf(def.fn)<1){
                    console.log("Invalid key: " + k);
                }
            }
        }
        res[ret.dims["mre"].val]=def.all; //Set mre to all as measures in object
        return res.join('|');
    }
    //Key expanded to include all dimensions
    ret.fullKey = function(keys){
        var res = {};
        for(var i=0;i<o.dims.length;i++){
            res[o.dims[i]]=def.all; //using '' causes problems - don't know why
        }
        for(k in keys){ //would $.extend be better? - check k is in result
            if(ret.dims[k]){
                res[k] = f(keys[k]); //use f to resolve function here - need to make this generic
            } else {
                if(k.indexOf(def.fn)<1){
                    console.log("Invalid key: " + k);
                }
            }
        }
        return res;
    }

    function keyFilter(key,field){
        return function(obj,i,a){
            if(objInKey(obj,key)){
                if(!field) return obj;
                return wlk(obj,field); //return the target field
            }
        }
    }

    function keyFilterReduce(key,field){
        return function(res,obj,i,a){
            res.push(wlk(obj,field)); //return the target field
            return res;
        }
    }

    function keyReduce(key){ //want this to be the stats
        return function(res, obj) {
            if(objInKey(obj,key)){
                var v=obj.values;
                for(var i=0;i<v.length;i++){
                    res[i]+=v[i];
                }
            }
            return res;
        }
    }

    function fillArray(value, len) {
      var arr = [];
      for (var i=0; i<len; i++) {
        arr.push(value);
      };
      return arr;
    }
/***********************************************************************************/
/***********************************************************************************/

    return ret.init(o);
}


/***********************************************************************************/
//Test inheritance approach
var base = function(spec) {
  var ret = {};

  ret.nonOverride = function() {
    ret.override();
    console.log(z());
  };

  ret.override = function(){
      console.log("base");
  }

  function z(){
      return "base"
  }

  return ret;
};

var inherit = function(spec) {
  var ret = base(spec);

ret.override = function(){
    console.log("virtual");
}

function z(){
    return "virtual - not fn on object"
}
  /*var super_getDescription = ret.superior("getDescription");
  ret.getDescription = function() {
    return super_getDescription() + " It can also send email messages.";
};*/

  return ret;
};

var x = base({test:'test'});
x.nonOverride();

var y = inherit({test:'test'});
y.nonOverride();
