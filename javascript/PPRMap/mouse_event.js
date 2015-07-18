function fireEvent(name, target) {
    //Ready: create a generic event
    var evt = document.createEvent("Events")
    //Aim: initialize it to be the event we want
    evt.initEvent(name, true, true); //true for can bubble, true for cancelable
    //FIRE!
    target.dispatchEvent(evt);
}
function foobar(e) {
    console.log("foobar called");
    console.log(this);
}

function testEvents() {
    window.addEventListener("doubleClick", foobar, false); //false to get it in bubble not capture.
}

function singleClick(e) {
    fireEvent("singleClick", document);
    console.log("singleClick fired");
    console.log(this);
}

function doubleClick(e) {
    fireEvent("doubleClick", document);
    console.log("doubleClick fired");
    console.log(this);
}

function s(e) {
    console.log("single fired");
    clicked.call(this, e);
}

function d(e) {
    console.log("double fired");
    doubleClicked.call(this, e);
}

//This works
function clickParse(single, double) {
    return function (e) {
        var that = this;
        var dblclick = parseInt($(that).data('double'), 10) || 0;
        $(that).data('double', ++dblclick);
        if (dblclick > 1) {
            double.call(that, e);
        } else {
            setTimeout(function () {
                if (parseInt($(that).data('double'), 10) < 2) {
                    single.call(that, e);
                }
                $(that).data('double', 0);
            }, 300);
        }
    }
}