//Request numerical data from server, then Geographic data.
var dataAll = (function () {
    var temp = null;
    $.ajax({
        type: "GET",
        url: "ReportsData/JSON/geodata",
        async: false,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (msg) {
            temp = JSON.parse(msg);
        }
    })
    return temp;
})();

var irl = (function () {
    var temp = null;
    $.ajax({
        type: "GET",
        url: "ReportsData/JSON/ShapeOfIreland",
        async: false,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (msg) {
            temp = JSON.parse(msg);
        }
    })
    return temp;
})();

