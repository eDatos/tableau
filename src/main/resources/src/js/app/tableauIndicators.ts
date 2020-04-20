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
        var connectionData = JSON.parse(tableau.connectionData);
        var tables = [];

        var columnsTime = ['Codigo_temporal', 'Granularidad_temporal', 'Etiqueta_temporal', 'Fecha'];
        var columnsGeographic = ['Codigo_geografico', 'Granularidad_geografica', 'Etiqueta_geografica'];

        if (connectionData.starModel) {
            var cols = [];

            cols.push({ id: "Codigo_geografico", columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
            cols.push({ id: "Codigo_temporal", columnRole: "dimension", dataType: tableau.dataTypeEnum.string });

            if (connectionData.showMeasureColumns) {
                for (i = 0; i < connectionData.measureColumns.length; i++) {
                    cols.push({ id: _capitalize(connectionData.observationId) + connectionData.measureColumns[i], dataType: tableau.dataTypeEnum.float });
                }
            } else {
                cols.push({ id: "Codigo_medida", columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
                cols.push({ id: connectionData.observationId, alias: connectionData.name, dataType: tableau.dataTypeEnum.float });

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
                columns: _buildCols(connectionData, columnsGeographic, connectionData.geographicalLanguages)
            };
            number++;
            tables.push(tableGeographic);

            var tableTime = {
                id: "time",
                alias: addNumber(number) + "Temporal",
                columns: _buildCols(connectionData, columnsTime, connectionData.timeLanguages)
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
            var geographicCols = _buildCols(connectionData, columnsGeographic, connectionData.geographicalLanguages);
            var timeCols = _buildCols(connectionData, columnsTime, connectionData.timeLanguages);
            var mainCols = geographicCols;

            timeCols.forEach(function (column) {
                mainCols.push(column);
            });
            if (connectionData.showMeasureColumns) {
                for (var i = 0; i < connectionData.measureColumns.length; i++) {
                    mainCols.push({ id: _capitalize(connectionData.observationId) + connectionData.measureColumns[i], dataType: tableau.dataTypeEnum.float });
                }
            } else {
                mainCols.push({ id: "Codigo_medida", columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
                mainCols.push({ id: connectionData.observationId, alias: connectionData.name, dataType: tableau.dataTypeEnum.float });
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
        var connectionData = JSON.parse(tableau.connectionData);
        var promises = [];
        var isMainTable = table.tableInfo.id == "indicatorData";

        if (!isMainTable || (!connectionData.starModel && (connectionData.granularity || connectionData.labels || connectionData.recodeDates))) {
            promises.push($.getJSON(connectionData.url.substring(0, connectionData.url.indexOf('/data'))));
        }

        if (isMainTable) {
            promises.push($.getJSON(connectionData.url));
        }


        $.when.apply($, promises).then(function () {


            if (isMainTable && connectionData.starModel) {
                var dataResponse = arguments[0];
                var geographicalDimensions = _.invert(dataResponse.dimension.GEOGRAPHICAL.representation.index);
                var measureDimensions = _.invert(dataResponse.dimension.MEASURE.representation.index);
                var timeDimensions = _.invert(dataResponse.dimension.TIME.representation.index);
            } else if (isMainTable) {
                var indexArguments = 0;
                if (connectionData.granularity || connectionData.labels || connectionData.recodeDates) {
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
            if (isMainTable && connectionData.starModel) {
                for (var i = 0, lengthGeographical = dataResponse.dimension.GEOGRAPHICAL.representation.size; i < lengthGeographical; i++) {
                    for (var j = 0, lengthTime = dataResponse.dimension.TIME.representation.size; j < lengthTime; j++) {
                        if (connectionData.showMeasureColumns) {
                            var dataEntry: DataEntry = {};
                            dataEntry.Codigo_geografico = geographicalDimensions[i];
                            dataEntry.Codigo_temporal = timeDimensions[j];
                            for (var k = 0, lengthMeasure = dataResponse.dimension.MEASURE.representation.size; k < lengthMeasure; k++) {
                                dataEntry[_capitalize(connectionData.observationId) + measuresIds[measureDimensions[k]]] = dataResponse.observation[i * lengthTime * lengthMeasure + j * lengthMeasure + k];
                            }
                            tableData.push(dataEntry);
                        } else {
                            for (var k = 0, lengthMeasure = dataResponse.dimension.MEASURE.representation.size; k < lengthMeasure; k++) {
                                var dataEntry: DataEntry = {};
                                dataEntry.Codigo_geografico = geographicalDimensions[i];
                                dataEntry.Codigo_temporal = timeDimensions[j];
                                dataEntry.Codigo_medida = measureDimensions[k];
                                dataEntry[connectionData.observationId] = dataResponse.observation[i * lengthTime * lengthMeasure + j * lengthMeasure + k];
                                tableData.push(dataEntry);
                            }
                        }
                    }
                }
            } else if (table.tableInfo.id == "geographic") {
                for (var i = 0, lengthGeographical = dimensions.GEOGRAPHICAL.representation.length; i < lengthGeographical; i++) {
                    var dataEntry: DataEntry = {};
                    dataEntry.Codigo_geografico = dimensions.GEOGRAPHICAL.representation[i].code;

                    if (connectionData.granularity) {
                        dataEntry.Granularidad_geografica = dimensions.GEOGRAPHICAL.representation[i].granularityCode;
                    }

                    if (connectionData.labels) {
                        if (!connectionData.allLanguages) {
                            dataEntry.Etiqueta_geografica = dimensions.GEOGRAPHICAL.representation[i].title.__default__;
                        } else {
                            for (var l = 0; l < connectionData.geographicalLanguages.length; l++) {
                                dataEntry['Etiqueta_geografica_' + connectionData.geographicalLanguages[l]] = dimensions.GEOGRAPHICAL.representation[i].title[connectionData.geographicalLanguages[l]];
                            }
                        }
                    }
                    tableData.push(dataEntry);
                }
            } else if (table.tableInfo.id == "time") {
                for (var j = 0, lengthTime = dimensions.TIME.representation.length; j < lengthTime; j++) {
                    var dataEntry: DataEntry = {};

                    if (connectionData.recodeDates) {
                        var granularity = dimensions.TIME.representation[j].granularityCode;
                        var date: string = dimensions.TIME.representation[j].code;
                        dataEntry.Fecha = recodeDates(date, granularity);
                    }

                    dataEntry.Codigo_temporal = dimensions.TIME.representation[j].code;

                    if (connectionData.granularity) {
                        dataEntry.Granularidad_temporal = dimensions.TIME.representation[j].granularityCode;
                    }

                    if (connectionData.labels) {
                        if (!connectionData.allLanguages) {
                            dataEntry.Etiqueta_temporal = dimensions.TIME.representation[j].title.__default__;
                        } else {
                            for (l = 0; l < connectionData.timeLanguages.length; l++) {
                                dataEntry['Etiqueta_temporal_' + connectionData.timeLanguages[l]] = dimensions.TIME.representation[j].title[connectionData.timeLanguages[l]];
                            }
                        }
                    }
                    tableData.push(dataEntry);
                }
            } else if (table.tableInfo.id == "measure") {
                for (var j = 0, lengthTime = dimensions.MEASURE.representation.length; j < lengthTime; j++) {
                    var dataEntry: DataEntry = {};
                    dataEntry.Codigo_medida = dimensions.MEASURE.representation[j].code;
                    tableData.push(dataEntry);
                }
            } else {
                for (var i = 0, lengthGeographical = dataResponse.dimension.GEOGRAPHICAL.representation.size; i < lengthGeographical; i++) {
                    for (var j = 0, lengthTime = dataResponse.dimension.TIME.representation.size; j < lengthTime; j++) {
                        if (connectionData.showMeasureColumns) {
                            var dataEntry: DataEntry = {};
                            dataEntry.Codigo_geografico = geographicalDimensions[i];

                            if (connectionData.recodeDates) {
                                var granularity = indexedTimeRepresentations[timeDimensions[j]].granularityCode;
                                var date = timeDimensions[j];
                                dataEntry.Fecha = recodeDates(date, granularity);
                            }
                            dataEntry.Codigo_temporal = timeDimensions[j];

                            for (var k = 0, lengthMeasure = dataResponse.dimension.MEASURE.representation.size; k < lengthMeasure; k++) {
                                dataEntry[_capitalize(connectionData.observationId) + measuresIds[measureDimensions[k]]] = dataResponse.observation[i * lengthTime * lengthMeasure + j * lengthMeasure + k];
                            }

                            if (connectionData.granularity) {
                                dataEntry.Granularidad_geografica = indexedGeographicalRepresentations[dataEntry.Codigo_geografico].granularityCode;
                                dataEntry.Granularidad_temporal = indexedTimeRepresentations[timeDimensions[j]].granularityCode;
                            }

                            if (connectionData.labels) {
                                if (!connectionData.allLanguages) {
                                    dataEntry.Etiqueta_geografica = indexedGeographicalRepresentations[dataEntry.Codigo_geografico].title.__default__;
                                    dataEntry.Etiqueta_temporal = indexedTimeRepresentations[timeDimensions[j]].title.__default__;
                                } else {
                                    for (l = 0; l < connectionData.geographicalLanguages.length; l++) {
                                        dataEntry['Etiqueta_geografica_' + connectionData.geographicalLanguages[l]] = indexedGeographicalRepresentations[dataEntry.Codigo_geografico].title[connectionData.geographicalLanguages[l]];
                                    }
                                    for (l = 0; l < connectionData.timeLanguages.length; l++) {
                                        dataEntry['Etiqueta_temporal_' + connectionData.timeLanguages[l]] = indexedTimeRepresentations[timeDimensions[j]].title[connectionData.timeLanguages[l]];
                                    }
                                }
                            }
                            tableData.push(dataEntry);

                        } else {
                            for (var k = 0, lengthMeasure = dataResponse.dimension.MEASURE.representation.size; k < lengthMeasure; k++) {
                                var dataEntry: DataEntry = {};
                                dataEntry.Codigo_geografico = geographicalDimensions[i];

                                if (connectionData.recodeDates) {
                                    var granularity = indexedTimeRepresentations[timeDimensions[j]].granularityCode;
                                    var date = timeDimensions[j];
                                    dataEntry.Fecha = recodeDates(date, granularity);
                                }
                                dataEntry.Codigo_temporal = timeDimensions[j];

                                dataEntry.Codigo_medida = measureDimensions[k];
                                dataEntry[connectionData.observationId] = dataResponse.observation[i * lengthTime * lengthMeasure + j * lengthMeasure + k];

                                if (connectionData.granularity) {
                                    dataEntry.Granularidad_geografica = indexedGeographicalRepresentations[dataEntry.Codigo_geografico].granularityCode;
                                    dataEntry.Granularidad_temporal = indexedTimeRepresentations[timeDimensions[j]].granularityCode;
                                }

                                if (connectionData.labels) {
                                    if (!connectionData.allLanguages) {
                                        dataEntry.Etiqueta_geografica = indexedGeographicalRepresentations[dataEntry.Codigo_geografico].title.__default__;
                                        dataEntry.Etiqueta_temporal = indexedTimeRepresentations[timeDimensions[j]].title.__default__;
                                    } else {
                                        for (l = 0; l < connectionData.geographicalLanguages.length; l++) {
                                            dataEntry['Etiqueta_geografica_' + connectionData.geographicalLanguages[l]] = indexedGeographicalRepresentations[dataEntry.Codigo_geografico].title[connectionData.geographicalLanguages[l]];
                                        }
                                        for (l = 0; l < connectionData.timeLanguages.length; l++) {
                                            dataEntry['Etiqueta_temporal_' + connectionData.timeLanguages[l]] = indexedTimeRepresentations[timeDimensions[j]].title[connectionData.timeLanguages[l]];
                                        }
                                    }
                                }
                                tableData.push(dataEntry);
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

    function recodeDates(date: string, granularity: string): string {
        switch (granularity) {
            case "YEARLY": {
                if (date.match(new RegExp(START + GPE_YEARLY_PATTERN + END))) {
                    return "01-01-" + date;
                }
                break;
            }
            case "BIYEARLY": {
                if (date.match(new RegExp(START + GPE_BIYEARLY_PATTERN + END))) {
                    var year: number = parseInt(date.match(new RegExp(START + GPE_BIYEARLY_PATTERN + END))[1]);
                    var month: number = (parseInt(date.match(new RegExp(START + GPE_BIYEARLY_PATTERN + END))[2]) - 1) * 6;
                    return "01-" + (month + 1) + "-" + year;
                }
                break;
            }
            case "QUARTERLY": {
                if (date.match(new RegExp(START + GPE_QUARTERLY_PATTERN + END))) {
                    var year: number = parseInt(date.match(new RegExp(START + GPE_QUARTERLY_PATTERN + END))[1]);
                    var month: number = (parseInt(date.match(new RegExp(START + GPE_QUARTERLY_PATTERN + END))[2]) - 1) * 3;
                    return "01-" + (month + 1) + "-" + year;
                }
                break;
            }
            case "MONTHLY": {
                if (date.match(new RegExp(START + GPE_MONTHLY_PATTERN + END))) {
                    var year: number = parseInt(date.match(new RegExp(START + GPE_MONTHLY_PATTERN + END))[1]);
                    var month: number = parseInt(date.match(new RegExp(START + GPE_MONTHLY_PATTERN + END))[2]);
                    return "01-" + month + "-" + year;
                }
                break;
            }
            case "WEEKLY": {
                if (date.match(new RegExp(START + GPE_WEEKLY_PATTERN + END))) {
                    var year: number = parseInt(date.match(new RegExp(START + GPE_WEEKLY_PATTERN + END))[1]);
                    var day: number = (parseInt(date.match(new RegExp(START + GPE_WEEKLY_PATTERN + END))[2]) - 1) * 7;
                    var calculatedDate: Date = new Date(year, 0, day + 1);
                    return calculatedDate.getDate() + "-" + (calculatedDate.getMonth() + 1) + "-" + year;
                }
                break;
            }
            case "DAILY": {
                if (date.match(new RegExp(START + GPE_DAILY_PATTERN + END))) {
                    var year = parseInt(date.match(new RegExp(START + GPE_DAILY_PATTERN + END))[1]);
                    var month = parseInt(date.match(new RegExp(START + GPE_DAILY_PATTERN + END))[2]);
                    var day = parseInt(date.match(new RegExp(START + GPE_DAILY_PATTERN + END))[3]);
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
            (function (callback) {
                switch ($('input[name="datatype"]:checked').val()) {
                    case 'url':
                        urlIndicator = $('#inputUrl').val();
                        tableau.connectionName = "Indicador: ";
                        callback();
                        break;
                    case 'indicator':
                        getEndpointMetadataValue(properties.endpoint.indicators)
                            .done(function (endpoint) {
                                urlIndicator = endpoint + '/indicators/' + $('#selectIndicator').val() + '/data';
                                if ($('#selectIndicator').val() == null || $('#selectIndicator').val() == undefined || (<string[]>$('#selectIndicator').val()).length == 0) {
                                    urlIndicator = '';
                                }
                                tableau.connectionName = "Indicador: ";
                                callback();
                            });
                        break;
                    case 'indicatorInstance':
                        getEndpointMetadataValue(properties.endpoint.indicators)
                            .done(function (endpoint) {
                                urlIndicator = endpoint + '/indicatorsSystems/' + $('#selectIndicatorSystem').val() + '/indicatorsInstances/' +
                                    $('#selectIndicatorInstance').val() + '/data';
                                if ($('#selectIndicatorInstance').val() == null || $('#selectIndicatorInstance').val() == undefined || (<string[]>$('#selectIndicatorInstance').val()).length == 0) {
                                    urlIndicator = '';
                                }
                                tableau.connectionName = "Instancia de indicador: ";
                                callback();
                            });
                        break;
                }
            })(function () {
                var connectionData: IndicatorsConnectionData = {
                    url: urlIndicator.trim(),
                    granularity: $('#showGranularity').is(':checked'),
                    labels: $('#showLabels').is(':checked'),
                    allLanguages: $('#allLanguages').is(':checked'),
                    starModel: $("#starModel").is(":checked"),
                    showMeasureColumns: $('#measureColumns').is(':checked'),
                    recodeDates: $('#recodeDates').is(':checked'),
                    name: "",
                    observationId: "",
                    geographicalLanguages: [],
                    timeLanguages: [],
                    measureColumns: []
                };

                function isValidUrl(url) {
                    url = url.toString();
                    return url.match(".+/data$") != null;
                }

                if (isValidUrl(connectionData.url)) {
                    $('#errorMsg').html("");
                    $.getJSON(connectionData.url.substring(0, connectionData.url.indexOf('/data')), function (resp) {
                        connectionData.name = resp.title.__default__;
                        if ($('input[name="datatype"]:checked').val() != "indicatorInstance") {
                            connectionData.observationId = resp.code;
                        } else {
                            connectionData.observationId = resp.subjectCode;
                        }
                        tableau.connectionName = tableau.connectionName + resp.title.__default__;

                        if (connectionData.allLanguages) {
                            let geographicalLanguages: string[] = [];
                            for (let i = 0; i < Object.keys(resp.dimension.GEOGRAPHICAL.representation[0].title).length; i++) {
                                if (Object.keys(resp.dimension.GEOGRAPHICAL.representation[0].title)[i] != "__default__") {
                                    geographicalLanguages.push(Object.keys(resp.dimension.GEOGRAPHICAL.representation[0].title)[i]);
                                }
                            }
                            connectionData.geographicalLanguages = geographicalLanguages;

                            let timeLanguages: string[] = [];
                            for (let i = 0; i < Object.keys(resp.dimension.TIME.representation[0].title).length; i++) {
                                if (Object.keys(resp.dimension.TIME.representation[0].title)[i] != "__default__") {
                                    timeLanguages.push(Object.keys(resp.dimension.TIME.representation[0].title)[i]);
                                }
                            }
                            connectionData.timeLanguages = timeLanguages;
                        }

                        if (connectionData.showMeasureColumns) {
                            let measureColumns: string[] = [];
                            for (let i = 0; i < resp.dimension.MEASURE.representation.length; i++) {
                                measureColumns[i] = measuresIds[resp.dimension.MEASURE.representation[i].code];
                            }
                            connectionData.measureColumns = measureColumns;
                        }

                        tableau.connectionData = JSON.stringify(connectionData);
                        tableau.submit();
                    }).fail(function () {
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

    function _buildCols(connectionData: IndicatorsConnectionData, columnsId, languages) {
        var returnCols = [];
        returnCols.push({ id: columnsId[0], columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
        if (connectionData.granularity) {
            returnCols.push({ id: columnsId[1], columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
        }
        if (connectionData.labels) {
            if (!connectionData.allLanguages) {
                returnCols.push({ id: columnsId[2], columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
            } else {
                for (var i = 0; i < connectionData.timeLanguages.length; i++) {
                    returnCols.push({ id: columnsId[2] + "_" + connectionData.timeLanguages[i], columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
                }
            }
        }
        if (columnsId[3]) {
            if (connectionData.recodeDates) {
                returnCols.push({ id: columnsId[3], columnRole: "dimension", dataType: tableau.dataTypeEnum.date });
            }
        }
        return returnCols;
    }
})();