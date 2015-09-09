//CENSUS
//This function reads in and parses the text file containing the CSV data using the D3 parse function. Returns an array
//of objects which store each individual record.
function loadCensusData(dsvFile, delimiter) {
    var dsv = d3.dsv(delimiter, "text/plain");
    var csv = dsv.parse(dsvFile, function (d) {
        return {
            "Level": d["Level"],
            "id": d["id"],
            "Name": d["Name"],
            "Parent": d["Parent"],
            "Male2011": +d["Male2011"],
            "Female2011": +d["Female2011"],
            "Total2011": +d["Total2011"],
            "PPOcc2011": +d["PPOcc2011"],
            "Unocc2011": +d["Unocc2011"],
            "HS2011": +d["HS2011"],
            "Vacant2011": +d["Vacant2011"],
            "PCVac2011": +d["PCVac2011"]
        }
    }, function (error, rows) {
        console.log(rows);
    });
    return csv;
}

//Fires the function above and loads the Census data into an array.
var census2011DataArray = loadCensusData(dataCensus2011, "|");
var census2011Data = {};
for (var i = 0; i < census2011DataArray.length; i++) {
    census2011Data[census2011DataArray[i]["id"]] = census2011DataArray[i];
}

//SMALL AREA
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

var o, n = 0, index = {};
for (var i = 0; i < dataPPR.length; i++) {
    o = dataPPR[i];
    if (o)
        index[o["_id"]] = i;
}

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

