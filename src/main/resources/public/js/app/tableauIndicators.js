(function () {
    var myConnector = tableau.makeConnector();
    var urlIndicator;

    myConnector.getSchema = function (schemaCallback) {
        var urlObj = JSON.parse(tableau.connectionData);
        
        var cols = [];

        if (urlObj.showMeasureColumns) {
            for (i = 0; i < urlObj.measureColumns.length; i++) {
                cols.push({ id : "Medida_" + urlObj.measureColumns[i], columnRole : "dimension", dataType : tableau.dataTypeEnum.string })
            }
        } else {
            cols.push({ id : "Codigo_medida", columnRole : "dimension", dataType : tableau.dataTypeEnum.string });
        }

        cols.push({ id : "Codigo_geografico", columnRole : "dimension", dataType : tableau.dataTypeEnum.string });
        if (urlObj.granularity) {
            cols.push({ id : "Granularidad_geografica", columnRole : "dimension", dataType : tableau.dataTypeEnum.string});
        }
        if (urlObj.labels) {
            if (!urlObj.allLanguages) {
                cols.push({ id : "Etiqueta_geografica", columnRole : "dimension", dataType : tableau.dataTypeEnum.string});
            } else {
                for (i = 0; i < urlObj.geographicalLanguages.length; i++) {
                    cols.push({ id : "Etiqueta_geografica_" + urlObj.geographicalLanguages[i], columnRole : "dimension", dataType : tableau.dataTypeEnum.string});
                }
            }
        }

        cols.push({ id : "Codigo_temporal", columnRole : "dimension", dataType : tableau.dataTypeEnum.string });
        if (urlObj.granularity) {
            cols.push({ id : "Granularidad_temporal", columnRole : "dimension", dataType : tableau.dataTypeEnum.string});
        }
        if (urlObj.labels) {
            if (!urlObj.allLanguages) {
                cols.push({ id : "Etiqueta_temporal", columnRole : "dimension", dataType: tableau.dataTypeEnum.string});
            } else {
                for (i = 0; i < urlObj.timeLanguages.length; i++) {
                    cols.push({ id : "Etiqueta_temporal_" + urlObj.timeLanguages[i], columnRole : "dimension", dataType: tableau.dataTypeEnum.string});
                }
            }
        }
        if (!urlObj.showMeasureColumns) {
            cols.push({ id : urlObj.observationId, alias: urlObj.name, dataType : tableau.dataTypeEnum.float });
        }

        var tableInfo = {
            id : "indicatorData",
            alias : tableau.connectionName,
            columns : cols
        };
    
        schemaCallback([tableInfo]);
    };

    myConnector.getData = function(table, doneCallback) {
        var urlObj = JSON.parse(tableau.connectionData);
        var promises = [];

        if (urlObj.granularity || urlObj.labels) {
            promises.push($.getJSON(urlObj.url.substring(0, urlObj.url.indexOf('/data'))));
        }
        promises.push($.getJSON(urlObj.url));
        
        $.when.apply($, promises).then(function() {
            var indexArguments = 0;
            if (urlObj.granularity || urlObj.labels) {
                var dimensions = arguments[indexArguments][0].dimension;
                
                var indexedGeographicalRepresentations = _.keyBy(dimensions.GEOGRAPHICAL.representation, 'code');
                var indexedTimeRepresentations = _.keyBy(dimensions.TIME.representation, 'code');

                indexArguments++;
            }
            var tableData = [];
            
            var dataResponse;
            if (indexArguments != 0) {
                dataResponse = arguments[indexArguments][0];
            } else {
                dataResponse = arguments[0];
            }
            var geographicalDimensions = _.invert(dataResponse.dimension.GEOGRAPHICAL.representation.index);
            var timeDimensions = _.invert(dataResponse.dimension.TIME.representation.index);
            var measureDimensions = _.invert(dataResponse.dimension.MEASURE.representation.index);
            for (var i = 0, lengthGeographical = dataResponse.dimension.GEOGRAPHICAL.representation.size; i < lengthGeographical; i++) {
                for (var j = 0, lengthTime = dataResponse.dimension.TIME.representation.size; j < lengthTime; j++) {
                    if (urlObj.showMeasureColumns) {
                        var hash = {};
                        hash.Codigo_geografico = geographicalDimensions[i];
                        hash.Codigo_temporal = timeDimensions[j];
                        for (var k = 0, lengthMeasure = dataResponse.dimension.MEASURE.representation.size; k < lengthMeasure; k++) {
                            hash['Medida_' + measureDimensions[k]] = dataResponse.observation[i * lengthTime * lengthMeasure + j * lengthMeasure + k];
                        }
                        if (urlObj.granularity) {
                            hash.Granularidad_geografica = indexedGeographicalRepresentations[hash.Codigo_geografico].granularityCode;
                            hash.Granularidad_temporal = indexedTimeRepresentations[hash.Codigo_temporal].granularityCode;
                        }
                        if (urlObj.labels) {
                            if (!urlObj.allLanguages) {
                                hash.Etiqueta_geografica = indexedGeographicalRepresentations[hash.Codigo_geografico].title.__default__;
                                hash.Etiqueta_temporal = indexedTimeRepresentations[hash.Codigo_temporal].title.__default__;
                            } else {
                                for (l = 0; l < urlObj.geographicalLanguages.length; l++) {
                                    hash['Etiqueta_geografica_' + urlObj.geographicalLanguages[l]] = indexedGeographicalRepresentations[hash.Codigo_geografico].title[urlObj.geographicalLanguages[l]];
                                }
                                for (l = 0; l < urlObj.timeLanguages.length; l++) {
                                    hash['Etiqueta_temporal_' + urlObj.timeLanguages[l]] = indexedTimeRepresentations[hash.Codigo_temporal].title[urlObj.timeLanguages[l]];
                                }
                            }
                        }
                        tableData.push(hash);
                    } else {
                        for (var k = 0, lengthMeasure = dataResponse.dimension.MEASURE.representation.size; k < lengthMeasure; k++) {
                            var hash = {};
                            hash.Codigo_geografico = geographicalDimensions[i];
                            hash.Codigo_temporal = timeDimensions[j];
                            hash.Codigo_medida = measureDimensions[k];
                            hash[urlObj.observationId] = dataResponse.observation[i * lengthTime * lengthMeasure + j * lengthMeasure + k];
                            if (urlObj.granularity) {
                                hash.Granularidad_geografica = indexedGeographicalRepresentations[hash.Codigo_geografico].granularityCode;
                                hash.Granularidad_temporal = indexedTimeRepresentations[hash.Codigo_temporal].granularityCode;
                            }
                            if (urlObj.labels) {
                                if (!urlObj.allLanguages) {
                                    hash.Etiqueta_geografica = indexedGeographicalRepresentations[hash.Codigo_geografico].title.__default__;
                                    hash.Etiqueta_temporal = indexedTimeRepresentations[hash.Codigo_temporal].title.__default__;
                                } else {
                                    for (l = 0; l < urlObj.geographicalLanguages.length; l++) {
                                        hash['Etiqueta_geografica_' + urlObj.geographicalLanguages[l]] = indexedGeographicalRepresentations[hash.Codigo_geografico].title[urlObj.geographicalLanguages[l]];
                                    }
                                    for (l = 0; l < urlObj.timeLanguages.length; l++) {
                                        hash['Etiqueta_temporal_' + urlObj.timeLanguages[l]] = indexedTimeRepresentations[hash.Codigo_temporal].title[urlObj.timeLanguages[l]];
                                    }
                                }
                            }
                            tableData.push(hash);
                        }
                    }
                }
            }
    
            table.appendRows(tableData);
            doneCallback();
        }, function() {
            doneCallback();
        })
    };

    tableau.registerConnector(myConnector);

    $(document).ready(function () {
        $("#dataButton").click(function () {
            switch($('input[name="datatype"]:checked').val()) {
                case 'url':
                    urlIndicator = $('#inputUrl').val();
                    tableau.connectionName = text['es'].indicator.name;
                    break;
                case 'indicator':
                    var endpoint = document.getElementById("inputEndpointIndicator").value;
                    if (endpoint[endpoint.length - 1] == "/") {
                        endpoint = endpoint.substring(0, endpoint.lastIndexOf("/"));
                    }
                    urlIndicator = endpoint + '/indicators/' + $('#selectIndicator').val() + '/data';
                    if ($('#selectIndicator').val() == null || $('#selectIndicator').val() == undefined || $('#selectIndicator').val().length == 0) {
                        urlIndicator = '';
                    }
                    tableau.connectionName = text['es'].indicator.name;
                    break;
                case 'indicatorInstance':
                    var endpoint = document.getElementById("inputEndpointIndicatorSystem").value;
                    if (endpoint[endpoint.length - 1] == "/") {
                        endpoint = endpoint.substring(0, endpoint.lastIndexOf("/"));
                    }
                    urlIndicator = endpoint + '/indicatorsSystems/' + $('#selectIndicatorSystem').val() + '/indicatorsInstances/' +
                        $('#selectIndicatorInstance').val() + '/data';
                        if ($('#selectIndicatorInstance').val() == null || $('#selectIndicatorInstance').val() == undefined || $('#selectIndicatorInstance').val().length == 0) {
                            urlIndicator = '';
                        }
                        tableau.connectionName = text['es'].indicator.instance;
                    break;
            }
            var urlObj = {
                url: urlIndicator.trim(),
                granularity: $('#showGranularity').is(':checked'),
                labels: $('#showLabels').is(':checked'),
                allLanguages: $('#allLanguages').is(':checked'),
                showMeasureColumns: $('#measureColumns').is(':checked')
            };

            function isValidUrl(url) {
                url = url.toString();
                return url.match(".+/data$") != null;
            }

            function removeAccents(string) {
                string = _.replace(string, new RegExp("á", "g"), "a");
                string = _.replace(string, new RegExp("Á", "g"), "A");
                string = _.replace(string, new RegExp("é", "g"), "e");
                string = _.replace(string, new RegExp("É", "g"), "E");
                string = _.replace(string, new RegExp("í", "g"), "i");
                string = _.replace(string, new RegExp("Í", "g"), "I");
                string = _.replace(string, new RegExp("ó", "g"), "o");
                string = _.replace(string, new RegExp("Ó", "g"), "O");
                string = _.replace(string, new RegExp("ú", "g"), "u");
                string = _.replace(string, new RegExp("Ú", "g"), "U");
                return string;
            }

            if (isValidUrl(urlObj.url)) {
                $('#errorMsg').html("");
                $.getJSON(urlObj.url.substring(0, urlObj.url.indexOf('/data')), function(resp) {
                    urlObj.name = resp.title.__default__;
                    // Tableau no acepta espacios en los nombres de las columnas, por eso se reemplazan por _
                    urlObj.observationId = removeAccents(_.replace(urlObj.name, new RegExp(" ", "g"), "_"));
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
                            measureColumns[i] = resp.dimension.MEASURE.representation[i].code;
                        }
                        urlObj.measureColumns = measureColumns;
                    }

                    tableau.connectionData = JSON.stringify(urlObj);
                    tableau.submit();
                }).error(function() {
                    $("#errorMsg").html(errorMsg['es'].error.submit);
                });
            } else {
                $('#errorMsg').html(errorMsg['es'].error.indicator.url);
            }
        });
    });
})();