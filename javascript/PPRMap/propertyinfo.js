function loadDSV(dsvFile, delimiter) { //use | to parse
    //var dsv = d3.dsv(delimiter, "text/plain");
    var dsv = d3.dsv(delimiter, "text/plain");
    var csv = dsv.parse(dsvFile, function (d) {
        return {
            _id: d._id,
            Date: d.Date,
            Addr: d.Addr,
            Price: parseFloat(d.Price.replace(/[^\d\.\-]/g, "")),
            Price_Gross: parseFloat(d.Price_Gross.replace(/[^\d\.\-]/g, "")),
            FMP: d.FMP,
            VAT_Ex: d.VAT_Ex,
            Type: d.Type,
            Property: {
                Type: d["Property.Type"],
                Bedrooms: +d["Property.Bedrooms"],
                Bathrooms: +d["Property.Bathrooms"]
            },
            Location: {
                Geo: {
                    Lat: +d["Location.Geo.Lat"],
                    Lng: +d["Location.Geo.Lng"],
                    Exact: d["Location.Geo.Exact"],
                    Source: d["Location.Geo.Source"],
                    found: d["Location.Geo.found"]
                },
                Address: d["Location.Address"],
                Number: d["Location.Number"],
                Area: d["Location.Area"],
                SA: d["Location.SA"],
                ED: d["Location.ED"],
                Post_Code: d["Location.Post_Code"],
                City: d["Location.City"],
                Admin_Cty: d["Location.Admin_Cty"],
                Admin_Cty_Name: d["Location.Admin_Cty_Name"],
                Cty: d["Location.Cty"],
                Prov: d["Location.Prov"],
                Ctry: d["Location.Ctry"]
            }
        }
    }, function (error, rows) {
        console.log(rows);
    });
    return csv;
}

var dataPPR = loadDSV(dataPPRCSV, "|");
//console.log(dataPPR.length);
//console.log(dataPPR[10]);


var o, n = 0, index = {};
for (var i = 0; i < dataPPR.length; i++) {
    o = dataPPR[i];
    if (o)
        index[o["_id"]] = i;
}
//console.log(index["2011_12918"]); //50000
//console.log(dataPPR[0]);

function ref(options) {
    ret = {};
    ret.addData = function (key, data) {
        ret["data"][key] = data;
    }
    ret.lookup = function (key, value, field) {
        return ret["data"][key][value][field];
    }
    ret.parent = function (key, value) {
        return ret["data"][key][value]["parent"];
    }
    function init(options) {
        ret["data"] = {};
        return ret;
    }
    return init(options);
}