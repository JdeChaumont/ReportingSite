var payLoad=function(){
					var key, result = [];
					var dims = ["prt","ent","sector","repay_type","sec_ctry","region","loan_size_band","dpd_band","ltv_band","orig_band","npl","defaulted","impaired","neg_eq","int_rate_type","fb","sale"];
					var mres = ["count","bal","arrs","prv","ew_DiA","ew_iLTV","ew_int_rate","ew_rem_term","ew_TOB"];
					var dimsEncoded = {"prt":{"length":7,"values":{"BTL":"a","CHL":"b","Commercial":"c","HL":"d","IoM":"e","Consumer":"f","Cons\u001a":"g"},"count":{"BTL":40015,"CHL":10497,"Commercial":9643,"HL":129279,"IoM":1921,"Consumer":5740,"Cons\u001a":1},"encoded":{"a":"BTL","b":"CHL","c":"Commercial","d":"HL","e":"IoM","f":"Consumer","g":"Cons\u001a"}},"ent":{"length":3,"values":{"Core":"a","Non-core":"b","undefined":"c"},"count":{"Core":168926,"Non-core":28169,"undefined":1},"encoded":{"a":"Core","b":"Non-core"}},"sector":{"length":10,"values":{"RRE IE":"a","RRE RoW":"b","Comm CRE IE":"c","Comm RRE IE":"d","Comm RRE RoW":"e","Current Account":"f","VISA":"g","Term Lending":"h","NCU":"i","undefined":"j"},"count":{"RRE IE":169294,"RRE RoW":12418,"Comm CRE IE":6633,"Comm RRE IE":2778,"Comm RRE RoW":232,"Current Account":1097,"VISA":797,"Term Lending":2291,"NCU":1555,"undefined":1},"encoded":{"a":"RRE IE","b":"RRE RoW","c":"Comm CRE IE","d":"Comm RRE IE","e":"Comm RRE RoW","f":"Current Account","g":"VISA","h":"Term Lending","i":"NCU"}},"repay_type":{"length":5,"values":{"C&I":"a","I/O":"b","Part C&I":"c","Rev":"d","undefined":"e"},"count":{"C&I":140495,"I/O":40324,"Part C&I":14382,"Rev":1894,"undefined":1},"encoded":{"a":"C&I","b":"I/O","c":"Part C&I","d":"Rev"}},"sec_ctry":{"length":7,"values":{"IE":"a","Missing":"b","GB":"c","FR":"d","IM":"e","NA":"f","undefined":"g"},"count":{"IE":174855,"Missing":6713,"GB":9173,"FR":7,"IM":329,"NA":6018,"undefined":1},"encoded":{"a":"IE","b":"Missing","c":"GB","d":"FR","e":"IM","f":"NA"}},"region":{"length":15,"values":{"Connacht":"a","Cork":"b","Dublin":"c","Leinster":"d","Munster":"e","Ulster":"f","Missing":"g","GB":"h","London":"i","South East":"j","FR":"k","IM":"l","NA":"m","Shortfall":"n","undefined":"o"},"count":{"Connacht":21542,"Cork":20190,"Dublin":42352,"Leinster":48183,"Munster":26390,"Ulster":15546,"Missing":6713,"GB":4584,"London":2362,"South East":2227,"FR":7,"IM":329,"NA":6018,"Shortfall":652,"undefined":1},"encoded":{"a":"Connacht","b":"Cork","c":"Dublin","d":"Leinster","e":"Munster","f":"Ulster","g":"Missing","h":"GB","i":"London","j":"South East","k":"FR","l":"IM","m":"NA","n":"Shortfall"}},"loan_size_band":{"length":12,"values":{"0-<1k":"a","100K-<250K":"b","10K-<20K":"c","1K-<2K":"d","1M-high":"e","20K-<50K":"f","250K-<500K":"g","2K-<5K":"h","500K-<1M":"i","50K-<100K":"j","5K-<10K":"k","undefined":"l"},"count":{"0-<1k":1997,"100K-<250K":63033,"10K-<20K":13248,"1K-<2K":2006,"1M-high":3942,"20K-<50K":29906,"250K-<500K":26562,"2K-<5K":4192,"500K-<1M":8325,"50K-<100K":36599,"5K-<10K":7285,"undefined":1},"encoded":{"a":"0-<1k","b":"100K-<250K","c":"10K-<20K","d":"1K-<2K","e":"1M-high","f":"20K-<50K","g":"250K-<500K","h":"2K-<5K","i":"500K-<1M","j":"50K-<100K","k":"5K-<10K"}},"dpd_band":{"length":8,"values":{"UTD":"a","0-30":"b","180-360":"c","30-60":"d","360<":"e","60-90":"f","90-180":"g","undefined":"h"},"count":{"UTD":120592,"0-30":12094,"180-360":9972,"30-60":8503,"360<":31007,"60-90":5818,"90-180":9109,"undefined":1},"encoded":{"a":"UTD","b":"0-30","c":"180-360","d":"30-60","e":"360<","f":"60-90","g":"90-180"}},"ltv_band":{"length":8,"values":{"<=70":"a","120-<150":"b","150+":"c","70-<100":"d","100-<120":"e","LTVexclusions":"f","NA":"g","undefined":"h"},"count":{"<=70":78426,"120-<150":24454,"150+":16768,"70-<100":41942,"100-<120":26398,"LTVexclusions":3089,"NA":6018,"undefined":1},"encoded":{"a":"<=70","b":"120-<150","c":"150+","d":"70-<100","e":"100-<120","f":"LTVexclusions","g":"NA"}},"orig_band":{"length":6,"values":{"-<2001":"a","2005-2008":"b","2002-2004":"c","2009-2011":"d","2012<-\t":"e","undefined":"f"},"count":{"-<2001":26742,"2005-2008":112641,"2002-2004":40297,"2009-2011":11888,"2012<-\t":5527,"undefined":1},"encoded":{"a":"-<2001","b":"2005-2008","c":"2002-2004","d":"2009-2011","e":"2012<-\t"}},"npl":{"length":3,"values":{"N":"a","Y":"b","undefined":"c"},"count":{"N":95027,"Y":102068,"undefined":1},"encoded":{"a":"N","b":"Y"}},"defaulted":{"length":3,"values":{"N":"a","Y":"b","undefined":"c"},"count":{"N":97009,"Y":100086,"undefined":1},"encoded":{"a":"N","b":"Y"}},"impaired":{"length":3,"values":{"N":"a","Y":"b","undefined":"c"},"count":{"N":113478,"Y":83617,"undefined":1},"encoded":{"a":"N","b":"Y"}},"neg_eq":{"length":4,"values":{"N":"a","Y":"b","NA":"c","undefined":"d"},"count":{"N":126817,"Y":67622,"NA":2656,"undefined":1},"encoded":{"a":"N","b":"Y","c":"NA"}},"int_rate_type":{"length":4,"values":{"Variable":"a","Tracker":"b","Fixed":"c","undefined":"d"},"count":{"Variable":91107,"Tracker":95444,"Fixed":10544,"undefined":1},"encoded":{"a":"Variable","b":"Tracker","c":"Fixed"}},"fb":{"length":11,"values":{"No":"a","Term extension":"b","Hybrid":"c","Capitalisation":"d","I/O":"e","Other":"f",">I/O":"g","<I/O":"h","Zero":"i","Split":"j","undefined":"k"},"count":{"No":114907,"Term extension":8813,"Hybrid":4086,"Capitalisation":12844,"I/O":5719,"Other":12892,">I/O":17460,"<I/O":1523,"Zero":1851,"Split":17000,"undefined":1},"encoded":{"a":"No","b":"Term extension","c":"Hybrid","d":"Capitalisation","e":"I/O","f":"Other","g":">I/O","h":"<I/O","i":"Zero","j":"Split"}},"sale":{"length":3,"values":{"N":"a","Y":"b","undefined":"c"},"count":{"N":193773,"Y":3322,"undefined":1},"encoded":{"a":"N","b":"Y"}}};
					var data = (function () {
									var temp = null;
									$.ajax({
										type: "GET",
										url: "ReportsData/JSON/portdata",
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
					for(k in data){
						var o = {};
						key = k.split('|');
						dims.forEach(function(e,i,a){
							o[e]=key[i];
						});
						o.values = {};
						mres.forEach(function(e,i,a){
							o["values"][e]=data[k][i];
						});
						result.push(o);
					}
					return { "dims":dims, "dimsEncoded":dimsEncoded, "measures":mres, "data":result };
				};