/*! dashboard 04-12-2014 */

var dataNew = payLoad();


    $(document).ready(function(){
        if(!document.createElement('svg').getAttributeNS){
            document.write('Your browser does not support SVG!');
            return;
        }
    });

//*******************************************************************************
// Create User Interface
//*******************************************************************************
var anchor = anchorManager(); //then attach handler
//var state = stateManager(anchor,dataArray); //should data be set here
var state = stateManager(anchor,dataNew["data"]);

//Sets up buttons and adds them to state object
var css = "btn btn-custom";
var report = stateElement(state, "report", css + " full-width",
    //["Overview","Arrears","Flows", "Cures", "Forbearance","FB Type","SBU","Portfolio","Provision","Test"],null,
    ["Overview","Arrears","Flows", "Cures", "Forbearance","FB Type","SBU","Portfolio","Provision"],null,
    [reportChange("rpt"),outputStyle("rpt")]); //Additional Handler to fade in/out pages

//Handler to add to report state to test output of getComputedStyle
function outputStyle(id){
    return function(stateObj,refNo){
        return function(){
            var selector = "#" + id + stateObj["controls"][refNo] + " .table" ;
            var element = $(selector)[0];
        }
    }
}

//Version operating in Property Sales

/*
 * getStyleObject Plugin for jQuery JavaScript Library
 * From: http://upshots.org/?p=112
 *
 * Copyright: Unknown, see source link
 * Plugin version by Dakota Schneider (http://hackthetruth.org)
 */

(function($){
    $.fn.getStyleObject = function(){
        var dom = this.get(0);
        var style;
        var returns = {};
        if(window.getComputedStyle){
            var camelize = function(a,b){
                return b.toUpperCase();
            }
            style = window.getComputedStyle(dom, null);
            for(var i=0;i<style.length;i++){
                var prop = style[i];
                var camel = prop.replace(/\-([a-z])/g, camelize);
                var val = style.getPropertyValue(prop);
                returns[camel] = val;
            }
            return returns;
        }
        if(dom.currentStyle){
            style = dom.currentStyle;
            for(var prop in style){
                returns[prop] = style[prop];
            }
            return returns;
        }
        return this.css();
    }
})(jQuery);

$('#outputImage').click(function(e) {
    e.preventDefault();// prevent the default anchor functionality
    var html = d3.select(".activeTab .rptBody")
        .node()//.parentNode
        .innerHTML;

    var content = html;

    var canvas =  $("#output").html(html);

    $("#output").find('*').each(function(){
        var element = $(this);
        if(element){
            var style = element.getStyleObject();
            element.css(style);
        }
    });

});


//*******************************************************************************
// Back to UI creation
//*******************************************************************************
var entity = stateElement(state, "entity", css,["Group", "ptsb", "AMU", "Non-core"],["_", "P", "A", "N"]);
//var portfolio = stateElement(2, "portfolio", "p", state, css,["All", "HL", "BTL", "CRE", "Consumer Finance"],["_", "HL", "BTL", "CRE", "CF"]);
var portfolio = stateElement(state, "portfolio", css,["All", "HL", "BTL"],["_", "HL", "BTL"]);
var uom = stateElement(state, "uom", css,["€", "#"],["E", "#"]);

//Buttons for popup chart
var popupButtons = [
    { name: "Entity", value: 1 }, //defined by order of dimensions
    { name: "Portfolio", value: 3 },
    { name: "Product", value: 2 },
    { name: "Arrears", value: 4 },
    { name: "NPL", value: 5 },
    { name: "Provision Type", value: 6 },
    { name: "Forbearance", value: 7 },
    { name: "Fb Type", value: 8 }
]

function popupSlice(e){
    updatePopupChart(this.value);
    return false;
}
//Needs work to show which are active buttons
createButtonSet('#popupSlice',popupButtons,css,{ click : popupSlice });

//*******************************************************************************
// Set-up Data
//*******************************************************************************
var dataDims = ["mre","ent","prd","prt","arr","npl","prv_cat","fb","fbt","uom","pou"]; //need to include POU

//should this go into the data provider?
var dims = {
    "mre" : { display : "Measure", ordinal : 60},
    "ent" : { display : "Entity", ordinal : 10},
    "prd" : { display : "Product", ordinal : 20},
    "prt" : { display : "Portfolio", ordinal : 30},
    "arr" : { display : "Arrears", ordinal : 40},
    "npl" : { display : "NPL", ordinal : 45},
    "prv_cat" : { display : "Provision type", ordinal : 46},
    "fb" : { display : "Forbearance", ordinal : 50},
    "fbt" : { display : "Forbearance type", ordinal : 55},
    "uom" : { display : "Units", ordinal : 70},
    "pou" : { display : "Period", ordinal : 80}
};
//Only used in cell clicked
function displayFilters(key,long){
    var ret = "";
    //console.log(key);
    for(k in key){
        if(dims[k]){
            var v=f(key[k]);
            if(long===true || v!=='_'){
                if(ret!==""){ ret+=" - ";};
                var dimValue = v.label || displayNames[k][v] || v;
                ret += dims[k].display + ": " + dimValue;
            }
        }
    }
    return ret;
}
var numPeriods = 35;
var dbData = dFilterArray({ data: state.data, dims: dataDims, periods: numPeriods });

var pxf = dProviderArray({ dims : dataDims, src : [{"id" : "all", "data" : dbData }], periods : numPeriods});

//*******************************************************************************
//Step 4.1 - Create Dashboard Definitions
//*******************************************************************************
var reportDef1 = {
    ref: 1,
    name : "rpt1",
    container : "rptArrears",
    key : { ent : def.e, prd : "_", prt : def.p, fb : "_", fbt :  "_", mre : "_", arr : "_", npl : "_", prv_cat : "_", uom : def.u }, //may be good practice to define all
    cols : [ 	{ display : "", css : "h4" }, //need to reserve space and set css
                { display : "Movement 13 mths", css : "sparkline" , key : { mre : "BlD"}, chartType : nv.models.sparkbarPlus },
                { display : "Mth", key : { mre : "BlD"}  },
                { display : "YTD", key : { mre : "BlD"} , index : [def.c,def.ytd]},
                { display : "Stock", key : { mre : "Bal" } },
                { display : "%", key : ofTotalHelper( { mre : "Bal" }, "OfTotalArr", [ { uom : def.u }, { arr : "_", npl : "_" } ]) },
                { display : "", css : "blank" },
                { display : "Provision", key : { mre : "Prv", uom : "E" } },
                { display : "Rate %", format : fp, key : ofTotalHelper( { mre : "Prv" }, "Rate", [ { uom : "E" }, { mre : "Bal" } ], "E") },
                { display : "iLTV %", format : fp, key : ofTotalHelper( { mre : "Bal" }, "iLTV", [ { uom : "L"}, { uom : "E" } ]) }
                //won't yet work as ofTotalHelper tied to uom
                //{ display : "%", key : ofTotalHelper( { mre : "Prv" }, "Rate", [ { uom : "Val" }, { mre : "Bal" } ]) },  //need to adopt same approach as of total
    ],
    rows : [ 	{ display : "" }, //need to reserve space
                { display : "Total", key : { arr : xfFilter('arr','All',function(d){return d>0;}) } },
                { display : "UTD", key : { arr : 10 } },
                { display : "0-30", key : { arr : 20 } },
                { display : "30-60", key : { arr : 30 } },
                { display : "60-90", key : { arr : 40 } },
                { display : "90+", key : { arr : xfFilter('arr','90plus',function(d){return d>40;}) } },
                { display : "Impaired", css : "blank" },
                { display : "Total", key : { arr : xfFilter('arr','All',function(d){return d>0;}), npl : "Y" } },
                { display : "UTD", key : { arr : 10, npl : "Y" } },
                { display : "0-30", key : { arr : 20, npl : "Y" } },
                { display : "30-60", key : { arr : 30, npl : "Y" } },
                { display : "60-90", key : { arr : 40, npl : "Y" } },
                { display : "90+", key : { arr : xfFilter('arr','90plus',function(d){return d>40;}) , npl : "Y" } }
    ],
    eventHandlers : { '.cell' : { click : cellClicked }, 'tr' : { mouseover : highlight, mouseout : unhighlight } }
};

var reportDef4 = {
    ref: 4,
    name : "rpt4",
    container : "rptForbearance",
    key : { ent : def.e, prd : "_", prt : def.p, fb : "_", fbt :  "_", mre : "_", arr : "_", npl : "_", prv_cat : "_", uom : def.u }, //may be good practice to define all
    cols : [ 	{ display : "", css : "h4" }, //need to reserve space and set css
                { display : "Movement 13 mths", css : "sparkline" , key : { mre : "BlD"}, chartType : nv.models.sparkbarPlus },
                { display : "Mth", key : { mre : "BlD"} },
                { display : "YTD", key : { mre : "BlD"}, index : [def.c,def.ytd]},
                { display : "Stock", key : { mre : "Bal" } },
                { display : "%", key : ofTotalHelper( { mre : "Bal" }, "OfTotalArr", [ { uom : def.u }, { arr : "_", npl : "_", fb : xfFilter('fb','Yes',inFB) } ]) },
                { display : "", css : "blank" },
                { display : "Provision", key : { mre : "Prv", uom : "E" } },
                { display : "Rate %", format : fp, key : ofTotalHelper( { mre : "Prv" }, "Rate", [ { uom : "E" }, { mre : "Bal" } ]) }
    ],
    rows : [ 	{ display : "Category", css : "blank" }, //need to reserve space
                { display : "Total", key : { fb : xfFilter('fb','Yes',inFB) } },
                { display : "Short term", key : { fb : "ST" } },
                { display : "Long term", key : { fb : "LT" } },
                { display : "Closure", key : { fb : "CL" } },
                { display : "Arrears Band", css : "blank" },
                { display : "Total", key : { arr : xfFilter('arr','All',function(d){return d>0;}), fb : xfFilter('fb','Yes',inFB) } },
                { display : "UTD", key : { arr : 10, fb : xfFilter('fb','Yes',inFB) } },
                { display : "0-30", key : { arr : 20, fb : xfFilter('fb','Yes',inFB) } },
                { display : "30-60", key : { arr : 30, fb : xfFilter('fb','Yes',inFB) } },
                { display : "60-90", key : { arr : 40, fb : xfFilter('fb','Yes',inFB) } },
                { display : "90+", key : { arr : xfFilter('arr','90plus',function(d){return d>40;}) ,fb : xfFilter('fb','Yes',inFB)} },
                { display : "90+/Impaired", key : { npl : "Y" ,fb : xfFilter('fb','Yes',inFB)} }],
    eventHandlers : { '.cell' : { click : cellClicked }, 'tr' : { mouseover : highlight, mouseout : unhighlight } }
};

var reportDef6 = {
    ref : 6,
    name : "rpt6",
    container : "rptSBU",
    key : { ent : "_", prd : "_", prt : def.p, fb : "_", fbt : "_", mre : "_", arr : "_", npl : "_", prv_cat : "_", uom : def.u }, //may be good practice to define all
    cols : [ 	{ display : "", css : "h4" }, //need to reserve space and set css
                { display : "Group",  key : { mre : "Bal" } },
                { display : "%", key : ofTotalHelper( { mre : "Bal" }, "OfTotalEnt", [ { uom : def.u }, { arr : "_", npl : "_", fb : "_" } ]) },
                { display : "ptsb",  key : { mre : "Bal", ent : "P"} },
                { display : "%", key : ofTotalHelper( { mre : "Bal", ent : "P" }, "OfTotalForEnt", [ { uom : def.u }, { arr : "_", npl : "_", fb : "_" } ]) },
                { display : "AMU",  key : { mre : "Bal", ent : "A"} },
                { display : "%", key : ofTotalHelper( { mre : "Bal", ent : "A" }, "OfTotalForEnt", [ { uom : def.u }, { arr : "_", npl : "_", fb : "_" } ]) },
                { display : "Non-core",  key : { mre : "Bal", ent : "N"} },
                { display : "%", key : ofTotalHelper( { mre : "Bal", ent : "N" }, "OfTotalForEnt", [ { uom : def.u }, { arr : "_", npl : "_", fb : "_" } ]) }
    ],
    rows : [ 	{ display : "" }, //need to reserve space
                { display : "Total", key : { arr : xfFilter('arr','All',function(d){return d>0;}) } },
                { display : "UTD", key : { arr : 10 } },
                { display : "0-30", key : { arr : 20 } },
                { display : "30-60", key : { arr : 30 } },
                { display : "60-90", key : { arr : 40 } },
                { display : "90+", key : { arr : xfFilter('arr','90plus',function(d){return d>40;}) } },
                { display : " ", css : "blank" },
                { display : "Impaired", key : { npl : "Y" } },
                { display : " ", css : "blank" },
                { display : "Forbearance", css : "blank" },
                { display : "Total", key : { arr : xfFilter('arr','All',function(d){return d>0;}), fb : xfFilter('fb','Yes',inFB) } },
                { display : "Short term", key : { fb : "ST" } },
                { display : "Long term", key : { fb : "LT" } },
                { display : "Closure", key : { fb : "CL" } },
    ],
    eventHandlers : { '.cell' : { click : cellClicked }, 'tr' : { mouseover : highlight, mouseout : unhighlight } }
};

var reportDef7 = {
    ref : 7,
    name : "rpt7",
    container : "rptPortfolio",
    key : { ent : def.e, prd : "_", prt : "_", fb : "_", fbt : "_", mre : "_", arr : "_", npl : "_", prv_cat : "_", uom : def.u }, //may be good practice to define all
    cols : [ 	{ display : "", css : "h4" }, //need to reserve space and set css
                { display : "All",  key : { mre : "Bal" } },
                { display : "%", key : ofTotalHelper( { mre : "Bal", prt : "_" }, "OfTotalForPrt", [ { uom : def.u }, { arr : "_", npl : "_", fb : "_" } ]) },
                { display : "", css : "blank" },
                { display : "", css : "blank" },
                { display : "HL",  key : { mre : "Bal", prt : "HL"} },
                { display : "%", key : ofTotalHelper( { mre : "Bal", prt : "HL" }, "OfTotalForPrt", [ { uom : def.u }, { arr : "_", npl : "_", fb : "_" } ]) },
                { display : "", css : "blank" },
                { display : "BTL",  key : { mre : "Bal", prt : "BTL"} },
                { display : "%", key : ofTotalHelper( { mre : "Bal", prt : "BTL" }, "OfTotalForPrt", [ { uom : def.u }, { arr : "_", npl : "_", fb : "_" } ]) }
    ],
    rows : [ 	{ display : "" }, //need to reserve space
                { display : "Total", key : { arr : xfFilter('arr','All',function(d){return d>0;}) } },
                { display : "UTD", key : { arr : 10 } },
                { display : "0-30", key : { arr : 20 } },
                { display : "30-60", key : { arr : 30 } },
                { display : "60-90", key : { arr : 40 } },
                { display : "90+", key : { arr : xfFilter('arr','90plus',function(d){return d>40;}) } },
                { display : " ", css : "blank" },
                { display : "Impaired", key : { npl : "Y" } },
                { display : " ", css : "blank" },
                { display : "Forbearance", css : "blank" },
                { display : "Total", key : { arr : xfFilter('arr','All',function(d){return d>0;}), fb : xfFilter('fb','Yes',inFB) } },
                { display : "Short term", key : { fb : "ST" } },
                { display : "Long term", key : { fb : "LT" } },
                { display : "Closure", key : { fb : "CL" } },
    ],
    eventHandlers : { '.cell' : { click : cellClicked }, 'tr' : { mouseover : highlight, mouseout : unhighlight } }
};


var reportDef5 = {
    ref : 5,
    name : "rpt5",
    container : "rptFBType",
    key : { ent : def.e, prd : "_", prt : def.p, fb : "_", fbt : "_", mre : "_", arr : "_", npl : "_", prv_cat : "_", uom : def.u }, //may be good practice to define all
    cols : [ 	{ display : "", css : "h4" }, //need to reserve space and set css
                { display : "Movement 13 mths", css : "sparkline" , key : { mre : "BlD"} , chartType : nv.models.sparkbarPlus },
                { display : "Mth", key : { mre : "BlD"} },
                { display : "YTD", key : { mre : "BlD"}, index : [def.c,def.ytd]},
                { display : "Stock", key : { mre : "Bal" } },
                { display : "%", key : ofTotalHelper( { mre : "Bal" }, "OfTotalFB", [ { uom : def.u }, { arr : "_", npl : "_", fb : xfFilter('fb','Yes',inFB), fbt : "_" } ]) },
                /*{ display : "UTD", key : { mre : "Bal", arr : 10 } },*/
                { display : "0-90 days", key : { mre : "Bal", arr : xfFilter('arr','Early',function(d){return (d>10 && d<50);}) } },
                { display : ">90 days", key : { mre : "Bal", arr : xfFilter('arr','90plus',function(d){return d>40;}) } },
                { display : "NPL", key : { mre : "Bal", npl : "Y" } },
                { display : "iLTV %", format : fp, key : ofTotalHelper( { mre : "Bal" }, "iLTV", [ { uom : "L"}, { uom : "E" } ]) }
    ],
    rows : [ 	{ display : "" }, //need to reserve space
                { display : "Short Term", css : "blank" },
                { display : "All Short term", key : { fb : "ST" } },
                { display : "Payment Reduced", key : { fb : "ST", fbt : "ST" } },
                { display : "Capitalisation", key : { fb : "ST", fbt : "C" } },
                { display : " ", css : "blank" },
                { display : "Long Term", css : "blank" },
                { display : "All Long term", key : { fb : "LT" } },
                { display : "Trial", key : { fb : "LT", fbt : "LT" } },
                { display : "Capitalisation", key : { fb : "LT", fbt : "C" } },
                { display : "Term Extension", key : { fb : "LT", fbt : "T" } },
                { display : "IO", key : { fb : "LT", fbt : "IO" } },
                { display : "IO Plus", key : { fb : "LT", fbt : "PI" } },
                { display : "Split", key : { fb : "LT", fbt : "S" } },
                { display : " ", css : "blank" },
                { display : "Closure", css : "blank" },
                { display : "All Closures", key : { fb : "CL" } },
                { display : "AVS", key : { fb : "CL", fbt : "A" } },
                { display : "AVS-Sold", key : { fb : "CL", fbt : "AS" } },
                { display : "Repo", key : { fb : "CL", fbt : "R" } },
                { display : "Repo-Sold", key : { fb : "CL", fbt : "RS" } }
    ],
    eventHandlers : { '.cell' : { click : cellClicked }, 'tr' : { mouseover : highlight, mouseout : unhighlight } }
};

var reportDef2 = {
    ref : 2,
    name : "rpt2",
    container : "rptFlows",
    key : { ent : def.e, prd : "_", prt : def.p, fb : "_", fbt :  "_", mre : "_", arr : "_", npl : "_", prv_cat : "_", uom : def.u }, //may be good practice to define all
    cols : [ 	{ display : "", css : "h4" }, //need to reserve space and set css
                { display : "Movement 13 mths", css : "sparkline" , key : {} , chartType : nv.models.sparkbarPlus },
                { display : "Mth", key : { } },
                { display : "Last", key : { }, index : def.l},
                { display : "YTD", key : { }, index : [def.c,def.ytd]},
                { display : "Last Yr", key : { }, index : [def.ly,def.ytd]},
    ],
    rows : [ 	{ display : "Arrears Flows", css : "blank"  }, //need to reserve space
                { display : "0-30", key : { arr : 20, mre : "Flw" } },
                { display : "30-60", key : { arr : 30, mre : "Flw" } },
                { display : "60-90", key : { arr : 40, mre : "Flw" } },
                { display : "90+", key : { arr : xfFilter('arr','90plus',function(d){return d>40;}) , mre : "Flw" } },
                { display : "NPL Flows", css : "blank"  }, //need to reserve space
                { display : "Total", key : { mre : "FlD" } },
                { display : "UTD", key : { arr : 10, mre : "FlD" } },
                { display : "0-90", key : { arr : xfFilter('arr','Early',function(d){return (d>10 && d<50);}), mre : "FlD" } },
                { display : "90+", key : { arr : xfFilter('arr','90plus',function(d){return d>40;}) , mre : "FlD" } }
    ],
    eventHandlers : { '.cell' : { click : cellClicked }, 'tr' : { mouseover : highlight, mouseout : unhighlight } }
};

var reportDef3 = {
    ref : 3,
    name : "rpt3",
    container : "rptCures",
    key : { ent : def.e, prd : "_", prt : def.p, fb : "_", fbt :  "_", mre : "_", arr : "_", npl : "_", prv_cat : "_", uom : def.u }, //may be good practice to define all
    cols : [ 	{ display : "", css : "h4" }, //need to reserve space and set css
                { display : "Movement 13 mths", css : "sparkline" , key : {} , chartType : nv.models.sparkbarPlus },
                { display : "Mth", key : { } },
                { display : "Last", key : { }, index : def.l},
                { display : "YTD", key : { }, index : [def.c,def.ytd]},
                { display : "Last Yr", key : { }, index : [def.ly,def.ytd]},
                { display : "", css : "blank" },
    ],
    rows : [ 	{ display : "Arrears Cures", css : "blank"  }, //need to reserve space
                { display : "0-30", key : { arr : 20, mre : "Cre" } },
                { display : "30-60", key : { arr : 30, mre : "Cre"  } },
                { display : "60-90", key : { arr : 40, mre : "Cre"  } },
                { display : "90+", key : { arr : xfFilter('arr','90plus',function(d){return d>40;}), mre : "Cre"  } },
                { display : "NPL Cures", css : "blank"  }, //need to reserve space
                { display : "Total", key : { mre : "CrD" } },
                { display : "UTD", key : { arr : 10, mre : "CrD" } },
                { display : "0-90", key : { arr : xfFilter('arr','Early',function(d){return (d>10 && d<50);}), mre : "CrD" } },
                { display : "90+", key : { arr : xfFilter('arr','90plus',function(d){return d>40;}), mre : "CrD" } },
                { display : "NPL Cures/Redefault", css : "blank"  }, //need to reserve space
                { display : "Gross Cures", key : { mre : "CrD", npl : "Y" } },
                { display : "Redefaults", key : { mre : "CrD", npl : "R" } }
    ],
    eventHandlers : { '.cell' : { click : cellClicked }, 'tr' : { mouseover : highlight, mouseout : unhighlight } }
};

var reportDef8 = {
    ref : 8,
    name : "rpt8",
    container : "rptProvType",
    key : { ent : def.e, prd : "_", prt : def.p, fb : "_", fbt : "_", mre : "_", arr : "_", npl : "_", prv_cat : "_", uom : def.u }, //may be good practice to define all
    cols : [ 	{ display : "", css : "h4" }, //need to reserve space and set css
                { display : "Movement 13 mths", css : "sparkline" , key : { mre : "BlD"} , chartType : nv.models.sparkbarPlus , index : [def.c,-9] },
                { display : "Mth", key : { mre : "BlD"} },
                { display : "YTD", key : { mre : "BlD"}, index : [def.c,def.ytd]},
                { display : "Stock", key : { mre : "Bal" } },
                { display : "%", key : ofTotalHelper( { mre : "Bal" }, "OfTotalPrt", [ { uom : def.u }, { arr : "_", npl : "_", fb : '_', fbt : "_", prv_cat : '_', uom : def.u } ]) },
                { display : "0-90 days", key : { mre : "Bal", arr : xfFilter('arr','Early',function(d){return (d>=10 && d<50);}) } },
                { display : ">90 days", key : { mre : "Bal", arr : xfFilter('arr','90plus',function(d){return d>40;}) } },
                { display : "iLTV %", format : fp, key : ofTotalHelper( { mre : "Bal" }, "iLTV", [ { uom : "L"}, { uom : "E" } ]) }
    ],
    rows : [ 	{ display : "" }, //need to reserve space
                { display : "Performing", css : "blank" },
                { display : "Performing", key : { prv_cat : "10" } },
                { display : "Prior default", key : { prv_cat : "20" } },
                { display : "Prior forbearance", key : { prv_cat : "25"  } },
                { display : "ST forbearance", key : { prv_cat : "40"  } },
                { display : "LT forbearance", key : { prv_cat : "30"  } },
                { display : "Muti-ST forb.", key : { prv_cat : "45"  } },
                { display : " ", css : "blank" },
                { display : "Non-Performing", css : "blank" },
                { display : "Default", key : { prv_cat : "50"} },
                { display : "ST>12mths", key : { prv_cat : "53"} },
                { display : "Hold", key : { prv_cat : "55"} },
                { display : "Split", key : { prv_cat : "60" } },
                { display : "Re-default", key : { prv_cat : "65" } },
                { display : "Individual", key : { prv_cat : "70" } },
                { display : "CRE Related", key : { prv_cat : "71" } },
                { display : "Cross-default", key : { prv_cat : "72" } },
                { display : "RIP I/O", key : { prv_cat : "73" } },
                { display : " ", css : "blank" },
                { display : "Closure", css : "blank" },
                { display : "Legal Closure", key : { prv_cat : "75" } },
                { display : "AVS", key : { prv_cat : "77" } },
                { display : "Expired", key : { prv_cat : "78" } },
                { display : "Repossession", key : { prv_cat : "80" } },
                { display : "PIA", key : { prv_cat : "85" } },
                { display : "Shortfall", key : { prv_cat : "90" } }
    ],
    eventHandlers : { '.cell' : { click : cellClicked }, 'tr' : { mouseover : highlight, mouseout : unhighlight } }
};

var reportDef9 = {
    ref : 9,
    name : "rpt9a",
    container : "rptBalBox",
    key : { ent : def.e, prd : "_", prt : def.p, fb : "_", fbt :  "_", mre : "_", arr : "_", npl : "_", prv_cat : "_", uom : def.u }, //may be good practice to define all
    cols : [  { display : "", css : "h4" }, //need to reserve space and set css
                { display : "MoM", key : { mre : "BlD" } },
                { display : "YoY", key : { mre : "BlD" }, index : [def.c,-12] },
                { display : "%", key : ofTotalHelper( { mre : "Bal" }, "OfTotalForPrt", [ { uom : def.u }, { arr : "_", npl : "_", fb : "_" } ]) },
                { display : "", css : "blank" },
                { display : "MoM", key : { mre : "BlD", arr : xfFilter('arr','90plus',function(d){return d>40;})  } },
                { display : "YoY", key : { mre : "BlD", arr : xfFilter('arr','90plus',function(d){return d>40;})  }, index : [def.c,-12] },
                { display : "%", key : ofTotalHelper( { mre : "Bal", arr : xfFilter('arr','90plus',function(d){return d>40;}) }, "OfTotalForPrt", [ { uom : def.u }, { arr : "_", npl : "_", fb : "_" } ]) },
                { display : "", css : "blank" },
                { display : "MoM", key : { mre : "BlD", npl : 'Y' } },
                { display : "YoY", key : { mre : "BlD", npl : 'Y' }, index : [def.c,-12] },
                { display : "%", key : ofTotalHelper( { mre : "Bal", npl : 'Y' }, "OfTotalForPrt", [ { uom : def.u }, { arr : "_", npl : "_", fb : "_" } ]) },
                { display : "", css : "blank" },
                { display : "MoM", key : { mre : "BlD", fb : xfFilter('fb','Yes',inFB) } },
                { display : "YoY", key : { mre : "BlD", fb : xfFilter('fb','Yes',inFB) }, index : [def.c,-12] },
                { display : "%", key : ofTotalHelper( { mre : "Bal", fb : xfFilter('fb','Yes',inFB) }, "OfTotalForPrt", [ { uom : def.u }, { arr : "_", npl : "_", fb : "_" } ]) }

    ],
    rows : [ { display : "" }, //need to reserve space
                { display : "", key : {  }  }
    ],
    eventHandlers : { '.cell' : { click : cellClicked }, 'tr' : { mouseover : highlight, mouseout : unhighlight } }
};
var reportDef10 = {
    ref : 9,
    name : "rpt9b",
    container : "rptBalBoxTop",
    key : { ent : def.e, prd : "_", prt : def.p, fb : "_", fbt :  "_", mre : "_", arr : "_", npl : "_", prv_cat : "_", uom : def.u }, //may be good practice to define all
    cols : [  { display : "", css : "" }, //need to reserve space and set css
                { display : "Total", key : { } },
                { display : "", css : "blank" },
                { display : "90 plus", key : { arr : xfFilter('arr','90plus',function(d){return d>40;}) } },
                { display : "", css : "blank" },
                { display : "NPL", key : { npl : 'Y' } },
                { display : "", css : "blank" },
                { display : "Forborne", key : { fb : xfFilter('fb','Yes',inFB) } }
    ],
    rows : [ { display : "", css : "" }, //need to reserve space
                { display : "", key : { mre : "Bal" }, style : "font-size:4em", format : rptFmt2 },
                { display : "", css : "sparkline" , key : { mre : "BlD" } , chartType : nv.models.sparkbarPlus },
    ],
    eventHandlers : { '.cell' : { click : cellClicked }, 'tr' : { mouseover : highlight, mouseout : unhighlight } }
};
//
//*******************************************************************************
//Step 4.2 - Initialise Dashboards
//*******************************************************************************
//Initalise reports
var rpts = {};
var ret = rpts[reportDef1.name] = rpts[reportDef1.ref] = jdcGrid({source : pxf, def: reportDef1});
var flw = rpts[reportDef2.name] = rpts[reportDef2.ref] = jdcGrid({source : pxf, def: reportDef2});
var cre = rpts[reportDef3.name] = rpts[reportDef3.ref] = jdcGrid({source : pxf, def: reportDef3});
var frb = rpts[reportDef4.name] = rpts[reportDef4.ref] = jdcGrid({source : pxf, def: reportDef4});
var fbt = rpts[reportDef5.name] = rpts[reportDef5.ref] = jdcGrid({source : pxf, def: reportDef5});
var sbu = rpts[reportDef6.name] = rpts[reportDef6.ref] = jdcGrid({source : pxf, def: reportDef6});
var prt = rpts[reportDef7.name] = rpts[reportDef7.ref] = jdcGrid({source : pxf, def: reportDef7});
var prv = rpts[reportDef8.name] = rpts[reportDef8.ref] = jdcGrid({source : pxf, def: reportDef8});

var balTop = rpts[reportDef9.name] =  jdcGrid({source : pxf, def: reportDef9});

var bal = rpts[reportDef10.name] = rpts[reportDef10.ref] = jdcGrid({source : pxf, def: reportDef10});


state.addView({ref:0, update:function(){return 0;}},0);
state.addView(ret,1);
state.addView(flw,2);
state.addView(cre,3);
state.addView(frb,4);
state.addView(fbt,5);
state.addView(sbu,6);
state.addView(prt,7);
state.addView(prv,8);

state.addView(balTop,9);
state.addView(bal,9);


//should look to register these and associate with a particular report
//e.g. state.reg(dashboard, reportNo) - updates should just loop through as necessary

//*******************************************************************************
//Step 5 - Set-up event handler and finalise
//*******************************************************************************
$(window) //move this to bottom
    .bind( 'hashchange', anchor.onHashchange )
anchor.changeAnchorPart({portfolio:0, entity:0, report:0});


//Test code for overview
var links = d3.selectAll(".link")
                .on("click",linkClick);

function linkClick(e){
    var item=d3.select(this);
    var v=JSON.parse(item.attr("value"));
    //alert(v);
    changeAnchorPart(v);
    return false;
}


//*******************************************************************************
//Module Template - not used just a template
//*******************************************************************************
function moduleTemplate(o){
    var ret = {};

    var defaults = {

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

        return ret;
    }

    ret.update = function(){

    }

    return ret.init(o);
}