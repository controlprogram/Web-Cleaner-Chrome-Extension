(function() {
	var data = {}, today, currentMonth, start, end;

	today = new Date();
	today.setHours(0);
	today.setMinutes(0);
	today.setSeconds(0);

	currentMonth = new Date(today.getTime());
	currentMonth.setDate(1);

	start = new Date(currentMonth.getTime());
	start.setMonth(start.getMonth() - 4);

	end = new Date(currentMonth.getTime());
	end.setMonth(end.getMonth() + 2);
	end.setSeconds(-1);

	stats.getEvents(['cummed', 'milked', 'ruined'], start.getTime(), end.getTime()).forEach(function(event) {
		// Shift event time to make orgasms between 12am and 2am appear on the previous day.
		data[Math.floor((event.time - startOfDay) / 1000)] = 1;
	});

	stats.listen('installed', function() {
		cal.update({});
	});

	stats.listen(['cummed', 'milked', 'ruined'], start.getTime(), end.getTime(), function(events) {
		var data = {};
		events.forEach(function(event) {
			data[Math.floor((event.time - startOfDay) / 1000)] = 1;
		});
		cal.update(data, false, cal.APPEND_ON_UPDATE);
	});

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
		//maxDate: new Date(2017, 1),
		highlight: ["now"],
	}); 
}());