var express = require('express');
var router = express.Router();
var multer = require('multer')
var fs = require('fs');

var lesson_1 = require('../public/javascripts/lesson_1');

var upload = multer({dest: './uploads/'});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Урок №1'});
});

router.post('/', upload.single('data'), function(req, res, next) {

  var calculations = new lesson_1(fs.readFileSync(req.file.path).toString());
  calculations.calculatesResults();

  res.render('result', {title: 'Урок №1', 
                        fileName: req.file.originalname,
                        generalData: calculations.generateHTMLTableGeneral(),
                        inflationData: calculations.generateHTMLTableInflation(),
                        trenInfluenceData: calculations.generateHTMLTableTrendInfluece(),
                        costInfluenceData: calculations.generateHTMLTableCostInfluence(),
                        multipleRegressionData: calculations.generateHTMLTableMultipleRegression(),
                        generalChart: calculations.generateChartGeneral(),
                        inflationChart: calculations.generateChartInflation(),
                        trendInfluenceChart: calculations.generateChartTrendInfluence(),
                        costInfuenceChart: calculations.generateChartCostInfluece(),
                        multipleRegressionChart: calculations.generateChartMultipleRegression()
                        });
});

function generateDownloadedDataChart(xAxis, data) {
    var chart = 'Highcharts.chart("chart_data", {' +
                  'title: {' +
                        'text: "График продаж",' +
                        'x: -20' +
                    '},' +
                    'xAxis: {' +
                        'categories: [';
    for (var i = 0; i < xAxis.length - 1; ++i) {
      chart += '"' + xAxis[i] + '",';
    }
    chart += '"' + xAxis[xAxis.length - 1] + '"]},';
    chart +=        ' yAxis: {' + 
                        'title: {' +
                            'text: "Продажи"' +
                        '},' +
                        'plotLines: [{' +
                            'value: 0,' +
                            'width: 1,' +
                            'color: "#808080"' +
                        '}]' +
                    '},' +
                    'legend: {' +
                        'align: "center",' +
                        'verticalAlign: "bottom",' +
                        'layout: "horizontal",' +
                        'borderWidth: 0' +
                    '},' +
                    'series: [{' +
                        'name: "Фактические продажи",';
    chart += 'data: [';
    for (var i = 0; i < data.length - 1; ++i) {
      chart += data[i] + ',';
    }
    chart += data[data.length - 1] + ']}]});';
    return chart;
  }

module.exports = router;
