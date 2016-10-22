function updateDoughnut() {
  $("#doughnutChart").html('').drawDoughnutChart([
	{ title: "Cummed",		  value : cums.length,  color: "#D7757B" },
	{ title: "Prostate Milked", value:  milks.length,   color: "#FEFDD5" },
	{ title: "Ruined",        value : ruins.length,   color: "#E0F0F3" }
  ], {
  	summaryTitle: 'TOTAL'
  });
}