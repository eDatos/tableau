(function () {
    var myConnector = tableau.makeConnector();
    var urlDataset;
    var number = 1;

    myConnector.getSchema = function (schemaCallback) {
        var connectionData = JSON.parse(tableau.connectionData);
        var cols = [];
        var tables = [];

        if (!connectionData.measureColumns) {
            cols.push({ id: connectionData.observationId, alias: connectionData.name, dataType: tableau.dataTypeEnum.float });
        }

        if (connectionData.starModel) {
            for (let i = 0; i < Object.keys(connectionData.dimensions).length; i++) {
                if (connectionData.measureColumns && connectionData.dimensions[i].id == connectionData.measureColumns.dimension) {
                    for (let j = 0; j < connectionData.measureColumns.values.length; j++) {
                        cols.push({
                            id: connectionData.measureColumns.dimension + "_" + connectionData.measureColumns.values[j].id, alias: connectionData.measureColumns.values[j].label,
                            dataType: tableau.dataTypeEnum.float
                        });
                    }
                } else {
                    cols.push({ id: connectionData.dimensions[i].id, alias: connectionData.dimensions[i].label, columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
                    tables.push({
                        id: connectionData.dimensions[i].id,
                        alias: addNumber(number) + connectionData.dimensions[i].label,
                        columns: _buildColumns(connectionData, connectionData.dimensions[i], connectionData.languages)
                    });
                    number++;
                }
            }
        } else {
            for (let i = 0; i < Object.keys(connectionData.dimensions).length; i++) {
                if (connectionData.measureColumns && connectionData.dimensions[i].id == connectionData.measureColumns.dimension) {
                    for (let j = 0; j < connectionData.measureColumns.values.length; j++) {
                        cols.push({
                            id: connectionData.measureColumns.dimension + "_" + connectionData.measureColumns.values[j].id, alias: connectionData.measureColumns.values[j].label,
                            dataType: tableau.dataTypeEnum.float
                        });
                    }
                } else {
                    var columns = _buildColumns(connectionData, connectionData.dimensions[i], connectionData.languages);
                    columns.forEach(function (element) {
                        cols.push(element);
                    });
                }
            }
        }

        var tableInfo = {
            id: "datasetData",
            alias: addNumber(number) + tableau.connectionName,
            columns: cols
        };
        tables.push(tableInfo);

        schemaCallback(tables);
    };

    myConnector.getData = function (table, doneCallback) {
        var urlObj = JSON.parse(tableau.connectionData);
        var promises = [];

        promises.push($.getJSON(urlObj.url));

        $.when.apply($, promises).then(function () {
            var tableData = [];
            var dataResponse = arguments[0];
            var observations = dataResponse.data.observations.split(" | ");
            var total = 1;
            for (let i = 0; i < Object.keys(urlObj.dimensions).length; i++) {
                total = total * dataResponse.data.dimensions.dimension[i].representations.total;
            }
            if (table.tableInfo.id == "datasetData") {
                for (let i = 0; i < observations.length; i++) {
                    var hash = {};
                    var copyHash = {};
                    if (!urlObj.measureColumns) {
                        hash[urlObj.observationId] = observations[i];
                    }
                    var remaining = i;
                    var subtotal = total;

                    for (let j = 0; j < dataResponse.data.dimensions.total; j++) {
                        var totalDimension = dataResponse.data.dimensions.dimension[j].representations.total;
                        subtotal = Math.floor(subtotal / totalDimension);
                        let indDimension = Math.floor(remaining / subtotal);
                        remaining = remaining % subtotal;
                        if (urlObj.measureColumns) {
                            if (urlObj.measureColumns.dimension == urlObj.dimensions[j].id) {
                                copyHash[urlObj.measureColumns.dimension + "_" + _.keyBy(dataResponse.data.dimensions.dimension[j].representations.representation, 'index')[indDimension].code] = observations[i];
                            } else {
                                hash[urlObj.dimensions[j].id] = _.keyBy(dataResponse.data.dimensions.dimension[j].representations.representation, 'index')[indDimension].code;
                                copyHash[urlObj.dimensions[j].id] = _.keyBy(dataResponse.data.dimensions.dimension[j].representations.representation, 'index')[indDimension].code;
                            }
                        } else {
                            hash[urlObj.dimensions[j].id] = _.keyBy(dataResponse.data.dimensions.dimension[j].representations.representation, 'index')[indDimension].code;
                        }
                        if (!urlObj.starModel) {
                            if (urlObj.recodeDates && urlObj.timeDimension == urlObj.dimensions[j].id) {
                                hash["Fecha"] = calculateDate(_.keyBy(dataResponse.data.dimensions.dimension[j].representations.representation, 'index')[indDimension].code);;
                            }
                            if (urlObj.labels) {
                                var dimension = _.keyBy(dataResponse.metadata.dimensions.dimension, "id")[urlObj.dimensions[j].id];
                                var dimensionValue = _.keyBy(dimension.dimensionValues.value, "id")[hash[urlObj.dimensions[j].id]];
                                var dimensionLabel = _.keyBy(dimensionValue.name.text, "lang");
                                if (urlObj.allLanguages) {
                                    for (let k = 0; k < urlObj.languages.length; k++) {
                                        if (dimensionLabel[urlObj.languages[k]]) {
                                            hash["Etiqueta_" + dimension.id + "_" + urlObj.languages[k]] = dimensionLabel[urlObj.languages[k]].value;
                                        } else {
                                            hash["Etiqueta_" + dimension.id + "_" + urlObj.languages[k]] = '';
                                        }
                                    }
                                } else {
                                    hash["Etiqueta_" + dimension.id] = dimensionLabel['es'].value;
                                }
                            }
                        }
                    }

                    if (urlObj.measureColumns && table.tableInfo.id == "datasetData") {
                        var keyHash = _.values(hash).join(',');
                        if (tableData[keyHash]) {
                            _.extend(tableData[keyHash], copyHash);
                        } else {
                            tableData[keyHash] = copyHash;
                        }
                    } else {
                        tableData.push(hash);
                    }
                }
            } else {
                var dimension = _.keyBy(dataResponse.metadata.dimensions.dimension, "id")[table.tableInfo.id];
                for (let i = 0; i < dimension.dimensionValues.total; i++) {
                    var hash = {};
                    hash[table.tableInfo.id] = dimension.dimensionValues.value[i].id;
                    if (urlObj.recodeDates && urlObj.timeDimension == table.tableInfo.id) {
                        hash["Fecha"] = calculateDate(dimension.dimensionValues.value[i].id);
                    }
                    if (urlObj.labels) {
                        var dimensionLabels = _.keyBy(dimension.dimensionValues.value[i].name.text, "lang");
                        if (urlObj.allLanguages) {
                            for (let k = 0; k < urlObj.languages.length; k++) {
                                if (dimensionLabels[urlObj.languages[k]]) {
                                    hash["Etiqueta_" + dimension.id + "_" + urlObj.languages[k]] = dimensionLabels[urlObj.languages[k]].value;
                                } else {
                                    hash["Etiqueta_" + dimension.id + "_" + urlObj.languages[k]] = '';
                                }
                            }
                        } else {
                            hash["Etiqueta_" + dimension.id] = dimensionLabels['es'].value;
                        }
                    }
                    tableData.push(hash);
                }
            }

            table.appendRows(_.values(tableData));
            doneCallback();
        }, function () {
            doneCallback();
        })
    };

    tableau.registerConnector(myConnector);

    $(document).ready(function () {
        $("#dataButton").click(function () {
            switch ($('input[name="datatype"]:checked').val()) {
                case 'url':
                    urlDataset = $('#inputUrl').val();
                    tableau.connectionName = "Cubo: ";
                    break;
                case 'operation':
                    urlDataset = $("#selectDataset").val() + "/~latest";
                    tableau.connectionName = "Cubo: ";
                    break;
            }
            var connectionData: DatasetsConnectionData = {
                url: urlDataset.trim(),
                showMeasureColumns: $('#measureColumns').is(':checked'),
                labels: $('#showLabels').is(':checked'),
                starModel: $('#starModel').is(':checked'),
                recodeDates: $('#recodeDates').is(':checked'),
                allLanguages: $('#allLanguages').is(':checked'),
                name: "",
                observationId: "",
                measureColumns: {},
                timeLanguages: [],
                languages: [],
                timeDimension: "",
                dimensions: {}
            };

            function isValidUrl(url) {
                url = url.toString();
                return url.match(".+") != null;
            }

            if (isValidUrl(connectionData.url)) {
                $('#errorMsg').html("");
                connectionData.url = connectionData.url.replace("&fields=-metadata", "");
                if (connectionData.url.indexOf("?") != -1) {
                    if (connectionData.url.indexOf(".json") == -1) {
                        connectionData.url = connectionData.url.replace("?", ".json?");
                    }
                } else {
                    if (connectionData.url.indexOf(".json") == -1) {
                        connectionData.url = connectionData.url + ".json";
                    }
                }
                $.getJSON(connectionData.url, function (resp) {
                    tableau.connectionName = tableau.connectionName + _.keyBy(resp.name.text, 'lang')[language].value;
                    connectionData.name = _.keyBy(resp.name.text, 'lang')[language].value;
                    connectionData.observationId = resp.id;

                    if (connectionData.showMeasureColumns) {
                        var measureColumns: DatasetMeasureColumn = {};
                        var dimension = _.keyBy(resp.metadata.dimensions.dimension, 'type')['MEASURE_DIMENSION'];
                        if (dimension) {
                            measureColumns.dimension = dimension.id;
                            var values = [];
                            for (let i = 0; i < dimension.dimensionValues.value.length; i++) {
                                values[i] = {
                                    id: dimension.dimensionValues.value[i].id,
                                    label: _.keyBy(dimension.dimensionValues.value[i].name.text, 'lang')['es'].value
                                };
                            }
                            measureColumns.values = values;
                            connectionData.measureColumns = measureColumns;
                        } else {
                            connectionData.showMeasureColumns = false;
                        }
                    }

                    var dimensions = {};
                    for (let i = 0; i < resp.metadata.dimensions.total; i++) {
                        dimensions[i] = {
                            id: resp.metadata.dimensions.dimension[i].id,
                            label: _.keyBy(resp.metadata.dimensions.dimension[i].name.text, 'lang')[language].value
                        }
                    }

                    if (connectionData.recodeDates) {
                        var dimensionsByType = _.keyBy(resp.metadata.dimensions.dimension, 'type');
                        if (dimensionsByType['TIME_DIMENSION']) {
                            connectionData.timeDimension = dimensionsByType['TIME_DIMENSION'].id;
                        } else {
                            connectionData.recodeDates = false;
                        }
                    }

                    if (connectionData.allLanguages) {
                        connectionData.languages = resp.selectedLanguages.language;
                    }

                    connectionData.dimensions = dimensions;
                    tableau.connectionData = JSON.stringify(connectionData);
                    tableau.submit();
                }).fail(function () {
                    $("#errorMsg").html(errorMsg.error.submit);
                });
            } else {
                $('#errorMsg').html(errorMsg.error.dataset.url);
            }
        });
    });

    function _buildColumns(connectionData, dimension, languages) {
        var returnCols = [];
        returnCols.push({ id: dimension.id, alias: dimension.label, columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
        if (connectionData.labels) {
            if (!connectionData.allLanguages) {
                returnCols.push({ id: "Etiqueta_" + dimension.id, alias: dimension.label, columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
            } else {
                for (var k = 0; k < connectionData.languages.length; k++) {
                    returnCols.push({ id: "Etiqueta_" + dimension.id + "_" + languages[k], alias: dimension.label + "_" + languages[k], columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
                }
            }
        }
        if (connectionData.recodeDates && connectionData.timeDimension == dimension.id) {
            returnCols.push({ id: "Fecha", alias: "Fecha", columnRole: "dimension", dataType: tableau.dataTypeEnum.date });
        }
        return returnCols;
    }

})();