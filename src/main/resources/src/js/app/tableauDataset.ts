(function () {
    var myConnector = tableau.makeConnector();
    var urlDataset: string;
    var number = 1;

    myConnector.getSchema = function (schemaCallback) {
        var connectionData = JSON.parse(tableau.connectionData);
        var cols = [];
        var tables = [];

        if (!connectionData.showMeasureColumns) {
            cols.push({ id: connectionData.observationId, alias: connectionData.name, dataType: tableau.dataTypeEnum.float });
        }

        if (connectionData.starModel) {
            for (let i = 0; i < Object.keys(connectionData.dimensions).length; i++) {
                if (connectionData.showMeasureColumns && connectionData.dimensions[i].id == connectionData.measureColumns.dimension) {
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
                if (connectionData.showMeasureColumns && connectionData.dimensions[i].id == connectionData.measureColumns.dimension) {
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

        var tableInfo: Tableau.TableInfo = {
            id: "datasetData",
            alias: addNumber(number) + tableau.connectionName,
            columns: cols
        };
        tables.push(tableInfo);

        schemaCallback(tables);
    };

    myConnector.getData = function (table, doneCallback) {
        var urlObj = JSON.parse(tableau.connectionData);

        $.getJSON(urlObj.url)
            .then(function (dataResponse) {
                switch (urlObj.resourceType) {
                    case "GPE_DATASET":
                        parseGPEDatasetResponse(dataResponse, urlObj, table, doneCallback);
                        break;
                    case "STATISTICAL_RESOURCE_DATASET":
                        parseStatisticalResourceDatasetResponse(dataResponse, urlObj, table, doneCallback);
                        break;
                    default:
                        $('#errorMsg').html(errorMsg.error.dataset.url.unsupportedResourceType);
                        break;
                }
            })
            .fail(doneCallback);

    };

    tableau.registerConnector(myConnector);

    $(document).ready(function () {
        $("#dataButton").click(function () {
            switch ($('input[name="datatype"]:checked').val()) {
                case 'url':
                    urlDataset = <string>$('#inputUrl').val();
                    tableau.connectionName = "Cubo: ";
                    break;
                case 'operation':
                    urlDataset = $("#selectDataset").val() + "/~latest";
                    tableau.connectionName = "Cubo: ";
                    break;
            }
            var connectionData: DatasetsConnectionData = {
                url: urlDataset.trim(),
                resourceType: calculateResourceType(urlDataset.trim()),
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
            switch (connectionData.resourceType) {
                case "GPE_DATASET":
                    buildConnectionDataForGPE(connectionData);
                    break;
                case "STATISTICAL_RESOURCE_DATASET":
                    buildConnectionDataForStatisticalResources(connectionData);
                    break;
                default:
                    $('#errorMsg').html(errorMsg.error.dataset.url.unsupportedResourceType);
                    break;
            }
        });
    });


    // Dataset
    function parseStatisticalResourceDatasetResponse(dataResponse, connectionData, table, doneCallback) {
        var tableData = [];
        var observations = dataResponse.data.observations.split(" | ");
        var total = 1;
        for (let i = 0; i < Object.keys(connectionData.dimensions).length; i++) {
            total = total * dataResponse.data.dimensions.dimension[i].representations.total;
        }
        if (table.tableInfo.id == "datasetData") {
            for (let i = 0; i < observations.length; i++) {
                var hash = {};
                var copyHash = {};
                if (!connectionData.showMeasureColumns) {
                    hash[connectionData.observationId] = observations[i];
                }
                var remaining = i;
                var subtotal = total;
                for (let j = 0; j < dataResponse.data.dimensions.total; j++) {
                    var totalDimension = dataResponse.data.dimensions.dimension[j].representations.total;
                    subtotal = Math.floor(subtotal / totalDimension);
                    let indDimension = Math.floor(remaining / subtotal);
                    remaining = remaining % subtotal;
                    if (connectionData.showMeasureColumns) {
                        if (connectionData.measureColumns.dimension == connectionData.dimensions[j].id) {
                            copyHash[connectionData.measureColumns.dimension + "_" + _.keyBy(dataResponse.data.dimensions.dimension[j].representations.representation, 'index')[indDimension].code] = observations[i];
                        }
                        else {
                            hash[connectionData.dimensions[j].id] = _.keyBy(dataResponse.data.dimensions.dimension[j].representations.representation, 'index')[indDimension].code;
                            copyHash[connectionData.dimensions[j].id] = _.keyBy(dataResponse.data.dimensions.dimension[j].representations.representation, 'index')[indDimension].code;
                        }
                    }
                    else {
                        hash[connectionData.dimensions[j].id] = _.keyBy(dataResponse.data.dimensions.dimension[j].representations.representation, 'index')[indDimension].code;
                    }
                    if (!connectionData.starModel) {
                        if (connectionData.recodeDates && connectionData.timeDimension == connectionData.dimensions[j].id) {
                            hash["Fecha"] = calculateDate(_.keyBy(dataResponse.data.dimensions.dimension[j].representations.representation, 'index')[indDimension].code);
                            ;
                        }
                        if (connectionData.labels) {
                            var dimension = _.keyBy(dataResponse.metadata.dimensions.dimension, "id")[connectionData.dimensions[j].id];
                            var dimensionValue = _.keyBy(dimension.dimensionValues.value, "id")[hash[connectionData.dimensions[j].id]];
                            var dimensionLabel = _.keyBy(dimensionValue.name.text, "lang");
                            if (connectionData.allLanguages) {
                                for (let k = 0; k < connectionData.languages.length; k++) {
                                    if (dimensionLabel[connectionData.languages[k]]) {
                                        hash["Etiqueta_" + dimension.id + "_" + connectionData.languages[k]] = dimensionLabel[connectionData.languages[k]].value;
                                    }
                                    else {
                                        hash["Etiqueta_" + dimension.id + "_" + connectionData.languages[k]] = '';
                                    }
                                }
                            }
                            else {
                                hash["Etiqueta_" + dimension.id] = dimensionLabel['es'].value;
                            }
                        }
                    }
                }
                if (connectionData.showMeasureColumns && table.tableInfo.id == "datasetData") {
                    var keyHash = _.values(hash).join(',');
                    if (tableData[keyHash]) {
                        _.extend(tableData[keyHash], copyHash);
                    }
                    else {
                        tableData[keyHash] = copyHash;
                    }
                }
                else {
                    tableData.push(hash);
                }
            }
        } else {
            var dimension = _.keyBy(dataResponse.metadata.dimensions.dimension, "id")[table.tableInfo.id];
            for (let i = 0; i < dimension.dimensionValues.total; i++) {
                var hash = {};
                hash[table.tableInfo.id] = dimension.dimensionValues.value[i].id;
                if (connectionData.recodeDates && connectionData.timeDimension == table.tableInfo.id) {
                    hash["Fecha"] = calculateDate(dimension.dimensionValues.value[i].id);
                }
                if (connectionData.labels) {
                    var dimensionLabels = _.keyBy(dimension.dimensionValues.value[i].name.text, "lang");
                    if (connectionData.allLanguages) {
                        for (let k = 0; k < connectionData.languages.length; k++) {
                            if (dimensionLabels[connectionData.languages[k]]) {
                                hash["Etiqueta_" + dimension.id + "_" + connectionData.languages[k]] = dimensionLabels[connectionData.languages[k]].value;
                            }
                            else {
                                hash["Etiqueta_" + dimension.id + "_" + connectionData.languages[k]] = '';
                            }
                        }
                    }
                    else {
                        hash["Etiqueta_" + dimension.id] = dimensionLabels['es'].value;
                    }
                }
                tableData.push(hash);
            }
        }
        table.appendRows(_.values(tableData));
        doneCallback();
    };

    function buildConnectionDataForStatisticalResources(connectionData: DatasetsConnectionData) {
        if (!isValidUrl(connectionData.url)) {
            $('#errorMsg').html(errorMsg.error.dataset.url.invalid);
        }

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
                    // FIXME revisar si esto no dara error y si puede ser un objeto
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
                };
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
    }

    // Dataset GPE
    function parseGPEDatasetResponse(dataResponse: GPE.Dataset, connectionData: DatasetsConnectionData, table, doneCallback) {
        var tableData = [];
        parseGPEDatasetResponseForDatasetData(table, dataResponse, connectionData, tableData);
        table.appendRows(_.values(tableData));
        doneCallback();
    };


    function parseGPEDatasetResponseForDatasetData(table: Tableau.Table, dataResponse: GPE.Dataset, connectionData: DatasetsConnectionData, tableData: any[]) {
        for (let i = 0; i < dataResponse.data.length; i++) {
            let hash = {};
            hash[connectionData.observationId] = parseFloat(dataResponse.data[i].Valor);
            dataResponse.data[i].dimCodes.forEach((dimCode, categoryIndex) => {
                hash[categoryIndex] = dimCode;
                if (connectionData.labels) {
                    const dimension = dataResponse.categories[categoryIndex];
                    const dimIndex = _.indexOf(dimension.codes, dimCode);
                    hash["Etiqueta_" + categoryIndex] = dimension.labels[dimIndex];
                }
            });

            tableData.push(hash);
        }
    }


    function buildConnectionDataForGPE(connectionData: DatasetsConnectionData) {
        if (!isValidUrl(connectionData.url)) {
            $('#errorMsg').html(errorMsg.error.dataset.url.invalid);
        }

        $('#errorMsg').html("");
        $.getJSON(connectionData.url, function (dataResponse: GPE.Dataset) {
            tableau.connectionName = tableau.connectionName + dataResponse.title;
            connectionData.name = dataResponse.title;
            connectionData.observationId = "Valor";
            connectionData.showMeasureColumns = false;

            var dimensions = {};
            dataResponse.categories.forEach((category, index) => {
                dimensions[index] = {
                    id: _.toString(index),
                    label: category.variable
                }
            });
            connectionData.dimensions = dimensions;

            tableau.connectionData = JSON.stringify(connectionData);
            tableau.submit();
        }).fail(function () {
            $("#errorMsg").html(errorMsg.error.submit);
        });
    }

    // Utils
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

    function isValidUrl(url) {
        url = url.toString();
        return url.match(".+") != null;
    }

})();

function calculateResourceType(url: string): DatasetsConnectionData["resourceType"] {
    if (url.indexOf("tabla.do") >= 0) {
        return "GPE_DATASET";
    } else {
        return "STATISTICAL_RESOURCE_DATASET";
    }
}