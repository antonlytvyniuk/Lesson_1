var smr = require('smr');
var regression = require('regression');

/**
 * Создает экземпляр Lesson_1.
 *
 * @constructor
 * @this  {Liesson_1}
 * @param {string} dataString - Даные с загруженого файла для построения прогноза.
 */
var Lesson_1 = function(dataString) {
    /** Hомер продаж @private */
    this.numberOfSales = []; 

    /** Дата продаж @private */
    this.dateOfSales = []; 

    /** Количество продаж @private */
    this.countOfSales = []; 

    /** Цена товара @private */
    this.cost = []; 

    /** Инфляция @private */
    this.inflation = []; 

    /** Скользящее среднее @private */
    this.movingAverage = [];

    /** Сезонность @private */
    this.seasonal = []; 

    /** Продажи очищеные от сезонности @private */
    this.salesWithOutSeasonal = [];

    /** Тренд @private */
    this.trend = []; 

    /** Среднее значение количества продаж @private */
    this.meanCountOfSales;

    /** Влияние тренда @private */
    this.trendInfluence = []; 

    /** Линейная регресия @private */
    this.linearRegression = [];

    /** Експоненциальная регресия @private */
    this.expRegression = [];

    /** Логарифмическая регресия @private */
    this.logRegression = [];

    /** Лучшая регресия @private */
    this.bestRegression = []; 

    /** Влияние цены @private */
    this.costInfluence = []; 

    /** Множественная регресия по тренду, средним продажам и сезонности @private */
    this.multipleRegressionTrend = [];

    /** Множественная регресия по влиянию цены, средним продажам и сезонности @private */
    this.multipleRegressionCost = [];

    /** Лучшая множественная регресия @private */
    this.bestMultipleRegression = [];

    var dataRows = dataString.split('\n');
    var data = [];
    for (var i = 1; i < dataRows.length; ++i) {
        data[i - 1] = dataRows[i].split(';');
    }
    for (var i = 0; i < data.length; ++i) {
        this.numberOfSales[i] = +data[i][0];
        this.dateOfSales[i] = +data[i][1];
        if (data[i][2] !== undefined) {
            this.countOfSales[i] = +data[i][2];
            this.cost[i] = +data[i][3];
        }
    }

    /**
     * Поиск параметров регресии и востановление ряда по регресии
     *
     * @private
     * @param {number[]} y - искомый ряд.
     * @param {number[]} x - регресор.
     * @param {string} type - тип регресии.
     * @param {boolean} dependence - прямая или обратная зависимость (true\false).
     * @return {number[]}
     */
    this.calculateRegression = function (y, x, type, dependence) {
        //поскольку переменные массивов y, x передаются по ссылке, копируем их в _y, _x
        var _x = [];
        for (var i = 0; i < x.length; ++i) {
            _x[i] = x[i];
        }
        var _y = [];
        for (var i = 0; i < y.length; ++i) {
            _y[i] = y[i];
        }
        
        var flag = true; //используется для проверки на наличие даных на год
        do {
            var data = [];
            for (var i = 0; i < Math.min(_y.length, _x.length); ++i) {
                data[i] = [ _x[i], _y[i] ];
            }

            var regr = regression(type, data);
                var a = regr.equation[0];
                var b = regr.equation[1];

            if (_y.length >= 52 && _x.length >=52) {
                _x.splice(0, 52);
                _y.splice(0, 52);
            } else {
                flag = false;
            }
        } while (!this.checkRegressionDependence(a, b, type, dependence) && flag)
        
        var result = [];
        for (var i = 0; i < x.length; ++i) {
            result[i] =  this.calculateRegressionResult(a, b, x[i], type);
        }
        return result;
    }

    /**
     * Проверка на правильность выполнение зависимости между у и х в регресии
     *
     * @private
     * @param {number} a - первый коефициент регресии.
     * @param {number} b - второй коефициент регресии.
     * @param {string} type - тип регресии.
     * @param {boolean} dependence - прямая или обратная зависимость (true\false).
     * @return {boolean}
     */
    this.checkRegressionDependence = function (a, b, type, dependence) {
        switch (type) {
            case 'linear': return (a + b < 10 * a + b) === dependence;
            case 'exponential': return (a * Math.exp(b) < a * Math.exp(10 * b) ) === dependence;
            case 'logarithmic': return (a + b * Math.log(2) < a + b * Math.log(10) ) === dependence;
            default: return false;
        }
    }

    /**
     * Подсчет результата регресии по заданым коефициентам и заданому значению регресора
     *
     * @private
     * @param {number} a - первый коефициент регресии.
     * @param {number} b - второй коефициент регресии.
     * @param {number} x - значение регресора.
     * @param {string} type - тип регресии.
     * @return {number}
     */
    this.calculateRegressionResult = function (a, b, x, type) {
         switch (type) {
            case 'linear': return a * x + b;
            case 'exponential': return a * Math.exp(b * x);
            case 'logarithmic': return a + b * Math.log(x);
            default: return 0;
        }
    }

    /**
     * Подсчет скользящего среднего
     *
     * @private
     * @param {number[]} y - исходный ряд.
     * @return {number[]}
     */
    this.calculateMoveingAverage = function (y) {
        var movingAvg = [];
	
        for (var i = 26; i < y.length - 25; ++i) {
            var sum = 0;
            for (var j = i - 25; j < i + 25; ++j) { 
                sum += y[j];
            }
            movingAvg[i] = (y[i - 26] * 0.5 + y[i + 25] * 0.5 + sum) / (52);
        }
        
        for (var i = 0; i < 26; ++i) {
            var sum = 0;
            var count = 0;
            for (var j = i + 52; j < y.length - 25; j += 52, ++count) {
                sum += movingAvg[j];
            }
            movingAvg[i] = sum / count;
        }
        
        for (var i = y.length - 1; i >= y.length - 25; --i) {
            var sum = 0;
            var count = 0;
            for (var j = i - 52; j >= 26; j -= 52, ++count) {
                sum += movingAvg[j];
            }
            movingAvg[i] = sum / count;
        }
        return movingAvg;
    }

    /**
     * Подсчет сезонности
     *
     * @private
     * @param {number[]} y - ряд по которому ищется сезонность.
     * @param {number[]} movingAvg - скольщее среднее по ряду у.
     * @return {number[]}
     */
    this.calculateSeasonal = function (y, movingAvg) {
        var subtraction = [];
        var season = []
        for (var i = 0; i < movingAvg.length; ++i) {
            subtraction[i] = y[i] - movingAvg[i];
        }
        
        for (var i = 0; i < 52; ++i) {
            var sum = 0;
            var count = 0;
            for (var j = i; j < subtraction.length; j += 52, ++count) {
                sum += subtraction[j];
            }
            season[i] = sum / count;
        }

        if (Math.abs(season[season.length - 1]) > 2 * Math.abs(season[0]) &&
            Math.abs(season[1]) > 2 * Math.abs(season[0])) {
            season[0] = 0.5 * (season[0] + 0.5 * season[i - 1] + 0.5 * season[1]);
        }
        for (var i = 1; i < season.length - 1; ++i) {
            if (Math.abs(season[i - 1]) > 2 * Math.abs(season[i]) &&
                Math.abs(season[i + 1]) > 2 * Math.abs(season[i])) {
                season[i] = 0.5 * (season[i] + 0.5 * season[i - 1] + 0.5 * season[i + 1]);
            }
        }
        if (Math.abs(season[season.length - 2]) > 2 * Math.abs(season[season.length - 1]) &&
            Math.abs(season[0]) > 2 * Math.abs(season[season.length - 1])) {
            season[season.length - 1] = 0.5 * (season[season.length - 1] + 0.5 * season[season.length - 2] + 0.5 * season[0]);
        }

        return season;
    }

    /**
     * Очистка ряда от сезонности
     *
     * @private
     * @param {number[]} y - ряд по которому ищется сезонность.
     * @param {number[]} season - сезонность по ряду у.
     * @return {number[]}
     */
    this.cleanOutSeasonal = function (y, season) {
        var cleanY = [];
        
        for (var i = 0, j = 0; i < y.length; ++i) {
            cleanY[i] = (y[i] - season[j] >= 0) ? y[i] - season[j] : 0;
            j = (j < season.length - 1) ? j + 1 : 0;
        }
        
        return cleanY;
    }

    /**
     * Поиск среднеквадратической ошибки
     *
     * @private
     * @param {number[]} y - исходный ряд.
     * @param {number[]} x - ряд, ошибку которого ищем.
     * @return {number}
     */
    this.calculateRMSE = function (y, x) {
        var squareError = 0;
	
        for (var i = 0; i < Math.min(y.length, x.length); ++i) {
            squareError += Math.pow(y[i] - x[i], 2);
        }
        
        return Math.sqrt(squareError / Math.min(y.length, x.length));
    }

    /**
     * Поиск параметров регресии и востановление ряда по регресии
     *
     * @private
     * @param {number[]} y - искомый ряд.
     * @param {number[][]} x - масив значений регресоров.
     * @param {boolean[]} dependences - масив описывающий зависимости к каждому из х (true \ false).
     * @return {number[]}
     */
    this.calculateMultipleRegression = function (y, x, dependences) {
         //поскольку переменные массивов y, x передаются по ссылке, копируем их в _y, _x
        var _x = [];
        for (var i = 0; i < x.length; ++i) {
            _x[i] = [];
            for (var j = 0; j < x[i].length; ++j) {
                _x[i][j] = x[i][j];
            }
        }
        var _y = [];
        for (var i = 0; i < y.length; ++i) {
            _y[i] = y[i];
        }
        var flag = true; //используется для проверки на наличие даных на год
        do {
            var regres = new smr.Regression( { numX: 3, numY: 1} );
            
            for (var i = 0; i < Math.min(_y.length, _x.length); ++i) {
                regres.push( { x: _x[i], y: [ _y[i] ]} );
            }

            var coef = regres.calculateCoefficients();

            if (_y.length >= 52 && _x.length >=52) {
                _x.splice(0, 52);
                _y.splice(0, 52);
            } 
            else {
                flag = false;
            }
            
        } while (this.checkMulptipleRegressionDependences(coef, dependences) === false && (flag))
        
        var result = [];
        
        for (var i = 0; i < x.length; ++i) {
            result[i] = 0;
            for (var j = 0; j < x[i].length; ++j) {
                result[i] += +coef[j] * x[i][j];
            }
        }
        
        return result;
    }

    /**
     * Проверка на правильность выполнение зависимости между у и каждым с х в регресии
     *
     * @private
     * @param {number[]} coeficients - коефициенты регресии.
     * @param {boolean[]} dependences - масив описывающий зависимости к каждому из х (true \ false).
     * @return {boolean}
     */
    this.checkMulptipleRegressionDependences = function (coeficients, dependences) {
        for (var i = 0; i < dependences.length; ++i) {
            var sum = 0;
            for (var j = 0; j < coeficients.length; ++j) {
                sum += +coeficients[j];
            }
            if ( (sum < (sum + 9 * coeficients[i])) !== dependences[i]) {
                return false;
            }
        }
        return true;
    }

    /**
     * Заполняет свойства такие как: инфляция, скользящее среднее, сезонность, продажи очищенные от сезонности
     * тренд, влияние тренда, среднее значение продаж, все регресии, выбирает лучшие регресии, вличние цены...
     *
     * @public
     */
    this.calculatesResults = function() {
        //calculate inflation
        this.inflation =  this.calculateRegression(this.cost, this.numberOfSales, 'linear', true);

        //calculate seasonal, sales without seasonal, trend, mean sales and trend influence
        this.movingAverage = this.calculateMoveingAverage(this.countOfSales);
        this.seasonal = this.calculateSeasonal(this.countOfSales, this.movingAverage);
        this.salesWithOutSeasonal = this.cleanOutSeasonal(this.countOfSales, this.seasonal);
        this.trend = this.calculateRegression(this.salesWithOutSeasonal, this.numberOfSales, 'linear', true);

        this.meanCountOfSales = 0;
        for (var i = 0; i < this.countOfSales.length; ++i) {
            this.meanCountOfSales += this.countOfSales[i];
        }
        this.meanCountOfSales /= this.countOfSales.length;
        
        for (var i = 0; i < this.trend.length; ++i) {
            this.trendInfluence[i] = this.trend[i] - this.meanCountOfSales;
        }

        //calculate regressions, choose the best of them and calculate cost influence
        this.linearRegression = this.calculateRegression(this.countOfSales, this.cost, 'linear', false);
        this.expRegression = this.calculateRegression(this.countOfSales, this.cost, 'exponential', false);
        this.logRegression = this.calculateRegression(this.countOfSales, this.cost, 'logarithmic', false);
        
        var linearRMSE = this.calculateRMSE(this.countOfSales, this.linearRegression);
        var expRMSE = this.calculateRMSE(this.countOfSales, this.expRegression);
        var logRMSE = this.calculateRMSE(this.countOfSales, this.logRegression);

        if (linearRMSE < Math.min(expRMSE, logRMSE)) {
            this.bestRegression = this.linearRegression;
        } else if (expRMSE < logRMSE) {
            this.bestRegression = this.expRegression;
        } else {
            this.bestRegression = this.logRegression;
        }

        for (var i = 0; i < this.bestRegression.length; ++i) {
            this.costInfluence[i] = this.bestRegression[i] - this.meanCountOfSales;
        }

        //prepare data to multiple regressions, calculate maultiple regressions and choose the best of them

        var regressionData = [];
        //trend, mean count of sales and seasonal multiple regression
        for (var i = 0, j = 0; i < this.trend.length; ++i) {
            regressionData[i] = [ this.trend[i], this.meanCountOfSales, this.seasonal[j]]
            j = (j < this.seasonal.length - 1) ? j + 1 : 0;
        }

        this.multipleRegressionTrend = this.calculateMultipleRegression(this.countOfSales, regressionData, 
                                                                            [true, true, true]);
        //cost influence, mean count of sales and seasonal multiple regression
        regressionData = [];
        for (var i = 0, j = 0; i < this.costInfluence.length; ++i) {
            regressionData[i] = [ this.costInfluence[i], this.meanCountOfSales, this.seasonal[j]]
            j = (j < this.seasonal.length - 1) ? j + 1 : 0;
        }

        this.multipleRegressionCost = this.calculateMultipleRegression(this.countOfSales, regressionData, 
                                                                            [true, true, true]);
        //choose the best multiple regression
        var trendRMSE = this.calculateRMSE(this.countOfSales, this.multipleRegressionTrend);
        var costRMSE = this.calculateRMSE(this.countOfSales, this.multipleRegressionCost);

        this.bestMultipleRegression = (trendRMSE < costRMSE) ? this.multipleRegressionTrend : this.multipleRegressionCost;
        
    }

    /**
     * Генерирует HTML код для отображения даных в виде таблицы (numberOfSales, dateOfSales, countOfSales, cost,
     * trendInfluence, costInfluence, bestMultipleRegression)
     * @return {string}
     * @public
     */
    this.generateHTMLTableGeneral = function() {
        var html = '<tr>' + 
                        '<th align="center">№</th>' + 
                        '<th align="center">Неделя (ISO)</th>' +
                        '<th align="center">Продажи (шт.)</th>' +
                        '<th align="center">Средняя цена</th>' +
                        '<th align="center">Влияние тренда</th>' +
                        '<th align="center">Влияние цены</th>' +
                        '<th align="center" width="20%">Множественная регресия (' + 
            ( (this.bestMultipleRegression === this.multipleRegressionTrend) ? 'тренд': 'влияние цены' ) +
            ', среднее значение продаж, сезонность)</th>' + 
                    '</tr>';
        for (var i = 0; i < this.numberOfSales.length; ++i) {
            html += '<tr>';
            html += '<td align="center">' + (this.numberOfSales[i]) + '</td>';
            html += '<td align="center">' + (this.dateOfSales[i]) + '</td>';
            html += '<td align="center">' + ( (this.countOfSales[i] !== undefined) ? this.countOfSales[i] : ' ') + '</td>';
            html += '<td align="center">' + ( (this.cost[i] !== undefined) ? this.cost[i] : ' ') + '</td>';
            html += '<td align="center">' + ( (this.trendInfluence[i] !== undefined) ? 
                    (Math.round(this.trendInfluence[i] * 100) / 100) : ' ') + '</td>';
            html += '<td align="center">' + ( (this.costInfluence[i] !== undefined) ? 
                    (Math.round(this.costInfluence[i] * 100) / 100) : ' ') + '</td>';
            html += '<td align="center">' + ( (this.bestMultipleRegression[i] !== undefined) ? 
                    (Math.round(this.bestMultipleRegression[i] * 100) / 100) : ' ') + '</td>';
            html += '</tr>'
        }
        return html;
    }

    /**
     * Генерирует HTML код для отображения даных в виде таблицы (numberOfSales, dateOfSales, cost,
     * inflation)
     * @return {string}
     * @public
     */
    this.generateHTMLTableInflation = function() {
        var html = '<tr>' + 
                        '<th align="center">№</th>' + 
                        '<th align="center">Неделя (ISO)</th>' +
                        '<th align="center">Средняя цена</th>' +
                        '<th align="center">Инфляция</th>' +
                    '</tr>';

        for (var i = 0; i < this.numberOfSales.length; ++i) {
            html += '<tr>';
            html += '<td align="center">' + (this.numberOfSales[i]) + '</td>';
            html += '<td align="center">' + (this.dateOfSales[i]) + '</td>';
            html += '<td align="center">' + ( (this.cost[i] !== undefined) ? this.cost[i] : ' ') + '</td>';
            html += '<td align="center">' + ( (this.inflation[i] !== undefined) ? 
                    (Math.round(this.inflation[i] * 100) / 100) : ' ') + '</td>';
            html += '</tr>'
        }
        return html;
    }

    /**
     * Генерирует HTML код для отображения даных в виде таблицы (numberOfSales, dateOfSales, countOfSales, movingAverage,
     * seasonal, salesWithOutSeasonal, trend, meanCountOfSales, trendInfluence)
     * @return {string}
     * @public
     */
    this.generateHTMLTableTrendInfluece = function() {
        var html = '<tr>' + 
                        '<th align="center">№</th>' + 
                        '<th align="center">Неделя (ISO)</th>' +
                        '<th align="center">Продажи (шт.)</th>' +
                        '<th align="center">Скользящее среднее</th>' +
                        '<th align="center">Сезонность</th>' +
                        '<th align="center">Продажи очищенные от сезонности</th>' +
                        '<th align="center">Тренд</th>' + 
                        '<th align="center">Среднее значение количества продаж</th>' +
                        '<th align="center">Влияние тренда</th>' + 
                    '</tr>';

        for (var i = 0; i < this.numberOfSales.length; ++i) {
            html += '<tr>';
            html += '<td align="center">' + (this.numberOfSales[i]) + '</td>';
            html += '<td align="center">' + (this.dateOfSales[i]) + '</td>';
            html += '<td align="center">' + ( (this.countOfSales[i] !== undefined) ? this.countOfSales[i] : ' ') + '</td>';
            html += '<td align="center">' + ( (this.movingAverage[i] !== undefined) ? 
                    (Math.round(this.movingAverage[i] * 100) / 100) : ' ') + '</td>';
            html += '<td align="center">' + ( (this.seasonal[i] !== undefined) ? 
                    (Math.round(this.seasonal[i] * 100) / 100) : ' ') + '</td>';
            html += '<td align="center">' + ( (this.salesWithOutSeasonal[i] !== undefined) ? 
                    (Math.round(this.salesWithOutSeasonal[i] * 100) / 100) : ' ') + '</td>';
            html += '<td align="center">' + ( (this.trend[i] !== undefined) ? 
                    (Math.round(this.trend[i] * 100) / 100) : ' ') + '</td>';
            html += '<td align="center">' + ( (i === 0) ? 
                    (Math.round(this.meanCountOfSales * 100) / 100) : ' ') + '</td>';
            html += '<td align="center">' + ( (this.trendInfluence[i] !== undefined) ? 
                    (Math.round(this.trendInfluence[i] * 100) / 100) : ' ') + '</td>';
            html += '</tr>'
        }
        return html;
    }

    /**
     * Генерирует HTML код для отображения даных в виде таблицы (numberOfSales, dateOfSales, countOfSales, cost,
     * bestRegression)
     * @return {string}
     * @public
     */
    this.generateHTMLTableCostInfluence = function() {
        var html = '<tr>' + 
                        '<th align="center">№</th>' + 
                        '<th align="center">Неделя (ISO)</th>' +
                        '<th align="center">Продажи (шт.)</th>' +
                        '<th align="center">Средняя цена</th>' +
                        '<th align="center">Лучшая регресия (' +
        ((this.bestRegression === this.linearRegression) ? 'линейная' : 
        (this.bestRegression === this.expRegression) ? 'експоненциальная' : 'логарифмическая' ) +
                        ')</th>' +
                        '<th align="center">Среднее значение количества продаж</th>' +
                        '<th align="center">Влияние цены</th>' + 
                    '</tr>';

        for (var i = 0; i < this.numberOfSales.length; ++i) {
            html += '<tr>';
            html += '<td align="center">' + (this.numberOfSales[i]) + '</td>';
            html += '<td align="center">' + (this.dateOfSales[i]) + '</td>';
            html += '<td align="center">' + ( (this.countOfSales[i] !== undefined) ? this.countOfSales[i] : ' ') + '</td>';
            html += '<td align="center">' + ( (this.cost[i] !== undefined) ? this.cost[i] : ' ') + '</td>';
            html += '<td align="center">' + ( (this.bestRegression[i] !== undefined) ? 
                    (Math.round(this.bestRegression[i] * 100) / 100) : ' ') + '</td>';
            html += '<td align="center">' + ( (i === 0) ? 
                    (Math.round(this.meanCountOfSales * 100) / 100) : ' ') + '</td>';
            html += '<td align="center">' + ( (this.costInfluence[i] !== undefined) ? 
                    (Math.round(this.costInfluence[i] * 100) / 100) : ' ') + '</td>';
            html += '</tr>'
        }
        return html;
    }

    /**
     * Генерирует HTML код для отображения даных в виде таблицы (numberOfSales, dateOfSales, countOfSales, 
     * multipleRegressionTrend, multipleRegressionCost)
     * @return {string}
     * @public
     */
    this.generateHTMLTableMultipleRegression = function() {
        var html = '<tr>' + 
                        '<th align="center">№</th>' + 
                        '<th align="center">Неделя (ISO)</th>' +
                        '<th align="center">Продажи (шт.)</th>' +
                        '<th align="center">Множественная регресия (тренд, среднее значение продаж, сезонность)</th>' +
                        '<th align="center">Множественная регресия (влияние цены, среднее значение продаж, сезонность)</th>' + 
                    '</tr>';

        for (var i = 0; i < this.numberOfSales.length; ++i) {
            html += '<tr>';
            html += '<td align="center">' + (this.numberOfSales[i]) + '</td>';
            html += '<td align="center">' + (this.dateOfSales[i]) + '</td>';
            html += '<td align="center">' + ( (this.countOfSales[i] !== undefined) ? this.countOfSales[i] : ' ') + '</td>';
            html += '<td align="center">' + ( (this.multipleRegressionTrend[i] !== undefined) ? 
                    (Math.round(this.multipleRegressionTrend[i] * 100) / 100) : ' ') + '</td>';
            html += '<td align="center">' + ( (this.multipleRegressionCost[i] !== undefined) ? 
                    (Math.round(this.multipleRegressionCost[i] * 100) / 100) : ' ') + '</td>';
            html += '</tr>'
        }
        return html;
    }

    /**
     * Генерирует Highcharts код для отображения даных в виде графика (countOfSales, bestMultipleRegression)
     * @return {string}
     * @public
     */
    this.generateChartGeneral = function () {
        var chart = 'Highcharts.chart("chart_data", {' +
                    'title: {' +
                            'text: "График продаж",' +
                            'x: -20' +
                        '},' +
                        'xAxis: {' +
                            'categories: [';
        for (var i = 0; i < this.dateOfSales.length - 1; ++i) {
        chart += '"' + this.dateOfSales[i] + '",';
        }
        chart += '"' + this.dateOfSales[this.dateOfSales.length - 1] + '"]},';
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
                            'name: "Фактические продажи", ';
        chart += 'data: [';
        for (var i = 0; i < this.countOfSales.length - 1; ++i) {
            chart += this.countOfSales[i] + ',';
        }
        chart += this.countOfSales[this.countOfSales.length - 1] + ']}, {';

        chart += 'name: "Множественная регресия (' + 
            ( (this.bestMultipleRegression === this.multipleRegressionTrend) ? 'тренд': 'влияние цены' ) +
            ', среднее значение продаж, сезонность)", ';
        chart += 'data: [';
        for (var i = 0; i < this.bestMultipleRegression.length - 1; ++i) {
            chart += this.bestMultipleRegression[i] + ',';
        }
        chart += this.bestMultipleRegression[this.countOfSales.length - 1] + ']}';

        chart += ']});';
        return chart;
    }

    /**
     * Генерирует Highcharts код для отображения даных в виде графика (cost, inflation)
     * @return {string}
     * @public
     */
    this.generateChartInflation = function () {
        var chart = 'Highcharts.chart("chart_inflation", {' +
                    'title: {' +
                            'text: "График инфляции",' +
                            'x: -20' +
                        '},' +
                        'xAxis: {' +
                            'categories: [';
        for (var i = 0; i < this.dateOfSales.length - 1; ++i) {
        chart += '"' + this.dateOfSales[i] + '",';
        }
        chart += '"' + this.dateOfSales[this.dateOfSales.length - 1] + '"]},';
        chart +=        ' yAxis: {' + 
                            'title: {' +
                                'text: "Цена"' +
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
                            'name: "Средняя цена", ';
        chart += 'data: [';
        for (var i = 0; i < this.cost.length - 1; ++i) {
            chart += this.cost[i] + ', ';
        }
        chart += this.cost[this.cost.length - 1] + ']}, {';

        chart += 'name: "Инфляция", ';
        chart += 'data: [';
        for (var i = 0; i < this.inflation.length - 1; ++i) {
            chart += this.inflation[i] + ', ';
        }
        chart += this.inflation[this.inflation.length - 1] + ']}';

        chart += ']});';
        return chart;
    }

    /**
     * Генерирует Highcharts код для отображения даных в виде графика (countOfSales, trend, salesWithOutSeasonal, seasonal)
     * @return {string}
     * @public
     */
    this.generateChartTrendInfluence = function () {
        var chart = 'Highcharts.chart("chart_trendInfluence", {' +
                    'title: {' +
                            'text: "График тренда",' +
                            'x: -20' +
                        '},' +
                        'xAxis: {' +
                            'categories: [';
        for (var i = 0; i < this.dateOfSales.length - 1; ++i) {
        chart += '"' + this.dateOfSales[i] + '",';
        }
        chart += '"' + this.dateOfSales[this.dateOfSales.length - 1] + '"]},';
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
                            'name: "Фактические продажи", ';
        chart += 'data: [';
        for (var i = 0; i < this.countOfSales.length - 1; ++i) {
            chart += this.countOfSales[i] + ', ';
        }
        chart += this.countOfSales[this.countOfSales.length - 1] + ']}, {';

        chart += 'name: "Тренд", ';
        chart += 'data: [';
        for (var i = 0; i < this.trend.length - 1; ++i) {
            chart += this.trend[i] + ', ';
        }
        chart += this.trend[this.trend.length - 1] + ']}, {';

        chart += 'name: "Продажи очищенные от сезонности", ';
        chart += 'data: [';
        for (var i = 0; i < this.salesWithOutSeasonal.length - 1; ++i) {
            chart += this.salesWithOutSeasonal[i] + ', ';
        }
        chart += this.salesWithOutSeasonal[this.salesWithOutSeasonal.length - 1] + ']}, {';

        chart += 'name: "Сезонность", ';
        chart += 'data: [';
        for (var i = 0; i < this.seasonal.length - 1; ++i) {
            chart += this.seasonal[i] + ', ';
        }
        chart += this.seasonal[this.seasonal.length - 1] + ']}';

        chart += ']});';
        return chart;
    }

    /**
     * Генерирует Highcharts код для отображения даных в виде графика зависимости продаж от цены
     * @return {string}
     * @public
     */
    this.generateChartCostInfluece = function () {
        //сортировка по цене
        var _x = [], _y = [];
        for (var i = 0; i < this.cost.length; ++i) {
            _x[i] = this.cost[i];
        }
        for(var i = 0; i < _x.length; ++i) {
            var min = _x[i];
            var minInd = i;
            for (var j = i + 1; j < _x.length; ++j) {
                if (min > _x[j]) {
                    minInd = j;
                    min = _x[j];
                }
            }
            var tmp = _x[i];
            _x[i] = _x[minInd];
            _x[minInd] = tmp;
            _y[i] = this.bestRegression[minInd];
        }

        var chart = 'Highcharts.chart("chart_costInfluence", {' +
                    'title: {' +
                            'text: "График влияния цены",' +
                            'x: -20' +
                        '},' +
                        'xAxis: {' +
                            'categories: [';
        for (var i = 0; i < _x.length - 1; ++i) {
        chart += '"' + _x[i] + '",';
        }
        chart += '"' + _x[_x.length - 1] + '"]},';
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
                            'name: "Продажи", ';
        chart += 'data: [';
        for (var i = 0; i < _y.length - 1; ++i) {
            chart += _y[i] + ', ';
        }
        chart += _y[_y.length - 1] + ']}';

        chart += ']});';
        return chart;
    }

    /**
     * Генерирует Highcharts код для отображения даных в виде графика (countOfSales, multipleRegressionCost,
     * multipleRegressionTrend)
     * @return {string}
     * @public
     */
    this.generateChartMultipleRegression = function () {
        var chart = 'Highcharts.chart("chart_regression", {' +
                    'title: {' +
                            'text: "Можественная регресия",' +
                            'x: -20' +
                        '},' +
                        'xAxis: {' +
                            'categories: [';
        for (var i = 0; i < this.dateOfSales.length - 1; ++i) {
        chart += '"' + this.dateOfSales[i] + '",';
        }
        chart += '"' + this.dateOfSales[this.dateOfSales.length - 1] + '"]},';
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
                            'name: "Фактические продажи", ';
        chart += 'data: [';
        for (var i = 0; i < this.countOfSales.length - 1; ++i) {
            chart += this.countOfSales[i] + ', ';
        }
        chart += this.countOfSales[this.countOfSales.length - 1] + ']}, {';

        chart += 'name: "Множественная регресия (тренд, среднее количество продаж, сезонность)", ';
        chart += 'data: [';
        for (var i = 0; i < this.multipleRegressionTrend.length - 1; ++i) {
            chart += this.multipleRegressionTrend[i] + ', ';
        }
        chart += this.multipleRegressionTrend[this.multipleRegressionTrend.length - 1] + ']}, {';

        chart += 'name: "Множественная регресия (влияние цены, среднее количество продаж, сезонность)", ';
        chart += 'data: [';
        for (var i = 0; i < this.multipleRegressionCost.length - 1; ++i) {
            chart += this.multipleRegressionCost[i] + ', ';
        }
        chart += this.multipleRegressionCost[this.multipleRegressionCost.length - 1] + ']}';

        chart += ']});';
        return chart;
    }
};


module.exports = Lesson_1;