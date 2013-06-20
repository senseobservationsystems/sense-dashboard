"use strict";angular.module("highcharts.directives",[]).directive("chart",function(){return{restrict:"E",template:"<div></div>",transclude:!0,replace:!0,link:function(a,b,c){var d={chart:{renderTo:b[0],type:c.type||null,height:c.height||null,width:c.width||null}};a.$watch(function(){return c.value},function(){c.value||b.text("No data found");var a=!0,e={};try{$.extend(a,e,d,JSON.parse(c.value)),new Highcharts.Chart(e)}catch(f){}})}}}),angular.module("dashboardApp.resource",[]).service("csResource",["$resource","$http","$q",function(a,b,c){this.baseUri="http://api.sense-os.nl",this.CurrentUser=a(this.baseUri+"/users/current.json"),this.User=a(this.baseUri+"/users/:id.json",{id:"@id"}),this.Group=a(this.baseUri+"/groups.json",{},{query:{method:"GET",isArray:!1}}),this.GroupUser=a(this.baseUri+"/groups/:groupId/users",{},{query:{method:"GET",isArray:!1}}),this.GroupSensor=a(this.baseUri+"/groups/:groupId/sensors",{},{query:{method:"GET",isArray:!1}}),this.Sensor=a(this.baseUri+"/sensors.json",{},{query:{method:"GET",isArray:!1}}),this.MultipleSensorData=a(this.baseUri+"/sensors/data.json",{},{query:{method:"GET",isArray:!1}}),this.SensorData=a(this.baseUri+"/sensors/:id/data.json",{id:"@id"},{query:{method:"GET",isArray:!1}}),this.getDataRec=function(a,b,c,d,e,f,g){var h=angular.extend({page:d,per_page:e},b),i=this;a.query(h,function(h){f=f.concat(h[c]),h[c].length===e?i.getDataRec(a,b,c,d+1,e,f,g):g.resolve({success:!0,result:f})},function(){console.log("error while retreiving resource"),g.resolve({success:!1,result:f})})},this.getAllData=function(a,b,d){var e=c.defer();return this.getDataRec(a,b,d,0,1e3,[],e),e.promise}}]),angular.module("dashboardApp.services",["dashboardApp.resource"]).service("authService",["$q","$http","csResource","$cookies",function(a,b,c,d){this.sessionId="",this.currentUser={},this.loggedIn=!1,this.check=function(){return this.loggedIn?!0:d.sessionId?(this.sessionId=d.sessionId,this.currentUser=JSON.parse(d.currentUser),this.loggedIn=!0,b.defaults.headers.common["X-SESSION_ID"]=this.sessionId,!0):!1},this.logout=function(){this.sessionId=null,this.currentUser=null,delete d.sessionId,delete d.currentUser,this.loggedIn=!1},this.login=function(e,f){var g=a.defer(),h={username:e,password:Crypto.MD5(f)},i=this;return b.post(c.baseUri+"/login.json",h).success(function(a,e,f){i.sessionId=f("X-SESSION_ID"),d.sessionId=i.sessionId,b.defaults.headers.common["X-SESSION_ID"]=i.sessionId,i.loggedIn=!0,i.currentUser=c.CurrentUser.get(function(){d.currentUser=JSON.stringify(i.currentUser),g.resolve(i.sessionId)})}).error(function(a,b){var c={message:"Cant login to commonsense",data:a,status:b};i.loggedIn=!1,g.reject(c)}),g.promise}}]),angular.module("dashboardApp.services").factory("dashboardService",["$q","csResource",function(a,b){function c(){this.groupId=null,this.users={},this.userIds=[],this.userIdMap={},this.sensorIds=[],this.sensorIdMap={},this.currentUser={},this.window=21600,this.reset=function(){this.users={},this.userIds=[],this.userIdMap={},this.sensorIds=[],this.sensorIdMap={},this.currentUser={}},this.initialize=function(c,d){this.reset(),this.groupId=c,this.currentUser=d;var e=a.defer(),f=this;return f.users=b.GroupUser.query({groupId:c},function(a){for(var g=0;g<a.users.length;g++){var h=f.users.users[g];h.accepted!==!1&&(f.userIds.push(h.id),f.userIdMap[h.id]=h)}b.getAllData(b.GroupSensor,{groupId:c,details:"full"},"sensors").then(function(a){if(!a.success)return console.log("error while getting sensors for group"),void 0;for(var c=a.result,g=function(){console.log("failed while getting last data point for sensor"+j.id)},h=function(a){if(a.data.length>0){var b=a.data[0].sensor_id,c=f.sensorIdMap[b];c.processData(a.data)}},i=0;i<c.length;i++){var j=c[i];f.keepSensor(j)&&(f.sensorIds.push(j.id),f.sensorIdMap[j.id]=j,j.user=j.owner?f.userIdMap[j.owner.id]:d,"Location"===j.name?(j.processData=f.processLocation,j.user.location="Unknown",j.user.location_sensor=j):"Reachability"===j.name?(j.processData=f.processReachability,j.user.reachability_sensor=j):j.processData=f.processNothing,b.SensorData.query({id:j.id,last:1},h,g))}for(var k=f.users.users,l=k.length;l--;){var m=k[l];m.accepted===!1&&k.splice(l,1),m.show=-1===["7890","6328"].indexOf(m.id)}e.resolve(f.users)})}),e.promise},this.keepSensor=function(a){var b=a.owner;if(!b)return a.owner={id:this.currentUser.id},!0;var c=["Location","Reachability"];return this.userIds.indexOf(b.id)>=0&&c.indexOf(a.name)>=0},this.fetchSensorData=function(){var a=(new Date).getTime()/1e3-this.window;console.log("fetching sensor data "+a);var c=this,d={start_date:a};for(var e in this.sensorIds)d["sensor_id["+e+"]"]=this.sensorIds[e];var f=b.getAllData(b.MultipleSensorData,d,"data");f.then(function(a){if(!a.success)return console.log("error while fetching multiple sensor data"),void 0;var b=a.result,d={};if(b)for(var e=0;e<b.length;e++){var f=b[e];d[f.sensor_id]?d[f.sensor_id].push(f):d[f.sensor_id]=[f]}for(var g in c.sensorIdMap){var h=c.sensorIdMap[g];h.processData(d[h.id])}})},this.processLocation=function(a){var b="Unknown";if(a&&a.length>0){var c=a[a.length-1],d=(new Date).getTime()/1e3;d-c.date<43200&&(b=c.value)}this.user.location=b,this.user.locationLabel="work"===b?"In office":"Out of office"},this.processReachability=function(a){var b="reachable";if(a&&a.length>0){var c=a[a.length-1],d=(new Date).getTime()/1e3;d-c.date<43200&&(b=c.value)}this.user.reachability=b,this.user.phoneLabel="reachable"===b?"Available":"Busy"},this.processNothing=function(){}}return new c}]),angular.module("dashboardApp.services").factory("personalSensor",["$q","csResource","authService",function(a,b,c){function d(){this.initialize=function(d){var e=a.defer();return b.getAllData(b.GroupSensor,{groupId:d,details:"full"},"sensors").then(function(a){a.success||(console.log("error getting sensor for group "+d),e.reject());var b=a.result,f=c.currentUser.user.id;for(var g in b){var h=b[g];h&&(h.owner||(h.owner={id:f}))}e.resolve(b)}),e.promise},this.findFirstSensor=function(a,b,c){var d=[];$.isArray(b)||(b=[b]);for(var e in a){var f=a[e];f&&b.indexOf(f.name)>=0&&(c?c&&f.owner.id===c&&d.push(f):d.push(f))}return d.sort(this.compareSensorById),d},this.compareSensorById=function(a,b){if(a&&!b)return 1;if(!a&&b)return-1;if(!a&&!b)return 0;var c=parseInt(a.id,10),d=parseInt(b.id,10);return d>c?-1:c>d?1:0}}return new d}]),angular.module("dashboardApp.services").factory("chartService",["$q","csResource","csUtil",function(a,b,c){function d(a){var b=[],c={name:"Temperature (°C)",data:[]},d={name:"Humidity (%)",data:[]};for(var e in a){var f=1e3*a[e].date,g=JSON.parse(a[e].value),i=g.temp-273.15;i=h(i,2),c.data.push({x:f,y:i,city:g.city}),g.humidity||(g.humidity=null),d.data.push({x:f,y:g.humidity})}return b.push(c),b.push(d),b}function e(a){var b=[],c={pointInterval:864e5,name:"Sleep (Hours)",data:[],type:"column"};for(var d in a){var e=1e3*a[d].date,f=h(a[d].value,2);c.data.push({x:e,y:f})}return b.push(c),b}function f(a){var b=[],c={name:"X axis",data:[],type:"line"},d={name:"Y axis",data:[],type:"line"},e={name:"Z axis",data:[],type:"line"};for(var f in a){var g=1e3*a[f].date,i=JSON.parse(a[f].value);c.data.push({x:g,y:h(i["x-axis"],3)}),d.data.push({x:g,y:h(i["y-axis"],3)}),e.data.push({x:g,y:h(i["z-axis"],3)})}return b.push(c),b.push(d),b.push(e),b}function g(a){var b=[],c=["unknown","sit","stand"],d={name:"Activity",data:[],type:"line"};for(var e in a){var f=1e3*a[e].date,g=a[e].value,h=c.indexOf(g);d.data.push({x:f,y:h})}return b.push(d),b}function h(a,b){return c.getFloat(a,b)}function i(){this.personalWeatherChart=function(c,e,f){var g=a.defer();return b.getAllData(b.SensorData,{id:c.id,start_date:e,interval:f},"data").then(function(a){if(!a.success)return console.log("error while getting personal weather data"),void 0;var b=a.result,c=d(b),e={colors:["#fc962f","#fa54dd","#ed2931"],chart:{zoomType:"x"},title:null,yAxis:[{labels:{format:"{value}°C"},title:{text:"Temperature"}},{labels:{format:"{value}%"},title:{text:"Humidity (%)"},opposite:!0,linkTo:0}],xAxis:{type:"datetime",dateTimeLabelFormats:{day:"%e. %b"}},series:c,tooltip:{crosshairs:!0,shared:!0,formatter:function(){var a="<b>"+Highcharts.dateFormat("%a, %e %b %Y %H:%M",this.x)+"</b>";for(var b in this.points){var c=this.points[b];a+="<br/>",a+='<span style="color:'+c.series.color+'">'+c.series.name+"</span>: <b>"+c.y+"</b>",c.point.hasOwnProperty("city")&&(a+="<br/>city : "+c.point.city)}return a}}};g.resolve(e)},function(){console.log("failed while fetching data for sensor: "+c.id)}),g.promise},this.sleepChart=function(c,d,f){var g=a.defer();return b.getAllData(b.SensorData,{id:c.id,start_date:d,interval:f},"data").then(function(a){if(a.value)return console.log("error while getting sleep data"),void 0;var b=a.result,c=e(b),d={colors:["#fc962f","#fa54dd","#ed2931"],chart:{},title:null,xAxis:{type:"datetime",dateTimeLabelFormats:{day:"%e. %b"},minTickInterval:864e5},series:c};g.resolve(d)},function(){console.log("failed while fetching data for sensor: "+c.id)}),g.promise},this.accelerometerChart=function(c,d,e){var g=a.defer();return b.getAllData(b.SensorData,{id:c.id,start_date:d,interval:e},"data").then(function(a){if(a.value)return console.log("error while getting accelerometer data"),void 0;var b=a.result,c=f(b),d={colors:["#fc962f","#fa54dd","#ed2931"],chart:{},title:null,xAxis:{type:"datetime",dateTimeLabelFormats:{day:"%e. %b"}},plotOptions:{line:{marker:{enabled:!1}}},tooltip:{shared:!0,crosshairs:!0},series:c};g.resolve(d)},function(){console.log("failed while fetching data for sensor: "+c.id)}),g.promise},this.activityChart=function(c,d,e){var f=a.defer();return b.getAllData(b.SensorData,{id:c.id,start_date:d,interval:e},"data").then(function(a){if(a.value)return console.log("error while getting activity data"),void 0;var b=a.result,c=g(b),d={colors:["#fc962f","#fa54dd","#ed2931"],chart:{},title:null,xAxis:{type:"datetime",dateTimeLabelFormats:{day:"%e. %b"}},yAxis:{title:{text:"Activity"},min:0,minorGridLineWidth:0,gridLineWidth:0,alternateGridColor:null,plotBands:[{from:0,to:1.5,color:"rgba(68, 170, 213, 0.1)",label:{text:"Sit",style:{color:"#606060"}}},{from:1.5,to:2.5,color:"rgba(0, 0, 0, 0)",label:{text:"Stand",style:{color:"#606060"}}}]},series:c,tooltip:{crosshairs:!0,formatter:function(){var a="<b>"+Highcharts.dateFormat("%a, %e %b %Y %H:%M",this.x)+"</b>",b=this;return a+="<br/>",a+='<span style="color:'+b.series.color+'">'+b.series.name+"</span>: <b>"+["unknown","Sit","Stand"][b.y]+"</b>"}}};f.resolve(d)},function(){console.log("failed while fetching data for sensor: "+c.id)}),f.promise}}return Highcharts.setOptions({global:{useUTC:!1}}),new i}]),angular.module("dashboardApp.services").factory("csUtil",[function(){function a(){this.getFloat=function(a,b){a=parseFloat(a);var c=Math.pow(10,b);return Math.round(a*c)/c}}return new a}]),angular.module("gravatarFilters",[]).filter("gravatarUrl",function(){return function(a,b){if(a){var c="http://www.gravatar.com/avatar/";return c+=Crypto.MD5(a),b&&(c+="?s="+b),c}}});var dashboardDebug=!1;angular.module("dashboardApp",["ngResource","ngCookies","dashboardApp.services","gravatarFilters","highcharts.directives"]).config(["$routeProvider","$httpProvider",function(a,b){delete b.defaults.headers.common["X-Requested-With"],a.when("/",{templateUrl:"views/login.html",controller:"MainCtrl"}).when("/dashboard",{templateUrl:"views/dashboard.html",controller:"DashboardCtrl"}).when("/person/:id",{templateUrl:"views/person.html",controller:"PersonCtrl"}).when("/logout",{templateUrl:"views/login.html",controller:"LogoutCtrl"}).otherwise({redirectTo:"/"})}]),angular.module("dashboardApp").controller("MainCtrl",["$scope","authService","$window","$location",function(a,b,c,d){a.user={},a.doLogin=function(){b.login(a.user.username,a.user.password).then(function(){var a="/dashboard";d.search().r&&(a=d.search().r),d.path(a)},function(a){c.alert("Login Failed : "+a.data.error)})}}]),angular.module("dashboardApp").controller("DashboardCtrl",["$scope","$location","$timeout","authService","dashboardService",function(a,b,c,d,e){function f(a,b){return a&&!b?1:!a&&b?-1:a||b?b>a?-1:a>b?1:0:0}function g(b,c){var d=f(a.fullName(b),a.fullName(c));return d}function h(a,b){return f(a.location,b.location)}function i(a,b){return f(a.reachability,b.reachability)}return a.loggedIn=d.check(),a.loggedIn?(a.$watch(function(){return dashboardDebug},function(){a.dashboardDebug=dashboardDebug}),a.pollData=function(){a.timer=c(function(){e.fetchSensorData(),a.pollData()},2e3)},a.initialize=function(){e.initialize(1875,d.currentUser.user).then(function(b){a.users=b,e.fetchSensorData(),a.pollData()})},a.$on("$destroy",function(){c.cancel(a.timer)}),a.fullName=function(a){return a.name+" "+a.surname},a.showPerson=function(a){window.location.href="#/person/"+a},a.sortUser=function(b){switch(a.sort=b.toLowerCase(),a.dir="asc"===a.dir?"desc":"asc",b){case"who":a.users.users.sort(g);break;case"where":a.users.users.sort(h);break;case"reachable":a.users.users.sort(i)}"desc"===a.dir&&a.users.users.reverse()},void 0):(b.path("/"),void 0)}]),angular.module("dashboardApp").controller("PersonCtrl",["$scope","$location","$routeParams","$window","$timeout","authService","personalSensor","csResource","chartService","csUtil",function(a,b,c,d,e,f,g,h,i,j){function k(){console.log("destroy: clearing timeout"),e.cancel(a.accelerometerTimer),e.cancel(a.activityTimer),e.cancel(a.reachabilityTimer)}var l=f.check();if(!l)return d.location.href="/",void 0;b.search("r",null),a.$watch(function(){return dashboardDebug},function(){a.dashboardDebug=dashboardDebug}),a.userId=c.id,a.reachability="loading..",a.userId===f.currentUser.user.id?a.user=f.currentUser.user:h.GroupUser.query({groupId:"1875"},function(b){for(var c=0;c<b.users.length;c++){var d=b.users[c];d.id===a.userId&&(a.user=d)}}),a.sensors=[],a.fullName=function(a){return a.name+" "+a.surname};var m="1875";g.initialize(m).then(function(b){function c(){a.reachabilityTimer=e(function(){h.SensorData.query({id:a.reachabilitySensor.id,last:1},function(b){if(b.data.length>0){var c=b.data[0],d=(new Date).getTime()/1e3;a.reachability=d-c.date<43200?c.value:"reachable"}else a.reachability="reachable";a.phoneLabel="reachable"===a.reachability?"Available":"Busy"},function(){console.log("failed getting reachability data")}),c()},2e3)}function d(){a.locationTimer=e(function(){h.SensorData.query({id:a.locationSensor.id,last:1},function(b){a.location="unknown",b.data.length>0&&(a.location=b.data[0]),a.locationLabel="work"===a.location?"In office":"Out of office"}),d()},5e3)}a.sensors=b;var f=g.findFirstSensor(b,"weather",a.userId);a.weatherSensor=f[f.length-1];var k=g.findFirstSensor(b,"Location",a.userId);a.locationSensor=k[k.length-1];var l=g.findFirstSensor(b,["sleep","Sleep","Sleep Time","sleep_time"],a.userId);a.sleepSensor=l[l.length-1];var m=g.findFirstSensor(b,"Reachability",a.userId);a.reachabilitySensor=m[m.length-1];var n=g.findFirstSensor(b,"accelerometer",a.userId);a.accelerometerSensor=n[n.length-1];var o=g.findFirstSensor(b,"Activity",a.userId);if(a.activitySensor=o[o.length-1],a.reachabilitySensor&&c(),a.locationSensor&&d(),a.weatherSensor){var p=(new Date).getTime()/1e3-604800,q=3600;i.personalWeatherChart(a.weatherSensor,p,q).then(function(a){a.chart.renderTo="weatherChart",new Highcharts.Chart(a)})}if(a.sleepSensor){var r=(new Date).getTime()/1e3-2592e3,s=86400;i.sleepChart(a.sleepSensor,r,s).then(function(b){a.personalSleepData=b})}if(a.activitySensor){var t=(new Date).getTime()/1e3-3600,u=60;i.activityChart(a.activitySensor,t,u).then(function(b){function c(){console.log("updating activity data"),a.activityTimer=e(function(){var b=a.activitySensor.id;h.getAllData(h.SensorData,{id:b,start_date:f},"data").then(function(a){if(a.value)return console.log("error while getting activity data"),void 0;var b=a.result;if(b&&b.length>0&&b[b.length-1].date!==f){console.log("got new activity data");var c=d.series,e=c[0];f=e.data[e.data.length-1].x;for(var g in b){var h=b[g],i=h.value,j=1e3*h.date,k=["unknown","sit","stand"].indexOf(i);(!f||j>f)&&(e.addPoint([j,k],!0,!0),f=j/1e3)}}else console.log("old data")},function(){console.log("error while updating activity data")}),c()},5e3)}b.chart.renderTo="activityChart",b.chart.height=220;var d=new Highcharts.Chart(b);a.personalActivityChart=d;var f,g=b.series[0].data;g.length>0&&(f=g[g.length-1].date/1e3),f||(console.log("no last date"),f=t),c()})}if(a.accelerometerSensor){var v=(new Date).getTime()/1e3-300,w=null;i.accelerometerChart(a.accelerometerSensor,v,w).then(function(b){function c(){a.accelerometerTimer=e(function(){var b=a.accelerometerSensor.id;h.getAllData(h.SensorData,{id:b,start_date:f},"data").then(function(a){if(a.value)return console.log("error while getting activity data"),void 0;var b=a.result;if(b&&b.length>0&&b[b.length-1].date!==f){g=b[b.length-1],f=g.date;for(var c in b){var e=b[c],h=JSON.parse(e.value),i=d.series,k=1e3*e.date,l=j.getFloat(h["x-axis"],2),m=j.getFloat(h["y-axis"],2),n=j.getFloat(h["z-axis"],2);i[0].addPoint([k,l],!0,!0),i[1].addPoint([k,m],!0,!0),i[2].addPoint([k,n],!0,!0)}}},function(){console.log("error while updating accelerometer data")}),c()},5e3)}b.chart.renderTo="accelerometerChart",b.chart.height=220;var d=new Highcharts.Chart(b);a.personalAccelerometerData=d;var f,g=null,i=b.series[0].data;i.length>0&&(f=i[i.length-1].x/1e3),f||(console.log("no last date"),f=v),c()})}}),a.$on("$destroy",function(){k()})}]),angular.module("dashboardApp").controller("LogoutCtrl",["$scope","authService","$location",function(a,b,c){b.logout(),c.path("/")}]);