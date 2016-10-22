var doughnut;

function initDoughnut() {
  doughnut = $("#doughnutChart").drawDoughnutChart([
	{ title: "Cummed",		  get value() { return cums.length; },  color: "#D7757B" },
	{ title: "Prostate Milked", get value() { return milks.length; },   color: "#FEFDD5" },
	{ title: "Ruined",        get value() { return ruins.length; },   color: "#E0F0F3" }
  ], {
  	summaryTitle: 'TOTAL'
  });
}

function updateDoughnut() {
	doughnut.update();
}