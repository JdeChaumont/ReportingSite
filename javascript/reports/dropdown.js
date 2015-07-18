// Taken from codrops - http://tympanus.net/codrops/2012/10/04/custom-drop-down-list-styling/
function DropDown(options) {
    var o = options;
    this.createDropdown(o);
    this.createEvents(o);
    this.dd = $(o.container);
    this.placeholder = this.dd.children('span');
    this.opts = this.dd.find('ul.dropdown > li');
    this.val =  '';
    this.index = -1;
    this.label = o.label || '';
    this.map = o.map || o.values;
    this.changed  = false;
    this.initEvents();
    // Set initial value
    if(o.initialValue){
        if(this.map){
            this.index = this.map.indexOf(o.initialValue);
            if(this.index>-1){
                this.val = o.values[this.index]; // console.log(this.opts[this.index]);
                $(this.opts[this.index]).addClass('selected');
                this.placeholder.text(this.label + this.val)
            }
        }
    }
}

DropDown.prototype = {
    createDropdown : function (o){
        var obj = this;
        var div = d3.selectAll(o.container);
        var span = div.append('span').html(o.label);
        var opts = div.append('ul').attr('class',function(){ return 'dropdown' });
        var optsEnter = opts.selectAll('li').data(o.values);
        optsEnter.enter().append('li').append('a').attr('href','#').html(function(d){ return d;});
    },
    createEvents : function (o){
        var obj = this;
        obj.events = {};
        if(o.events) {
            for(var k in o.events){
                if(!obj.events[k]){
                    obj.events[k] = [];
                }
                obj.events[k].push(o.events[k]); // may have more then one event handler
            }
        }
        obj.events.fire = function(name,event){
            if(obj.events[name]){
                for(var i=0;i<obj.events[name].length;i++){
                    obj.events[name][i](event);
                }
            }
        }
    },
    initEvents : function() {
        var obj = this;

        obj.dd.on('click', function(event){
            $(this).toggleClass('active');
            return false;
        });

        obj.opts.on('click',function(event){
            var opt = $(this);
            if(obj.index!==opt.index()) { obj.changed = true; }
            obj.val = opt.text();
            obj.index = opt.index();
            obj.placeholder.text(obj.label + obj.val);
            if(obj.changed===true){
                obj.opts.removeClass('selected');
                opt.addClass('selected');
                obj.changed = false; // alert('Changed');
                obj.events.fire('changed',event);
            }
        });
    },
    getValue : function() {
        return this.val;
    },
    getIndex : function() {
        return this.index;
    },
    getMappedValue : function() {
        if(this.index<0) { return 0; }
        if(!this.map) { return this.index; }
        return this.map[this.index];
    }
}
