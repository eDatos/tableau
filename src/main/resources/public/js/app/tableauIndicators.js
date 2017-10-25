(function () {
    var myConnector = tableau.makeConnector();
    var urlIndicator;

    myConnector.getSchema = function (schemaCallback) {
        var urlObj = JSON.parse(tableau.connectionData);

        var cols = [];

        cols.push({ id: "Codigo_geografico", columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
        cols.push({ id: "Codigo_temporal", columnRole: "dimension", dataType: tableau.dataTypeEnum.string });

        if (urlObj.showMeasureColumns) {
            for (i = 0; i < urlObj.measureColumns.length; i++) {
                cols.push({ id: urlObj.observationId + "_" + urlObj.measureColumns[i], dataType: tableau.dataTypeEnum.float })
            }
        } else {
            cols.push({ id: "Codigo_medida", columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
            cols.push({ id: urlObj.observationId, alias: urlObj.name, dataType: tableau.dataTypeEnum.float });

            var measureColumns = [];

            measureColumns.push({ id: "Codigo_medida", columnRole: "dimension", dataType: tableau.dataTypeEnum.string });

            var tableMeasure = {
                id: "measure",
                alias: "Medida",
                columns: measureColumns
            }
        }

        var geographicCols = [];
        geographicCols.push({ id: "Codigo_geografico", columnRole: "dimension", dataType: tableau.dataTypeEnum.string });

        if (urlObj.granularity) {
            geographicCols.push({ id: "Granularidad_geografica", columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
        }

        if (urlObj.labels) {
            if (!urlObj.allLanguages) {
                geographicCols.push({ id: "Etiqueta_geografica", columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
            } else {
                for (i = 0; i < urlObj.geographicalLanguages.length; i++) {
                    geographicCols.push({ id: "Etiqueta_geografica_" + urlObj.geographicalLanguages[i], columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
                }
            }
        }

        var tableGeographic = {
            id: "geographic",
            alias: "Geográfica",
            columns: geographicCols
        };

        var timeCols = [];

        if (urlObj.recodeDates) {
            timeCols.push({ id: "Fecha", columnRole: "dimension", dataType: tableau.dataTypeEnum.date });
        }
        timeCols.push({ id: "Codigo_temporal", columnRole: "dimension", dataType: tableau.dataTypeEnum.string });

        if (urlObj.granularity) {
            timeCols.push({ id: "Granularidad_temporal", columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
        }
        if (urlObj.labels) {
            if (!urlObj.allLanguages) {
                timeCols.push({ id: "Etiqueta_temporal", columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
            } else {
                for (i = 0; i < urlObj.timeLanguages.length; i++) {
                    timeCols.push({ id: "Etiqueta_temporal_" + urlObj.timeLanguages[i], columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
                }
            }
        }

        var tableTime = {
            id: "time",
            alias: "Temporal",
            columns: timeCols
        };

        var tableInfo = {
            id: "indicatorData",
            alias: tableau.connectionName,
            columns: cols
        };

        var tables = [tableInfo, tableGeographic, tableTime];

        if (!urlObj.showMeasureColumns) {
            tables.push(tableMeasure);
        }

        schemaCallback(tables);
    };

    myConnector.getData = function (table, doneCallback) {
        var urlObj = JSON.parse(tableau.connectionData);
        var promises = [];
        var isMainTable = table.tableInfo.id == "indicatorData";
        if (isMainTable) {
            promises.push($.getJSON(urlObj.url));
         } else {
             promises.push($.getJSON(urlObj.url.substring(0, urlObj.url.indexOf('/data'))));
         }
            

        $.when.apply($, promises).then(function () {

            
            if (isMainTable) {
                var dataResponse = arguments[0];
                var geographicalDimensions = _.invert(dataResponse.dimension.GEOGRAPHICAL.representation.index);    
                var measureDimensions = _.invert(dataResponse.dimension.MEASURE.representation.index);
                var timeDimensions = _.invert(dataResponse.dimension.TIME.representation.index);
            } else {
                var dimensions = arguments[0].dimension;
                // var indexedGeographicalRepresentations = _.keyBy(dimensions.GEOGRAPHICAL.representation, 'code');
                // var indexedTimeRepresentations = _.keyBy(dimensions.TIME.representation, 'code');
            }
            var tableData = [];
            if (isMainTable) {
                for (var i = 0, lengthGeographical = dataResponse.dimension.GEOGRAPHICAL.representation.size; i < lengthGeographical; i++) {
                    for (var j = 0, lengthTime = dataResponse.dimension.TIME.representation.size; j < lengthTime; j++) {
                        if (urlObj.showMeasureColumns) {
                            var hash = {};
                            hash.Codigo_geografico = geographicalDimensions[i];
                            hash.Codigo_temporal = timeDimensions[j];
                            for (var k = 0, lengthMeasure = dataResponse.dimension.MEASURE.representation.size; k < lengthMeasure; k++) {
                                hash[urlObj.observationId + '_' + text[language].indicator.measures[measureDimensions[k]]] = dataResponse.observation[i * lengthTime * lengthMeasure + j * lengthMeasure + k];
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
            } else if (table.tableInfo.id == "geographic"){
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
            switch ($('input[name="datatype"]:checked').val()) {
                case 'url':
                    urlIndicator = $('#inputUrl').val();
                    tableau.connectionName = text[language].indicator.name;
                    break;
                case 'indicator':
                    var endpoint = properties.endpoint.indicators;
                    if (endpoint[endpoint.length - 1] == "/") {
                        endpoint = endpoint.substring(0, endpoint.lastIndexOf("/"));
                    }
                    urlIndicator = endpoint + '/indicators/' + $('#selectIndicator').val() + '/data';
                    if ($('#selectIndicator').val() == null || $('#selectIndicator').val() == undefined || $('#selectIndicator').val().length == 0) {
                        urlIndicator = '';
                    }
                    tableau.connectionName = text[language].indicator.name;
                    break;
                case 'indicatorInstance':
                    var endpoint = properties.endpoint.indicators;
                    if (endpoint[endpoint.length - 1] == "/") {
                        endpoint = endpoint.substring(0, endpoint.lastIndexOf("/"));
                    }
                    urlIndicator = endpoint + '/indicatorsSystems/' + $('#selectIndicatorSystem').val() + '/indicatorsInstances/' +
                        $('#selectIndicatorInstance').val() + '/data';
                    if ($('#selectIndicatorInstance').val() == null || $('#selectIndicatorInstance').val() == undefined || $('#selectIndicatorInstance').val().length == 0) {
                        urlIndicator = '';
                    }
                    tableau.connectionName = text[language].indicator.instance;
                    break;
            }
            var urlObj = {
                url: urlIndicator.trim(),
                granularity: $('#showGranularity').is(':checked'),
                labels: $('#showLabels').is(':checked'),
                allLanguages: $('#allLanguages').is(':checked'),
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
                            measureColumns[i] = text[language].indicator.measures[resp.dimension.MEASURE.representation[i].code];
                        }
                        urlObj.measureColumns = measureColumns;
                    }

                    tableau.connectionData = JSON.stringify(urlObj);
                    tableau.submit();
                }).error(function () {
                    $("#errorMsg").html(errorMsg[language].error.submit);
                });
            } else {
                $('#errorMsg').html(errorMsg[language].error.indicator.url);
            }
        });
    });
})();