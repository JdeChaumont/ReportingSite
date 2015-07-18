var dataAll = (function () {
    var temp = null;
    $.ajax({
        type: "GET",
        url: "ReportsData.svc/JSON/geodata",
        data: "{}",
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
        url: "ReportsData.svc/JSON/ShapeOfIreland",
        data: "{}",
        async: false,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (msg) {
            temp = JSON.parse(msg);
        }
    })
    return temp;
})();

