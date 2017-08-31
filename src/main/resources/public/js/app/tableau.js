(function () {
    var myConnector = tableau.makeConnector();
    var urlIndicator;

    myConnector.getSchema = function (schemaCallback) {
        var cols = [
            { id : "geographical", columnRole : "dimension", dataType : tableau.dataTypeEnum.string },
            { id : "time", columnRole : "dimension", dataType : tableau.dataTypeEnum.string },
            { id : "measure", columnRole : "dimension", dataType : tableau.dataTypeEnum.string },
            { id : "observation", dataType : tableau.dataTypeEnum.float }
        ];

        var urlObj = JSON.parse(tableau.connectionData);
        if (urlObj.granularity) {
            cols.push({ id : "geographicalGranularity", columnRole : "dimension", dataType : tableau.dataTypeEnum.string});
            cols.push({ id : "timeGranularity", columnRole : "dimension", dataType : tableau.dataTypeEnum.string});
        }
        if (urlObj.labels) {
            cols.push({ id : "geographicalLabel", columnRole : "dimension", dataType : tableau.dataTypeEnum.string});
            cols.push({ id : "timeLabel", columnRole : "dimension", dataType: tableau.dataTypeEnum.string});
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
                    for (var k = 0, lengthMeasure = dataResponse.dimension.MEASURE.representation.size; k < lengthMeasure; k++) {
                        var hash = {};
                        hash.geographical = geographicalDimensions[i];
                        hash.time = timeDimensions[j];
                        hash.measure = measureDimensions[k];
                        hash.observation = dataResponse.observation[i * lengthTime * lengthMeasure + j * lengthMeasure + k];
                        if (urlObj.granularity) {
                            hash.geographicalGranularity = indexedGeographicalRepresentations[hash.geographical].granularityCode;
                            hash.timeGranularity = indexedTimeRepresentations[hash.time].granularityCode;
                        }
                        if (urlObj.labels) {
                            hash.geographicalLabel = indexedGeographicalRepresentations[hash.geographical].title.__default__;
                            hash.timeLabel = indexedTimeRepresentations[hash.time].title.__default__;
                        }
                        tableData.push(hash);
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
                    tableau.connectionName = "Indicador: ";
                    break;
                case 'indicator':
                    urlIndicator = $('#inputEndpointIndicator').val() + '/indicators/' + $('#selectIndicator').val() + '/data';
                    if ($('#selectIndicator').val() == null || $('#selectIndicator').val() == undefined || $('#selectIndicator').val().length == 0) {
                        urlIndicator = '';
                    }
                    tableau.connectionName = "Indicador: ";
                    break;
                case 'indicatorInstance':
                    urlIndicator = $('#inputEndpointIndicatorSystem').val() + '/indicatorsSystems/' + $('#selectIndicatorSystem').val() + '/indicatorsInstances/' +
                        $('#selectIndicatorInstance').val() + '/data';
                        if ($('#selectIndicatorInstance').val() == null || $('#selectIndicatorInstance').val() == undefined || $('#selectIndicatorInstance').val().length == 0) {
                            urlIndicator = '';
                        }
                        tableau.connectionName = "Instancia de indicador: ";
                    break;
            }
            var urlObj = {
                url: urlIndicator.trim(),
                granularity: $('#showGranularity').is(':checked'),
                labels: $('#showLabels').is(':checked')
            };

            function isValidUrl(url) {
                url = url.toString();
                return url.match(".+/data") != null;
            }

            if (isValidUrl(urlObj.url)) {
                $('#errorMsg').html("");
                tableau.connectionData = JSON.stringify(urlObj);
                $.getJSON(urlObj.url.substring(0, urlObj.url.indexOf('/data')), function(resp) {
                    tableau.connectionName = tableau.connectionName + resp.title.__default__;
                    tableau.submit();
                });
            } else {
                $('#errorMsg').html("La URL del indicador está incompleta o no es correcta");
            }
        });
    });
})();