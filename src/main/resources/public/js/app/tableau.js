(function () {
    var myConnector = tableau.makeConnector();
    var urlIndicator;

    myConnector.getSchema = function (schemaCallback) {
        var cols = [
            { id : "geographical", columnRole: "dimension", dataType : tableau.dataTypeEnum.string },
            { id : "time", columnRole: "dimension", dataType : tableau.dataTypeEnum.string },
            { id : "measure", columnRole: "dimension", dataType : tableau.dataTypeEnum.string },
            { id : "observation", dataType : tableau.dataTypeEnum.float }
        ];
    
        var tableInfo = {
            id : "indicatorData",
            alias : "Datos del indicador",
            columns : cols
        };
    
        schemaCallback([tableInfo]);
    };

    myConnector.getData = function(table, doneCallback) {
        var urlObj = JSON.parse(tableau.connectionData);
        $.getJSON(urlObj.url, function(resp) {
            var tableData = [];
    
            var geographicalDimensions = _.invert(resp.dimension.GEOGRAPHICAL.representation.index);
            var timeDimensions = _.invert(resp.dimension.TIME.representation.index);
            var measureDimensions = _.invert(resp.dimension.MEASURE.representation.index);
            for (var i = 0, lengthGeographical = resp.dimension.GEOGRAPHICAL.representation.size; i < lengthGeographical; i++) {
                for (var j = 0, lengthTime = resp.dimension.TIME.representation.size; j < lengthTime; j++) {
                    for (var k = 0, lengthMeasure = resp.dimension.MEASURE.representation.size; k < lengthMeasure; k++) {
                        tableData.push({
                            "geographical": geographicalDimensions[i],
                            "time": timeDimensions[j],
                            "measure": measureDimensions[k],
                            "observation": resp.observation[i * lengthTime * lengthMeasure + j * lengthMeasure + k],
                        });
                    }
                }
            }
    
            table.appendRows(tableData);
            doneCallback();
        });
    };

    tableau.registerConnector(myConnector);

    $(document).ready(function () {
        $("#dataButton").click(function () {
            switch($('input[name="datatype"]:checked').val()) {
                case 'url':
                    urlIndicator = $('#inputUrl').val();
                    break;
                case 'indicator':
                    urlIndicator = $('#inputEndpointIndicator').val() + '/indicators/' + $('#selectIndicator').val() + '/data';
                    if ($('#selectIndicator').val() == null || $('#selectIndicator').val() == undefined || $('#selectIndicator').val().length == 0) {
                        urlIndicator = '';
                    }
                    break;
                case 'indicatorInstance':
                    urlIndicator = $('#inputEndpointIndicatorSystem').val() + '/indicatorsSystems/' + $('#selectIndicatorSystem').val() + '/indicatorsInstances/' +
                        $('#selectIndicatorInstance').val() + '/data';
                        if ($('#selectIndicatorInstance').val() == null || $('#selectIndicatorInstance').val() == undefined || $('#selectIndicatorInstance').val().length == 0) {
                            urlIndicator = '';
                        }
                    break;
            }
            var urlObj = {
                url: urlIndicator.trim()
            };

            function isValidUrl(url) {
                url = url.toString();
                return url != undefined && url != null && url.length != 0;
            }

            if (isValidUrl(urlObj.url)) {
                $('#errorMsg').html("");
                tableau.connectionData = JSON.stringify(urlObj);
                tableau.connectionName = "ISTAC indicator data";
                tableau.submit();
            } else {
                $('#errorMsg').html("La URL del indicador está incompleta o no es correcta");
            }
        });
    });
})();