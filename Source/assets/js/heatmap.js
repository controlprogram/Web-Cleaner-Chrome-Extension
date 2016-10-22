var start = new Date(2016, 7, 31);
var end = new Date(2016, 11, 31);
var data = {};

for (var current = start.getTime(); current < end.getTime(); current += 2*24*60*60*1000*(1 - Math.pow(Math.random(), 1))) { 
	data[Math.round(current / 1000)] = 1;
}

var cal = new CalHeatMap();  
cal.init({
	domain: "month",
	domainLabelFormat: "%b '%y",
	subDomainDateFormat: "%m/%d/%Y",
	subDomain: "day",
	subDomainTitleFormat: {empty: "{date}", filled: "{count} {name}\n{date}"},
	cellSize: 18,
	data: data,
	subDomainTextFormat: "%d",
	range: 6,
	tooltip: true,
	weekStartOnMonday: false,
	displayLegend: true,
	legendVerticalPosition: "center",
	legendHorizontalPosition: "right",
	legendOrientation: "vertical",
	legendMargin: [0, 10, 0, 0],
	legend: [1, 2, 3, 4, 5],
	itemName: ["Orgasm", "Orgasms"],
	domainMargin: 10,
	animationDuration: 800,
	domainDynamicDimension: true,
	start: start,
	end: end,
	maxDate: new Date(2017, 1),
	highlight: ["now", new Date(2017, 0, 18)],
});  