enum ResourceType {
    GPE_DATASET = "GPE_DATASET",
    STATISTICAL_RESOURCE_DATASET = "STATISTICAL_RESOURCE_DATASET",
    JSON_STAT_DATASET = "JSON_STAT_DATASET",
}

const DEFAULT_RESOURCE_TYPE: ResourceType = ResourceType.STATISTICAL_RESOURCE_DATASET;
const schemas: Partial<{ [key in ResourceType]: {} }> = {};

(function () {
    var myConnector = tableau.makeConnector();
    var urlDataset: string;
    var number = 1;

    $.getJSON("schemas/json-stat-2.0.json", jsonStatSchema => {
        schemas.JSON_STAT_DATASET = jsonStatSchema;
        console.log("Schemas loaded");
    }).fail(() => {
        console.log("Could not access JSONStat schema");
    });

    myConnector.getSchema = function (schemaCallback: Function) {
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
                            dataType: tableau.dataTypeEnum.float,
                        });
                    }
                } else {
                    cols.push({ id: connectionData.dimensions[i].id, alias: connectionData.dimensions[i].label, columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
                    tables.push({
                        id: connectionData.dimensions[i].id,
                        alias: addNumber(number) + connectionData.dimensions[i].label,
                        columns: _buildColumns(connectionData, connectionData.dimensions[i], connectionData.languages),
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
                            dataType: tableau.dataTypeEnum.float,
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
            columns: cols,
        };
        tables.push(tableInfo);

        schemaCallback(tables);
    };

    myConnector.getData = function (table, doneCallback) {
        var connectionData: DatasetsConnectionData = JSON.parse(tableau.connectionData);
        $.getJSON(connectionData.url).then(dataResponse => {
            type ParseDatasetDispatcher = { [key in ResourceType]: (response, connectionData: DatasetsConnectionData, table, doneCallback) => void };
            const parseDatasetResponse: ParseDatasetDispatcher = {
                "GPE_DATASET": parseGPEDatasetResponse,
                "STATISTICAL_RESOURCE_DATASET": parseStatisticalResourceDatasetResponse,
                "JSON_STAT_DATASET": parseJsonStatDatasetResponse,
            }

            if (connectionData.resourceType in parseDatasetResponse) {
                parseDatasetResponse[connectionData.resourceType](dataResponse, connectionData, table, doneCallback);
            } else {
                $('#errorMsg').html(errorMsg.error.dataset.url.unsupportedResourceType);
            }

        }).fail(doneCallback);
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

            calculateResourceType(urlDataset.trim()).then(resourceType => {
                console.log("Resource type is " + resourceType);
                let connectionData: DatasetsConnectionData = {
                    url: urlDataset.trim(),
                    resourceType: resourceType,
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
                    dimensions: {},
                };

                type BuildConnectionDispatcher = { [key in ResourceType]: (arg: DatasetsConnectionData) => void };
                const buildConnectionData: BuildConnectionDispatcher = {
                    "GPE_DATASET": buildConnectionDataForGPE,
                    "STATISTICAL_RESOURCE_DATASET": buildConnectionDataForStatisticalResources,
                    "JSON_STAT_DATASET": buildConnectionDataForJsonStat,
                }

                if (connectionData.resourceType in buildConnectionData) {
                    buildConnectionData[connectionData.resourceType](connectionData);
                } else {
                    $('#errorMsg').html(errorMsg.error.dataset.url.unsupportedResourceType);
                }

            }).fail(err => console.log(err));
        });
    });

    /**
     * @param observation string that contains a value or is empty if no value is present
     * @return null if the observation is empty, otherwise the same value
     */
    function parseObs(observation: string) {
        return observation || null;
    }


    // Dataset
    function parseStatisticalResourceDatasetResponse(dataResponse, connectionData, table, doneCallback) {
        let tableData = [];
        let observations = dataResponse.data.observations.split(" | ");
        let total = 1;
        for (let i = 0; i < Object.keys(connectionData.dimensions).length; i++) {
            total = total * dataResponse.data.dimensions.dimension[i].representations.total;
        }
        if (table.tableInfo.id == "datasetData") {
            for (let i = 0; i < observations.length; i++) {
                var hash = {};
                var copyHash = {};
                if (!connectionData.showMeasureColumns) {
                    hash[connectionData.observationId] = parseObs(observations[i]);
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
                            copyHash[connectionData.measureColumns.dimension + "_" + _.keyBy(dataResponse.data.dimensions.dimension[j].representations.representation, 'index')[indDimension].code] = parseObs(observations[i]);
                        } else {
                            hash[connectionData.dimensions[j].id] = _.keyBy(dataResponse.data.dimensions.dimension[j].representations.representation, 'index')[indDimension].code;
                            copyHash[connectionData.dimensions[j].id] = _.keyBy(dataResponse.data.dimensions.dimension[j].representations.representation, 'index')[indDimension].code;
                        }
                    } else {
                        hash[connectionData.dimensions[j].id] = _.keyBy(dataResponse.data.dimensions.dimension[j].representations.representation, 'index')[indDimension].code;
                    }
                    if (!connectionData.starModel) {
                        if (connectionData.recodeDates && connectionData.timeDimension == connectionData.dimensions[j].id) {
                            hash["Fecha"] = calculateDateSdmx(_.keyBy(dataResponse.data.dimensions.dimension[j].representations.representation, 'index')[indDimension].code);
                            copyHash["Fecha"] = calculateDateSdmx(_.keyBy(dataResponse.data.dimensions.dimension[j].representations.representation, 'index')[indDimension].code);
                        }
                        if (connectionData.labels) {
                            var dimension = _.keyBy(dataResponse.metadata.dimensions.dimension, "id")[connectionData.dimensions[j].id];
                            let dimensionValue;
                            let dimensionLabel;
                            if (dimension.type === "MEASURE_DIMENSION") {
                                dimensionValue = _.keyBy(dimension.dimensionValues.value, "id")[_.keyBy(dataResponse.data.dimensions.dimension[j].representations.representation, 'index')[indDimension].code];
                                dimensionLabel = _.keyBy(dimensionValue.name.text, "lang");
                            } else {
                                dimensionValue = _.keyBy(dimension.dimensionValues.value, "id")[hash[connectionData.dimensions[j].id]];
                                dimensionLabel = _.keyBy(dimensionValue.name.text, "lang");
                            }
                            if (connectionData.allLanguages) {
                                for (let k = 0; k < connectionData.languages.length; k++) {
                                    if (dimensionLabel[connectionData.languages[k]]) {
                                        copyHash["Etiqueta_" + dimension.id + "_" + connectionData.languages[k]] = dimensionLabel[connectionData.languages[k]].value;
                                    } else {
                                        copyHash["Etiqueta_" + dimension.id + "_" + connectionData.languages[k]] = '';
                                    }
                                }
                            } else {
                                copyHash["Etiqueta_" + dimension.id] = dimensionLabel['es'].value;
                            }
                        }
                    }
                }
                if (connectionData.showMeasureColumns && table.tableInfo.id == "datasetData") {
                    var index = _.findIndex(tableData, hash);
                    if (index != -1) {
                        _.extend(tableData[index], copyHash);
                    }
                    else {
                        tableData.push(copyHash);
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
                if (connectionData.recodeDates && connectionData.timeDimension == table.tableInfo.id) {
                    hash["Fecha"] = calculateDateSdmx(dimension.dimensionValues.value[i].id);
                }
                if (connectionData.labels) {
                    var dimensionLabels = _.keyBy(dimension.dimensionValues.value[i].name.text, "lang");
                    if (connectionData.allLanguages) {
                        for (let k = 0; k < connectionData.languages.length; k++) {
                            if (dimensionLabels[connectionData.languages[k]]) {
                                hash["Etiqueta_" + dimension.id + "_" + connectionData.languages[k]] = dimensionLabels[connectionData.languages[k]].value;
                            } else {
                                hash["Etiqueta_" + dimension.id + "_" + connectionData.languages[k]] = '';
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
    }

    function parseJsonStatDatasetResponse(dataResponse: JsonStat.Dataset, connectionData: DatasetsConnectionData, tableauTable, doneCallback) {
        const dataset = JSONstat(dataResponse).Dataset(0);
        const table = dataset.toTable({ content: "id" });
        const columnTitles = table.shift();
        const valueIndex = columnTitles.indexOf("Value")

        const tableData = [];
        for (let rowIndex = 0; rowIndex < table.length; rowIndex++) {
            let hash = {};
            let row = table[rowIndex];

            hash[connectionData.observationId] = parseFloat(table[rowIndex][valueIndex]); // TODO: are all values numeric? what if not?
            for (let columnIndex = 0; columnIndex < row.length && columnIndex !== valueIndex; columnIndex++) {
                hash[columnIndex] = row[columnIndex];
                if (connectionData.labels) {
                    hash["Etiqueta_" + columnIndex] = dataset.Dimension(columnIndex).Category(row[columnIndex]).label;
                }
                if (connectionData.recodeDates && connectionData.timeDimension == columnIndex.toString()) {
                    hash["Fecha"] = calculateDatePx(row[columnIndex]);
                }
            }

            tableData.push(hash);
        }

        tableauTable.appendRows(_.values(tableData));
        doneCallback();
    }

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
            const language = getLanguage();
            tableau.connectionName = tableau.connectionName + _.keyBy(resp.name.text, 'lang')[language].value;
            connectionData.name = _.keyBy(resp.name.text, 'lang')[language].value;
            connectionData.observationId = resp.id;
            if (connectionData.showMeasureColumns) {
                var measureColumns: DatasetMeasureColumn = {};
                var dimension = _.keyBy(resp.metadata.dimensions.dimension, 'type')['MEASURE_DIMENSION'];
                if (dimension) {
                    measureColumns.dimension = dimension.id;
                    // IDEA revisar si esto no dara error y si puede ser un objeto
                    var values = [];
                    for (let i = 0; i < dimension.dimensionValues.value.length; i++) {
                        values[i] = {
                            id: dimension.dimensionValues.value[i].id,
                            label: _.keyBy(dimension.dimensionValues.value[i].name.text, 'lang')['es'].value,
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
                    label: _.keyBy(resp.metadata.dimensions.dimension[i].name.text, 'lang')[language].value,
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
    }


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
                if (connectionData.recodeDates && connectionData.timeDimension == categoryIndex.toString()) {
                    hash["Fecha"] = calculateDatePx(dimCode);
                }
            });

            tableData.push(hash);
        }
    }

    function buildConnectionDataForJsonStat(connectionData: DatasetsConnectionData) {
        $.getJSON(connectionData.url, function (dataResponse: JsonStat.Dataset) {
            if (dataResponse.class !== "dataset") {
                // TODO: For now, only datasets will be allowed
                const errMessage = "JsonStat type is not 'dataset'. Type: " + dataResponse.class;
                $("#errorMsg").html(errMessage);
                console.log(errMessage)
                return;
            }

            tableau.connectionName = tableau.connectionName + dataResponse.label;

            connectionData.name = dataResponse.label;
            connectionData.observationId = "Valor";
            connectionData.showMeasureColumns = false;

            connectionData.dimensions = {};
            dataResponse.id.forEach((category, index) => {
                connectionData.dimensions[index] = {
                    id: _.toString(index),
                    label: category,
                }
            });

            if (connectionData.recodeDates) {
                if (dataResponse.role.time && dataResponse.role.time.length > 0) {
                    const results: any = _.filter(_.values(connectionData.dimensions), { label: dataResponse.role.time[0] });
                    connectionData.timeDimension = results[0].id;
                    if (dataResponse.role.time.length > 1) {
                        console.warn(`Only the first time dimension is being considered in this dataset. ${dataResponse.role.time.length} dimensions were detected.`)
                    }
                } else {
                    connectionData.recodeDates = false;
                }
            }

            tableau.connectionData = JSON.stringify(connectionData);
            tableau.submit();
        }).fail(function () {
            $("#errorMsg").html(errorMsg.error.submit);
        });
    }


    function buildConnectionDataForGPE(connectionData: DatasetsConnectionData) {
        if (!isValidUrl(connectionData.url)) {
            $('#errorMsg').html(errorMsg.error.dataset.url.invalid);
        }

        transformGPEUrlToProxyUrl(connectionData.url).then(url => {
            connectionData.url = url;

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
                        label: category.variable,
                    }
                });
                connectionData.dimensions = dimensions;

                if (connectionData.recodeDates) {
                    if (dataResponse.temporals && dataResponse.temporals.length > 0) {
                        connectionData.timeDimension = _.findIndex(dataResponse.categories, { variable: dataResponse.temporals[0] }).toString();
                    } else {
                        connectionData.recodeDates = false;
                    }
                }

                tableau.connectionData = JSON.stringify(connectionData);
                tableau.submit();
            }).fail(function () {
                $("#errorMsg").html(errorMsg.error.submit);
            });
        });
    }

    // Utils
    function _buildColumns(connectionData, dimension, languages) {
        var returnCols = [];
        returnCols.push({ id: dimension.id, alias: dimension.label, columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
        if (connectionData.labels) {
            if (!connectionData.allLanguages) {
                returnCols.push({ id: "Etiqueta_" + dimension.id, alias: dimension.label + " (etiqueta)", columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
            } else {
                for (var k = 0; k < connectionData.languages.length; k++) {
                    returnCols.push({
                        id: "Etiqueta_" + dimension.id + "_" + languages[k],
                        alias: dimension.label + "_" + languages[k],
                        columnRole: "dimension",
                        dataType: tableau.dataTypeEnum.string,
                    });
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

function getJsonSchemaValidator() {
    const deferred = $.Deferred();
    const ajv = new Ajv({
        schemaId: 'id', // draft-04 support requirement
        allErrors: true,
        jsonPointers: true,
        meta: false,
    });

    $.getJSON("schemas/json-stat-meta-draft-04.json").then(metaSchema => {
        ajv.addMetaSchema(metaSchema);
        ajv._opts.defaultMeta = metaSchema.id;
        deferred.resolve(ajv);
        console.log("Schema validator ready");
    });

    return deferred.promise();
}

function calculateResourceType(url: string): JQuery.Promise<ResourceType> {
    const $loaderUrl = $("#loaderUrl");
    $loaderUrl.show();

    if (url.indexOf("tabla.do") >= 0) {
        // Directly resolve to GPE_DATASET in case the URL have the specified pattern
        return $.Deferred().resolve(ResourceType.GPE_DATASET).promise();
    }

    return $.getJSON(url).then(data => {
        hideErrorMessage();
        // Try to match the data against a schema. If successfull, return the resource type
        // that matched the schema, otherwise the default one
        return getResourceTypeByMatchingJsonSchema(data);
    }).then(schema => {
        $loaderUrl.hide();
        return schema || DEFAULT_RESOURCE_TYPE;
    }).fail((jqXHR, textStatus, errorThrown) => {
        if (url.trim().length === 0) {
            // don't show error if there's no text in the url field
            hideErrorMessage();
        } else {
            let errorMessage = errorMsg.error.request;
            if (errorThrown) {
                errorMessage += ` (${errorThrown})`;
            }
            showErrorMessage(errorMessage);
        }
        $loaderUrl.hide();
    }).promise();
}

/**
 * Transforms something like (A) http://www.gobiernodecanarias.org/istac/jaxi-istac/tabla.do?accion=jsonMtd&uuidConsulta=d28e8036-16c8-44f7-91a8-1cc46738e0c8
 * onto something like (B) https://www.gobiernodecanarias.org/aplicaciones/appsistac/jaxi-istac/tabla.do?accion=jsonMtd&uuidConsulta=d28e8036-16c8-44f7-91a8-1cc46738e0c8
 *
 * This is needed because CORS. The request to (A) transforms into (B), which acts as a proxy so CORS is avoided.
 */
function transformGPEUrlToProxyUrl(gpeUrl: string) {
    return getMetadataValue(properties.endpoint.complementosApps.metadataKey).then(url => url + "/" + gpeUrl.substring(gpeUrl.indexOf("jaxi-istac")));
}

/**
 * If the json data matchs a defined json schema, then return the resource type assigned to that schema.
 * If no schema matchs, return null.
 */
function getResourceTypeByMatchingJsonSchema(data: any): JQuery.Promise<ResourceType | null> {
    return getJsonSchemaValidator().then(ajv => {
        for (const resourceType in schemas) {
            if (schemas.hasOwnProperty(resourceType) && ajv.validate(schemas[resourceType], data)) {
                return resourceType as ResourceType;
            }
        }
        return null;
    }).promise();
}

function hideErrorMessage() {
    $('#errorMsg').hide();
}

function showErrorMessage(errorMessage?: string) {
    $('#errorMsg').html(errorMessage).show();
}
