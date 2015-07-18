function propertySalesData(data) {
    var r = {}; //result
    r.data = {};
    r.cache = {};
    r.levels = ["Admin_Cty", "ED", "SA"]; //pass this in

    r.fillLevel = function (level) {
        if (r.cache[level])
            return r.cache[level];
        else
            return r.cache[level] = r.data.reduce(reduceByField(r.levels[level]), []);
    }

    var x = 0;
    function reduceByField(field) {
        return function (res, e, i, a) {
            //console.log(e);
            //console.log(res);
            if (e) {
                var f = e["Location"][field]; //need to know structure
                if ((++x % 10000) === 0) //console.log(f);
                if (f) {
                    if (!res[f]) {
                        res[f] = [];
                    }
                    res[f].push(e._id);
                }
            }
            return res;
        }
    }

    r.getData = function (level, key) {
        if (!r.cache[level])
            r.cache[level] = r.fillLevel(level);

        if (!key)
            return r.cache[level];

        if (r.cache[level][key])
            return r.cache[level][key];
        else
            return {};

    }

    r.stats = function (level, key) {
        return stats(r.getData(level, key).map(function (e, i, a) { if (!r.data[index[e]]["Price"]) { return 0; } return parseFloat(r.data[index[e]]["Price"]); }));
    }

    function stats(a) {
        var res = {};
        var n = a.length;
        if (n > 0) {
            a.sort(ascending);
            res["count"] = n;
            res["sum"] = a.reduce(function (r, e, i, a) { return r + e; });
            res["mean"] = res["sum"] / res["count"];
            res["median"] = nthPercentile(50);
            res["min"] = a[0];
            res["max"] = a[n - 1];
            res["var"] = a.reduce(function (r, e, i, a) { return Math.pow(e - res["mean"], 2); }, 0) / (n - 1);
            res["stdDev"] = Math.sqrt(res["var"]);
            res["decile1"] = nthPercentile(10);
            res["decile9"] = nthPercentile(90);
            res["quartile1"] = nthPercentile(25);
            res["quartile3"] = nthPercentile(75);
            res["mode"] = a.reduce(function (r, e, i, a) {
                if (e !== r["last"]) {
                    r["last"] = e;
                    r["count"] = 0;
                } else {
                    if (++r["count"] > r["modeCount"]) {
                        r["modeCount"] = r["count"];
                        r["mode"] = e;
                    }
                }
                return r;
            }, { "mode": 0, "modeCount": 0, "last": 0, "count": 0 })["mode"];
            res["zeroes"] = a.reduce(function (r, e, i, a) { if (e === 0) r++; return r; }, 0);
            r.statsArray = a;
        }
        return res;

        function nthPercentile(nth) {
            var d = (100 / nth);
            var p = Math.floor(n / d);
            if (n % d) {
                return a[p];
            } else {
                return (a[p - 1] + a[p]) / 2.0;
            }
        }

        function ascending(a, b) {
            return a - b;
        }
    }

    function init(data) {
        r.data = data;
        r.getData(0);
        //console.log("Completed property sales level 0");
        //console.log(r.cache["0"].length);
        return r;
    }
    return init(data);
}

var propertySales = propertySalesData(dataPPR); //wrong data set
//console.log(propertySales.stats(0, "02"));
//console.log(propertySales.statsArray);

var dataDims = ["Location.Cty",
        "Location.Admin_Cty",
        "Location.ED",
        "Location.SA",
        "Date",
        "Property.Bedrooms",
        "Property.Type",
        "Property.Bathrooms",
        "Year"];

function defaultResult() {
    return {
        "count": 0, "sum": 0, "mean": 0, "median": 0, "min": 0, "max": 0, "var": 0, "stdDev": 0, "mode": 0,
        "decile1": 0, "decile9": 0, "quartile1": 0, "quartile3": 0
    };
}

//var pxf = jdcDataProvider({data : dataPPR.slice(0), dims : dataDims, indices : dataIndices, result : defaultResult });
//console.log(dataPPR[0]);
//var pxf = jdcDataProvider({data : dataPPR, dims : dataDims });


var pprData = dFilterBase({
    data: dataPPR, dims: dataDims,
    dimsToAdd: [ //these will be added to the dims to export
        //{ 'derivedFrom' : 'Date', 'name' : 'Year', 'grpFn' : function(f){ return f.substr(0,4); } }
        { 'derivedFrom': 'Date', 'name': 'Year', 'grpFn': function (f) { return f.substr(0, 4); } }
    ],
});
//console.log(pprData);
var pxf = dProvider({ src: [{ "id": "ppr", "data": pprData }] });

var searchKey = {
    "Location.Cty": "_",
    "Location.Admin_Cty": "05",
    "Location.ED": "_",
    "Location.SA": "_",
    "Location.Cty": "_",
    "Date": "_",
    "Property.Bedrooms": "_",
    "Property.Type": "_",
    "Property.Bathrooms": "_",
    "mre": "Count"
};

var zzz = pxf.getPopulation({ "Location.ED": "16003" });
//console.log(zzz);

//*******************************************************************************
//Step X - Create Dashboard Definitions
//*******************************************************************************
s = function () {
    ret = {};
    var lvl = 0;
    var reg = "_";
    ret.setRegion = function (id, level) {
        reg = id;
        lvl = level;
    }
    ret.Admin_Cty = function () {
        if (lvl === 0) {
            return reg;
        }
        return "_";
    }
    ret.ED = function () {
        if (lvl === 1) {
            return reg;
        }
        return "_";
    }
    ret.SA = function () {
        if (lvl === 2) {
            return reg;
        }
        return "_";
    }
    function regionLevel() {
        var levels = ["Location.Admin_Cty", "Location.ED", "Location.SA"];
        return levels[map.level()];
    }
    return ret;
}();

var reportDef1 = {
    ref: 1,
    name: "rpt1",
    container: "rptArrears",
    key: {
        "Location.Cty": "_",
        "Location.Admin_Cty": s.Admin_Cty,
        "Location.ED": s.ED,
        "Location.SA": s.SA,
        "Location.Cty": "_",
        "Date": "_",
        "Property.Bedrooms": "_",
        "Property.Type": "_",
        "Property.Bathrooms": "_",
        "mre": "count"
    }, //may be good practice to define all
    cols: [{ display: "", css: "h4" }, //need to reserve space and set css
                //{ display : "Movement 13 mths", css : "sparkline" , key : { mre : "BlD"}, chartType : nv.models.sparkbarPlus },
                { display: "2010", key: { "Date": xfFilter('Date', '2010', function (d) { return d.indexOf("2010") > -1; }) } },
                { display: "2011", key: { "Date": xfFilter('Date', '2011', function (d) { return d.indexOf("2011") > -1; }) } },
                { display: "2012", key: { "Date": xfFilter('Date', '2012', function (d) { return d.indexOf("2012") > -1; }) } },
                { display: "2013", key: { "Date": xfFilter('Date', '2013', function (d) { return d.indexOf("2013") > -1; }) } },
                { display: "2014", key: { "Date": xfFilter('Date', '2014', function (d) { return d.indexOf("2014") > -1; }) } },
                { display: "2015", key: { "Date": xfFilter('Date', '2015', function (d) { return d.indexOf("2015") > -1; }) } },
                { display: "All", key: { "Date": "_" } },
                { display: "     ", css: "blank" }
    ],
    rows: [{ display: "" }, //need to reserve space
                { display: "Count", key: { "mre": "count" } },
                { display: "Total", key: { "mre": "sum" } },
                { display: "Average", key: { "mre": "mean" } },
                { display: "Minimum", key: { "mre": "min" } },
                { display: "Maximum", key: { "mre": "max" } },
                { display: "Mode", key: { "mre": "mode" } },
                { display: "Median", key: { "mre": "median" } },
                { display: "90th percentile", key: { "mre": "decile9" } },
                { display: "Top quartile", key: { "mre": "quartile3" } },
                { display: "Bottom quartile", key: { "mre": "quartile1" } },
                { display: "10th percentile", key: { "mre": "decile1" } }],
    eventHandlers: { '.cell': { click: cellClicked }, 'tr': { mouseover: highlight, mouseout: unhighlight } }
};

var state = {
    "Location.Cty": "_",
    "Location.Admin_Cty": "_",
    "Location.ED": "_",
    "Location.SA": "_",
    "Location.Cty": "_",
    "Date": "_",
    "Property.Bedrooms": "_",
    "Property.Type": "_",
    "Property.Bathrooms": "_",
    "mre": "_"
};

var rpts = {};
var rpt = rpts[reportDef1.name] = rpts[reportDef1.ref] = jdcGrid({ source: pxf, def: reportDef1 });
rpt.update();
//state.addView(ret);
function reportUpdate() {
    rpt.update();
}
//console.log(pxf);