(function () {
    var myConnector = tableau.makeConnector();
    var urlDataset;

    myConnector.getSchema = function (schemaCallback) {
        var urlObj = JSON.parse(tableau.connectionData);
        var cols = [];
        for (i = 0; i < Object.keys(urlObj.dimensions).length; i++) {
            if (urlObj.measureColumns && urlObj.dimensions[i].id == urlObj.measureColumns.dimension) {
                for (j = 0; j < urlObj.measureColumns.values.length; j++) {
                    cols.push({
                        id: urlObj.measureColumns.dimension + "_" + urlObj.measureColumns.values[j].id, alias: urlObj.measureColumns.values[j].label,
                        dataType: tableau.dataTypeEnum.float
                    });
                }
            } else {
                if (urlObj.recodeDates && urlObj.timeDimension == urlObj.dimensions[i].id) {
                    cols.push({ id: "Fecha", alias: "Fecha", columnRole: "dimension", dataType: tableau.dataTypeEnum.date });
                }
                cols.push({ id: urlObj.dimensions[i].id, alias: urlObj.dimensions[i].label, columnRole: "dimension", dataType: tableau.dataTypeEnum.string });

                if (urlObj.labels) {
                    cols.push({
                        id: "Etiqueta_" + urlObj.dimensions[i].id, alias: "Etiqueta " + urlObj.dimensions[i].label, columnRole: "dimension",
                        dataType: tableau.dataTypeEnum.string
                    });
                }
            }
        }

        if (!urlObj.measureColumns) {
            cols.push({ id: urlObj.observationId, alias: urlObj.name, dataType: tableau.dataTypeEnum.float });
        }

        var tableInfo = {
            id: "indicatorData",
            alias: tableau.connectionName,
            columns: cols
        };

        schemaCallback([tableInfo]);
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
            for (i = 0; i < Object.keys(urlObj.dimensions).length; i++) {
                total = total * dataResponse.data.dimensions.dimension[i].representations.total;
            }
            for (i = 0; i < observations.length; i++) {
                var hash = {};
                var copyHash = {};
                if (!urlObj.measureColumns) {
                    hash[urlObj.observationId] = observations[i];
                }
                var remaining = i;
                var subtotal = total;
                for (j = 0; j < dataResponse.data.dimensions.total; j++) {
                    var totalDimension = dataResponse.data.dimensions.dimension[j].representations.total;
                    subtotal = Math.floor(subtotal / totalDimension);
                    indDimension = Math.floor(remaining / subtotal);
                    remaining = remaining % subtotal;
                    if (urlObj.measureColumns) {
                        if (urlObj.measureColumns.dimension == urlObj.dimensions[j].id) {
                            copyHash[urlObj.measureColumns.dimension + "_" + _.keyBy(dataResponse.data.dimensions.dimension[j].representations.representation, 'index')[indDimension].code] = observations[i];
                        } else {
                            if (urlObj.recodeDates && urlObj.dimensions[j].id == urlObj.timeDimension) {
                                date = calculateDate(_.keyBy(dataResponse.data.dimensions.dimension[j].representations.representation, 'index')[indDimension].code);
                                hash["Fecha"] = date;
                                copyHash["Fecha"] = date;
                            }
                            hash[urlObj.dimensions[j].id] = _.keyBy(dataResponse.data.dimensions.dimension[j].representations.representation, 'index')[indDimension].code;
                            copyHash[urlObj.dimensions[j].id] = _.keyBy(dataResponse.data.dimensions.dimension[j].representations.representation, 'index')[indDimension].code;
                            if (urlObj.labels) {
                                representation = _.keyBy(dataResponse.metadata.dimensions.dimension[j].dimensionValues.value, 'id')[hash[urlObj.dimensions[j].id]];
                                hash["Etiqueta_" + urlObj.dimensions[j].id] = _.keyBy(representation.name.text, 'lang')['es'].value;
                                copyHash["Etiqueta_" + urlObj.dimensions[j].id] = _.keyBy(representation.name.text, 'lang')['es'].value;
                            }
                        }
                    } else {
                        if (urlObj.recodeDates && urlObj.dimensions[j].id == urlObj.timeDimension) {
                            date = calculateDate(_.keyBy(dataResponse.data.dimensions.dimension[j].representations.representation, 'index')[indDimension].code)
                            hash["Fecha"] = date;
                        }
                        hash[urlObj.dimensions[j].id] = _.keyBy(dataResponse.data.dimensions.dimension[j].representations.representation, 'index')[indDimension].code;
                        if (urlObj.labels) {
                            representation = _.keyBy(dataResponse.metadata.dimensions.dimension[j].dimensionValues.value, 'id')[hash[urlObj.dimensions[j].id]];
                            hash["Etiqueta_" + urlObj.dimensions[j].id] = _.keyBy(representation.name.text, 'lang')['es'].value;
                        }
                    }
                }
                if (urlObj.measureColumns) {
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
                    tableau.connectionName = text[language].dataset.name;
                    break;
                case 'operation':
                    urlDataset = $("#selectDataset").val() + "/~latest";
                    tableau.connectionName = text[language].dataset.name;
                    break;
            }
            var urlObj = {
                url: urlDataset.trim(),
                showMeasureColumns: $('#measureColumns').is(':checked'),
                labels: $('#showLabels').is(':checked'),
                recodeDates: $('#recodeDates').is(':checked')
            };

            function isValidUrl(url) {
                url = url.toString();
                return url.match(".+") != null;
            }

            if (isValidUrl(urlObj.url)) {
                $('#errorMsg').html("");
                urlObj.url = urlObj.url.replace("&fields=-metadata", "");
                if (urlObj.url.indexOf("?") != -1) {
                    if (urlObj.url.indexOf(".json") == -1) {
                        urlObj.url = urlObj.url.replace("?", ".json?");
                    }
                } else {
                    if (urlObj.url.indexOf(".json") == -1) {
                        urlObj.url = urlObj.url + ".json";
                    }
                }
                $.getJSON(urlObj.url, function (resp) {
                    tableau.connectionName = tableau.connectionName + _.keyBy(resp.name.text, 'lang')[language].value;
                    urlObj.name = _.keyBy(resp.name.text, 'lang')[language].value;
                    urlObj.observationId = resp.id;

                    if (urlObj.showMeasureColumns) {
                        var measureColumns = {};
                        var dimension = _.keyBy(resp.metadata.dimensions.dimension, 'type')['MEASURE_DIMENSION'];
                        measureColumns.dimension = dimension.id;
                        var values = [];
                        for (i = 0; i < dimension.dimensionValues.value.length; i++) {
                            values[i] = {
                                id: dimension.dimensionValues.value[i].id,
                                label: _.keyBy(dimension.dimensionValues.value[i].name.text, 'lang')['es'].value
                            };
                        }
                        measureColumns.values = values;
                        urlObj.measureColumns = measureColumns;
                    }

                    var dimensions = {};
                    for (i = 0; i < resp.metadata.dimensions.total; i++) {
                        dimensions[i] = {
                            id: resp.metadata.dimensions.dimension[i].id,
                            label: _.keyBy(resp.metadata.dimensions.dimension[i].name.text, 'lang')[language].value
                        }
                    }

                    if (urlObj.recodeDates) {
                        urlObj.timeDimension = _.keyBy(resp.metadata.dimensions.dimension, 'type')['TIME_DIMENSION'].id;
                    }

                    urlObj.dimensions = dimensions;
                    tableau.connectionData = JSON.stringify(urlObj);
                    tableau.submit();
                }).error(function () {
                    $("#errorMsg").html(errorMsg[language].error.submit);
                });
            } else {
                $('#errorMsg').html(errorMsg[language].error.dataset.url);
            }
        });
    });
})();