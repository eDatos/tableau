(function () {
    var myConnector = tableau.makeConnector();
    var urlIndicator;
    const CONNECTION_TABLE_NUMBER = 1;
    var number = 2;

    var measuresIds = {
        "ABSOLUTE": "",
        "ANNUAL_PERCENTAGE_RATE": "_Tasa_variacion_anual",
        "INTERPERIOD_PERCENTAGE_RATE": "_Tasa_variacion_interperiodica",
        "ANNUAL_PUNTUAL_RATE": "_Variacion_anual",
        "INTERPERIOD_PUNTUAL_RATE": "_Variacion_interperiodica"
    }

    myConnector.getSchema = function (schemaCallback) {
        var urlObj = JSON.parse(tableau.connectionData);
        var tables = [];

        var columnsTime = ['Codigo_temporal', 'Granularidad_temporal', 'Etiqueta_temporal', 'Fecha'];
        var columnsGeographic = ['Codigo_geografico', 'Granularidad_geografica', 'Etiqueta_geografica'];

        if (urlObj.starModel) {
            var cols = [];

            cols.push({ id: "Codigo_geografico", columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
            cols.push({ id: "Codigo_temporal", columnRole: "dimension", dataType: tableau.dataTypeEnum.string });

            if (urlObj.showMeasureColumns) {
                for (i = 0; i < urlObj.measureColumns.length; i++) {
                    cols.push({ id: _capitalize(urlObj.observationId) + urlObj.measureColumns[i], dataType: tableau.dataTypeEnum.float });
                }
            } else {
                cols.push({ id: "Codigo_medida", columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
                cols.push({ id: urlObj.observationId, alias: urlObj.name, dataType: tableau.dataTypeEnum.float });

                var measureColumns = [];

                measureColumns.push({ id: "Codigo_medida", columnRole: "dimension", dataType: tableau.dataTypeEnum.string });

                var tableMeasure = {
                    id: "measure",
                    alias: addNumber(number) + "Medida",
                    columns: measureColumns
                }
                number++;
                tables.push(tableMeasure);
            }

            var tableGeographic = {
                id: "geographic",
                alias: addNumber(number) + "Geográfica",
                columns: _buildCols(urlObj, columnsGeographic, urlObj.geographicalLanguages)
            };
            number++;
            tables.push(tableGeographic);

            var tableTime = {
                id: "time",
                alias: addNumber(number) + "Temporal",
                columns: _buildCols(urlObj, columnsTime, urlObj.timeLanguages)
            };
            number++;
            tables.push(tableTime);

            var tableInfo = {
                id: "indicatorData",
                alias: addNumber(CONNECTION_TABLE_NUMBER) + tableau.connectionName,
                columns: cols
            };
            tables.push(tableInfo);
        } else {
            var geographicCols = _buildCols(urlObj, columnsGeographic, urlObj.geographicalLanguages);
            var timeCols = _buildCols(urlObj, columnsTime, urlObj.timeLanguages);
            var mainCols = geographicCols;

            timeCols.forEach(function (column) {
                mainCols.push(column);
            });
            if (urlObj.showMeasureColumns) {
                for (i = 0; i < urlObj.measureColumns.length; i++) {
                    mainCols.push({ id: _capitalize(urlObj.observationId) + urlObj.measureColumns[i], dataType: tableau.dataTypeEnum.float });
                }
            } else {
                mainCols.push({ id: "Codigo_medida", columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
                mainCols.push({ id: urlObj.observationId, alias: urlObj.name, dataType: tableau.dataTypeEnum.float });
            }

            tables.push({
                id: "indicatorData",
                alias: addNumber(CONNECTION_TABLE_NUMBER) + tableau.connectionName,
                columns: mainCols
            });
        }
        schemaCallback(tables);
    };

    myConnector.getData = function (table, doneCallback) {
        var urlObj = JSON.parse(tableau.connectionData);
        var promises = [];
        var isMainTable = table.tableInfo.id == "indicatorData";

        if (!isMainTable || (!urlObj.starModel && (urlObj.granularity || urlObj.labels || urlObj.recodeDates))) {
            promises.push($.getJSON(urlObj.url.substring(0, urlObj.url.indexOf('/data'))));
        }

        if (isMainTable) {
            promises.push($.getJSON(urlObj.url));
        }


        $.when.apply($, promises).then(function () {


            if (isMainTable && urlObj.starModel) {
                var dataResponse = arguments[0];
                var geographicalDimensions = _.invert(dataResponse.dimension.GEOGRAPHICAL.representation.index);
                var measureDimensions = _.invert(dataResponse.dimension.MEASURE.representation.index);
                var timeDimensions = _.invert(dataResponse.dimension.TIME.representation.index);
            } else if (isMainTable) {
                var indexArguments = 0;
                if (urlObj.granularity || urlObj.labels || urlObj.recodeDates) {
                    var dimensions = arguments[indexArguments][0].dimension;
                    var indexedGeographicalRepresentations = _.keyBy(dimensions.GEOGRAPHICAL.representation, 'code');
                    var indexedTimeRepresentations = _.keyBy(dimensions.TIME.representation, 'code');
                    indexArguments++;
                }

                if (indexArguments != 0) {
                    dataResponse = arguments[indexArguments][0];
                } else {
                    dataResponse = arguments[0];
                }
                var geographicalDimensions = _.invert(dataResponse.dimension.GEOGRAPHICAL.representation.index);
                var measureDimensions = _.invert(dataResponse.dimension.MEASURE.representation.index);
                var timeDimensions = _.invert(dataResponse.dimension.TIME.representation.index);

            } else {
                var dimensions = arguments[0].dimension;
            }
            var tableData = [];
            if (isMainTable && urlObj.starModel) {
                for (var i = 0, lengthGeographical = dataResponse.dimension.GEOGRAPHICAL.representation.size; i < lengthGeographical; i++) {
                    for (var j = 0, lengthTime = dataResponse.dimension.TIME.representation.size; j < lengthTime; j++) {
                        if (urlObj.showMeasureColumns) {
                            var hash = {};
                            hash.Codigo_geografico = geographicalDimensions[i];
                            hash.Codigo_temporal = timeDimensions[j];
                            for (var k = 0, lengthMeasure = dataResponse.dimension.MEASURE.representation.size; k < lengthMeasure; k++) {
                                hash[_capitalize(urlObj.observationId) + measuresIds[measureDimensions[k]]] = dataResponse.observation[i * lengthTime * lengthMeasure + j * lengthMeasure + k];
                            }
                            tableData.push(hash);
                        } else {
                            for (var k = 0, lengthMeasure = dataResponse.dimension.MEASURE.representation.size; k < lengthMeasure; k++) {
                                var hash = {};
                                hash.Codigo_geografico = geographicalDimensions[i];
                                hash.Codigo_temporal = timeDimensions[j];
                                hash.Codigo_medida = measureDimensions[k];
                                hash[urlObj.observationId] = dataResponse.observation[i * lengthTime * lengthMeasure + j * lengthMeasure + k];
                                tableData.push(hash);
                            }
                        }
                    }
                }
            } else if (table.tableInfo.id == "geographic") {
                for (var i = 0, lengthGeographical = dimensions.GEOGRAPHICAL.representation.length; i < lengthGeographical; i++) {
                    var hash = {};
                    hash.Codigo_geografico = dimensions.GEOGRAPHICAL.representation[i].code;

                    if (urlObj.granularity) {
                        hash.Granularidad_geografica = dimensions.GEOGRAPHICAL.representation[i].granularityCode;
                    }

                    if (urlObj.labels) {
                        if (!urlObj.allLanguages) {
                            hash.Etiqueta_geografica = dimensions.GEOGRAPHICAL.representation[i].title.__default__;
                        } else {
                            for (l = 0; l < urlObj.geographicalLanguages.length; l++) {
                                hash['Etiqueta_geografica_' + urlObj.geographicalLanguages[l]] = dimensions.GEOGRAPHICAL.representation[i].title[urlObj.geographicalLanguages[l]];
                            }
                        }
                    }
                    tableData.push(hash);
                }
            } else if (table.tableInfo.id == "time") {
                for (var j = 0, lengthTime = dimensions.TIME.representation.length; j < lengthTime; j++) {
                    var hash = {};

                    if (urlObj.recodeDates) {
                        var granularity = dimensions.TIME.representation[j].granularityCode;
                        var date = dimensions.TIME.representation[j].code;
                        hash.Fecha = recodeDates(date, granularity);
                    }

                    hash.Codigo_temporal = dimensions.TIME.representation[j].code;

                    if (urlObj.granularity) {
                        hash.Granularidad_temporal = dimensions.TIME.representation[j].granularityCode;
                    }

                    if (urlObj.labels) {
                        if (!urlObj.allLanguages) {
                            hash.Etiqueta_temporal = dimensions.TIME.representation[j].title.__default__;
                        } else {
                            for (l = 0; l < urlObj.timeLanguages.length; l++) {
                                hash['Etiqueta_temporal_' + urlObj.timeLanguages[l]] = dimensions.TIME.representation[j].title[urlObj.timeLanguages[l]];
                            }
                        }
                    }
                    tableData.push(hash);
                }
            } else if (table.tableInfo.id == "measure") {
                for (var j = 0, lengthTime = dimensions.MEASURE.representation.length; j < lengthTime; j++) {
                    var hash = {};
                    hash.Codigo_medida = dimensions.MEASURE.representation[j].code;
                    tableData.push(hash);
                }
            } else {
                for (var i = 0, lengthGeographical = dataResponse.dimension.GEOGRAPHICAL.representation.size; i < lengthGeographical; i++) {
                    for (var j = 0, lengthTime = dataResponse.dimension.TIME.representation.size; j < lengthTime; j++) {
                        if (urlObj.showMeasureColumns) {
                            var hash = {};
                            hash.Codigo_geografico = geographicalDimensions[i];

                            if (urlObj.recodeDates) {
                                var granularity = indexedTimeRepresentations[timeDimensions[j]].granularityCode;
                                var date = timeDimensions[j];
                                hash.Fecha = recodeDates(date, granularity);
                            }
                            hash.Codigo_temporal = timeDimensions[j];

                            for (var k = 0, lengthMeasure = dataResponse.dimension.MEASURE.representation.size; k < lengthMeasure; k++) {
                                hash[_capitalize(urlObj.observationId) + measuresIds[measureDimensions[k]]] = dataResponse.observation[i * lengthTime * lengthMeasure + j * lengthMeasure + k];
                            }

                            if (urlObj.granularity) {
                                hash.Granularidad_geografica = indexedGeographicalRepresentations[hash.Codigo_geografico].granularityCode;
                                hash.Granularidad_temporal = indexedTimeRepresentations[timeDimensions[j]].granularityCode;
                            }

                            if (urlObj.labels) {
                                if (!urlObj.allLanguages) {
                                    hash.Etiqueta_geografica = indexedGeographicalRepresentations[hash.Codigo_geografico].title.__default__;
                                    hash.Etiqueta_temporal = indexedTimeRepresentations[timeDimensions[j]].title.__default__;
                                } else {
                                    for (l = 0; l < urlObj.geographicalLanguages.length; l++) {
                                        hash['Etiqueta_geografica_' + urlObj.geographicalLanguages[l]] = indexedGeographicalRepresentations[hash.Codigo_geografico].title[urlObj.geographicalLanguages[l]];
                                    }
                                    for (l = 0; l < urlObj.timeLanguages.length; l++) {
                                        hash['Etiqueta_temporal_' + urlObj.timeLanguages[l]] = indexedTimeRepresentations[timeDimensions[j]].title[urlObj.timeLanguages[l]];
                                    }
                                }
                            }
                            tableData.push(hash);

                        } else {
                            for (var k = 0, lengthMeasure = dataResponse.dimension.MEASURE.representation.size; k < lengthMeasure; k++) {
                                var hash = {};
                                hash.Codigo_geografico = geographicalDimensions[i];

                                if (urlObj.recodeDates) {
                                    var granularity = indexedTimeRepresentations[timeDimensions[j]].granularityCode;
                                    var date = timeDimensions[j];
                                    hash.Fecha = recodeDates(date, granularity);
                                }
                                hash.Codigo_temporal = timeDimensions[j];

                                hash.Codigo_medida = measureDimensions[k];
                                hash[urlObj.observationId] = dataResponse.observation[i * lengthTime * lengthMeasure + j * lengthMeasure + k];

                                if (urlObj.granularity) {
                                    hash.Granularidad_geografica = indexedGeographicalRepresentations[hash.Codigo_geografico].granularityCode;
                                    hash.Granularidad_temporal = indexedTimeRepresentations[timeDimensions[j]].granularityCode;
                                }

                                if (urlObj.labels) {
                                    if (!urlObj.allLanguages) {
                                        hash.Etiqueta_geografica = indexedGeographicalRepresentations[hash.Codigo_geografico].title.__default__;
                                        hash.Etiqueta_temporal = indexedTimeRepresentations[timeDimensions[j]].title.__default__;
                                    } else {
                                        for (l = 0; l < urlObj.geographicalLanguages.length; l++) {
                                            hash['Etiqueta_geografica_' + urlObj.geographicalLanguages[l]] = indexedGeographicalRepresentations[hash.Codigo_geografico].title[urlObj.geographicalLanguages[l]];
                                        }
                                        for (l = 0; l < urlObj.timeLanguages.length; l++) {
                                            hash['Etiqueta_temporal_' + urlObj.timeLanguages[l]] = indexedTimeRepresentations[timeDimensions[j]].title[urlObj.timeLanguages[l]];
                                        }
                                    }
                                }
                                tableData.push(hash);
                            }
                        }
                    }
                }
            }

            table.appendRows(tableData);
            doneCallback();
        }, function () {
            doneCallback();
        })
    };

    function recodeDates(date, granularity) {
        switch (granularity) {
            case "YEARLY": {
                if (date.match(new RegExp(START + GPE_YEARLY_PATTERN + END))) {
                    return "01-01-" + date;
                }
                break;
            }
            case "BIYEARLY": {
                if (date.match(new RegExp(START + GPE_BIYEARLY_PATTERN + END))) {
                    var year = date.match(new RegExp(START + GPE_BIYEARLY_PATTERN + END))[1];
                    var month = (date.match(new RegExp(START + GPE_BIYEARLY_PATTERN + END))[2] - 1) * 6;
                    return "01-" + (month + 1) + "-" + year;
                }
                break;
            }
            case "QUARTERLY": {
                if (date.match(new RegExp(START + GPE_QUARTERLY_PATTERN + END))) {
                    var year = date.match(new RegExp(START + GPE_QUARTERLY_PATTERN + END))[1];
                    var month = (date.match(new RegExp(START + GPE_QUARTERLY_PATTERN + END))[2] - 1) * 3;
                    return "01-" + (month + 1) + "-" + year;
                }
                break;
            }
            case "MONTHLY": {
                if (date.match(new RegExp(START + GPE_MONTHLY_PATTERN + END))) {
                    var year = date.match(new RegExp(START + GPE_MONTHLY_PATTERN + END))[1];
                    var month = date.match(new RegExp(START + GPE_MONTHLY_PATTERN + END))[2];
                    return "01-" + month + "-" + year;
                }
                break;
            }
            case "WEEKLY": {
                if (date.match(new RegExp(START + GPE_WEEKLY_PATTERN + END))) {
                    var year = date.match(new RegExp(START + GPE_WEEKLY_PATTERN + END))[1];
                    var day = (date.match(new RegExp(START + GPE_WEEKLY_PATTERN + END))[2] - 1) * 7;
                    var date = new Date(year, "", day + 1);
                    return date.getDate() + "-" + (date.getMonth() + 1) + "-" + year;
                }
                break;
            }
            case "DAILY": {
                if (date.match(new RegExp(START + GPE_DAILY_PATTERN + END))) {
                    var year = date.match(new RegExp(START + GPE_DAILY_PATTERN + END))[1];
                    var month = date.match(new RegExp(START + GPE_DAILY_PATTERN + END))[2];
                    var day = date.match(new RegExp(START + GPE_DAILY_PATTERN + END))[3];
                    return day + "-" + month + "-" + year;
                }
                break;
            }
        }

        return calculateDate(date);
    }

    tableau.registerConnector(myConnector);

    $(document).ready(function () {
        $("#dataButton").click(function () {
            (function(callback) {
                switch ($('input[name="datatype"]:checked').val()) {
                    case 'url':
                        urlIndicator = $('#inputUrl').val();
                        tableau.connectionName = "Indicador: ";
                        callback();
                        break;
                    case 'indicator':
                        getEndpointMetadataValue(properties.endpoint.indicators)
                            .done(function(endpoint) {
                                urlIndicator = endpoint + '/indicators/' + $('#selectIndicator').val() + '/data';
                                if ($('#selectIndicator').val() == null || $('#selectIndicator').val() == undefined || $('#selectIndicator').val().length == 0) {
                                    urlIndicator = '';
                                }
                                tableau.connectionName = "Indicador: ";
                                callback();
                            });
                        break;
                    case 'indicatorInstance':
                        getEndpointMetadataValue(properties.endpoint.indicators)
                            .done(function(endpoint) {
                                urlIndicator = endpoint + '/indicatorsSystems/' + $('#selectIndicatorSystem').val() + '/indicatorsInstances/' +
                                    $('#selectIndicatorInstance').val() + '/data';
                                if ($('#selectIndicatorInstance').val() == null || $('#selectIndicatorInstance').val() == undefined || $('#selectIndicatorInstance').val().length == 0) {
                                    urlIndicator = '';
                                }
                                tableau.connectionName = "Instancia de indicador: ";
                                callback();
                            });
                        break;
                }
            })(function() {
                var urlObj = {
                    url: urlIndicator.trim(),
                    granularity: $('#showGranularity').is(':checked'),
                    labels: $('#showLabels').is(':checked'),
                    allLanguages: $('#allLanguages').is(':checked'),
                    starModel: $("#starModel").is(":checked"),
                    showMeasureColumns: $('#measureColumns').is(':checked'),
                    recodeDates: $('#recodeDates').is(':checked')
                };
    
                function isValidUrl(url) {
                    url = url.toString();
                    return url.match(".+/data$") != null;
                }
    
                if (isValidUrl(urlObj.url)) {
                    $('#errorMsg').html("");
                    $.getJSON(urlObj.url.substring(0, urlObj.url.indexOf('/data')), function (resp) {
                        urlObj.name = resp.title.__default__;
                        if ($('input[name="datatype"]:checked').val() != "indicatorInstance") {
                            urlObj.observationId = resp.code;
                        } else {
                            urlObj.observationId = resp.subjectCode;
                        }
                        tableau.connectionName = tableau.connectionName + resp.title.__default__;
    
                        if (urlObj.allLanguages) {
                            geographicalLanguages = [];
                            for (i = 0; i < Object.keys(resp.dimension.GEOGRAPHICAL.representation[0].title).length; i++) {
                                if (Object.keys(resp.dimension.GEOGRAPHICAL.representation[0].title)[i] != "__default__") {
                                    geographicalLanguages.push(Object.keys(resp.dimension.GEOGRAPHICAL.representation[0].title)[i]);
                                }
                            }
                            urlObj.geographicalLanguages = geographicalLanguages;
    
                            timeLanguages = [];
                            for (i = 0; i < Object.keys(resp.dimension.TIME.representation[0].title).length; i++) {
                                if (Object.keys(resp.dimension.TIME.representation[0].title)[i] != "__default__") {
                                    timeLanguages.push(Object.keys(resp.dimension.TIME.representation[0].title)[i]);
                                }
                            }
                            urlObj.timeLanguages = timeLanguages;
                        }
    
                        if (urlObj.showMeasureColumns) {
                            measureColumns = [];
                            for (i = 0; i < resp.dimension.MEASURE.representation.length; i++) {
                                measureColumns[i] = measuresIds[resp.dimension.MEASURE.representation[i].code];
                            }
                            urlObj.measureColumns = measureColumns;
                        }
    
                        tableau.connectionData = JSON.stringify(urlObj);
                        tableau.submit();
                    }).error(function () {
                        $("#errorMsg").html(errorMsg.error.submit);
                    });
                } else {
                    $('#errorMsg').html(errorMsg.error.indicator.url);
                }
            });
            
        });
    });

    function _capitalize(value) {
        return value.charAt(0).toUpperCase() + value.substring(1).toLowerCase();
    }

    function _buildCols(urlObj, columnsId, languages) {
        var returnCols = [];
        returnCols.push({ id: columnsId[0], columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
        if (urlObj.granularity) {
            returnCols.push({ id: columnsId[1], columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
        }
        if (urlObj.labels) {
            if (!urlObj.allLanguages) {
                returnCols.push({ id: columnsId[2], columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
            } else {
                for (i = 0; i < urlObj.timeLanguages.length; i++) {
                    returnCols.push({ id: columnsId[2] + "_" + urlObj.timeLanguages[i], columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
                }
            }
        }
        if (columnsId[3]) {
            if (urlObj.recodeDates) {
                returnCols.push({ id: columnsId[3], columnRole: "dimension", dataType: tableau.dataTypeEnum.date });
            }
        }
        return returnCols;
    }
})();