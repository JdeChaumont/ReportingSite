//*******************************************************************************
//
//*******************************************************************************
function dProvider(o){
    //Too many characters/values set
    var ret = {};
    var cache = {}; //= dataArray; //cached slices
    var calc = {}; //calculated definitions
    var o;

    var def = {
        all : '_', //used for where no filter on dimension
        fn : 'fn', //used for function branching
        result : function(){ return 0; }, //to be a function - called for default result and map reduce
        indices : []
    }

    ret.init = function(options){
        // Extend defaults
        var extended = def;
        for (var prop in options) {
          if (options.hasOwnProperty(prop)) {
            extended[prop] = options[prop];
          }
        }
        o = ret.options = extended; //var o used for shorthand - will this lead to trouble later overriding o?

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
        var vals = o.data.reduce(function(res,e,i,a){
            for(var j=0;j<o.dims.length;j++){
                mre=o.dims[j];
                val=wlk(e,mre);
                if(!res[mre][val]){
                    res[mre][val]={ "n":0, "val":0.0 };
                    ret.dims[j].range.push(val);
                }
                res[mre][val]["n"]++;
                res[mre][val]["val"]+=e["Price"];
            }
            return res;
        },res);
        for(var j=0;j<o.dims.length;j++){
            ret.dims[j].range.sort();
        }
        console.log(res);
        if(o.cache){
            cache = o.cache;
        }

        return ret;
    }

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

    //New Reduce Functionality
    function objInKey(obj,key){
        res=true;
        for(k in key){
            var v=key[k];
            var o=wlk(obj,k); // walks if nested
            if(typeof(v)==='object'){ //allDims firing initial function
                if(v.fn){
                    res=v.fn(o);
                }
            } else {
                if(v!=="_"){
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

    function kFilter(key){
        return function(obj,i,a){
            return objInKey(obj,key);
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

    //may rename to get measures
    ret.getValues = function(key){ //same interface as previous - key has already been processed though fullkey function
        //var population = filterData(ret.fullKey(key)).filter(kFilter(key));
        var keyAllMre = ret.fullKey(key);
        keyAllMre["mre"] = def.all;
        //console.log(ret.idString(keyAllMre));
        var pop = filterData(keyAllMre).filter(kFilter(keyAllMre));
        //console.log(pop[0]);
        //console.log(pop.length);
        //population = population.reduce(keyFilterReduce(key,"Price"),[]);
        var population = pop.reduce(function(r,e,i,a){ if(e["Price"]) { r.push(e["Price"]);} return r; },[]);
        //console.log(population[0]);
        //console.log(population.length);
        var r = population.stats();
        //console.log(r);
        return {
            id : ret.idString(key),
            key : key,
            value : population.stats() //introduces filter on an index - need to parameterise
        }
    }

    //function to return population of array objects without summarisation
    ret.getPopulation = function(key){ //same interface as previous - key has already been processed though fullkey function
        console.log("getPopulation");
        return {
            id : ret.idString(key), //arguable this is not required
            key : key,
            value : filterData(ret.fullKey(key)).filter(kFilter(key)) //introduces filter on an index
        }
    }

    ret.segmentSum = function(key,range){  //this should be accessible as string or object key
        return ret.segmentRange(key,range).reduce( function(previousValue, currentValue, index, array){
                return previousValue + currentValue;
            });
    }

    ret.segment = function(key,range){ //range can be single value or array with 2 values - index and offset
        var res = ret.segmentFromCache(key);
        /*var r = range;
        var r0, r1;
        if(r){
            r0 = r[0] || r; r0 = f(r0);
            r1 = r[1] || r0+1; r1 = f(r1);
            if(r1<r0){
                if(r1<0) {
                    r0 += r1+1;
                    r1 = r0-r1;
                } else {
                    r1 += r0;
                }
            }
        }
        return (!range ? res : res.slice(r0,r1));*/
        return res;
    }

    ret.segmentFromCache = function(key){ //cache will use string key
        //console.log(ret.idString(key));
        return (cache[ret.idString(key)] ? cache[ret.idString(key)][key["mre"]] : ret.fillCache(key));
    }

    ret.fillCache = function(key){  //should be a private function
        var res;
        if(key.xfn){
            if(key.xfn.fn){
                if(key.xfn.fn){ //is it a calculated field - check definitions?
                    res = calc[key.xfn.fn](key);
                    cache[res.id] = res.value;
                }
            } else if(calc[key.xfn]){ //is it a calculated field - check definitions?
                res = calc[key.xfn](key);
                cache[res.id] = res.value;
            } else {
                console.log("Error - transform function not logged");
            }
        } else {
            res = ret.getValues(ret.fullKey(key));
            cache[res.id] = res.value;
        }
        return cache[res.id][key["mre"]]; //different as now returning a measure within an object of measures - not presently an array - this may need to change
    }

    function preCalculated(key){
        //console.log("preCalc Fired");
        //console.log(ret.idString(key));
        for(k in key){
            if(!preCalc[k][key[k]]){
                return false; //return as soon as failed
            }
        }
        //console.log("preCalc Fired - & short circuited");
        return true;
    }

    var measureChange = function(key){
        var newKey=$.extend({},key);
        newKey.mre = f(newKey.mre).replace('Chg','');
        delete newKey.xfn; //need to delete or
        var values = ret.segment(newKey);
        var res=[0];
        for(var i=1;i<values.length;i++){
            res.push(values[i]-values[i-1]);
        }
        return { id : ret.idString(key), key : key, value : res }
    }

    var chg = function(dim,suffix,transform){
        return function(key){
            var base = $.extend({},key);
            base[dim] = f(base[dim]).replace(suffix,'');
            delete base[transform]; //necessary to stop looking in calc
            var values = ret.segment(base);
            var res=[0];
            for(var i=1;i<values.length;i++){
                res.push(values[i]-values[i-1]);
            }
            return { id : ret.idString(key), key : key, value : res }
        }
    }

    var ofTotal = function(dim,suffix,transform,total){
        return function(key){
            var base = $.extend({},key);
            base[dim] = f(base[dim]).replace(suffix,''); //Change this to add suffix later & output
            delete base[transform];
            var values = ret.segment(base);
            for(k in total){
                if(base[k]){
                    base[k]=total[k];
                }
            }
            var div = ret.segment(base);
            var res = [];
            for(var i=0;i<values.length;i++){
                res.push(div[i]===0 ? 0 : values[i]/div[i] );
            }
            return { id : ret.idString(key), key : key, value : res }
        }
    }

    var ofTot = function(transform){
        return function(key){
            var tfm = $.extend({},key[transform]);
            var base = $.extend({},key,tfm.args[0]);
            delete base[transform];
            var divKey = $.extend({},base,tfm.args[1]);
            //console.log(divKey);
            var val = ret.segment(base);
            var div = ret.segment(divKey);
            var vals = [];
            for(var i=0;i<val.length;i++){
                vals.push(div[i]===0 ? 0 : val[i]/div[i] );
            }
            return { id : ret.idString(key), key : key, value : vals }
        }
    }

    //calc['Chg'] = measureChange;
    calc['Chg'] = chg('mre','Chg','xfn');
    calc['ofTotalArr'] = ofTotal('uom','OfTotal','xfn', {arr : xfFilter('arr','All',function(){ return d>0; })});
    calc['ofTotalEnt'] = ofTotal('uom','OfTotal','xfn', {ent : '_'});
    calc['rate'] = ofTotal('mre','Rate','xfn', {mre : 'Bal'});//This will change to the following
    //calc['rate'] = ofTotal('mre','Rate','xfn', {mre : 'Bal'});
    calc['ofTotal'] = ofTot('xfn');

    return ret.init(o);
}
