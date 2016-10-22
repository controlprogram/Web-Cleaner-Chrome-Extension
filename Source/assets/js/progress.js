$(function(){
  $("#doughnutChart").drawDoughnutChart([
	{ title: "Cummed",		  value : 1,  color: "#D7757B" },
	{ title: "Prostate Milked", value:  1,   color: "#FEFDD5" },
	{ title: "Ruined",        value : 1,   color: "#E0F0F3" }
  ], {
  	summaryTitle: 'TOTAL'
  });
});