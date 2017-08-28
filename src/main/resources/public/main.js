(function () {
    var myConnector = tableau.makeConnector();
    var url;

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
        // https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson
        // http://estadisticas.arte-consultores.com/indicators/v1.0/indicators/PARO_REGISTADO/data
        var urlObj = JSON.parse(tableau.connectionData);
        $.getJSON(urlObj.url, function(resp) {
            var tableData = [];
    
            // Iterate over the JSON object

            //var geographical = _.invert(resp.dimension.GEOGRAPHICAL.representation.index);
            //var time = _.invert(resp.dimension.TIME.representation.index);
            //var measure = _.invert(resp.dimension.MEASURE.representation.index);
            for (var i = 0, len1 = resp.dimension.GEOGRAPHICAL.representation.size; i < len1; i++) {
                for (var j = 0, len2 = resp.dimension.TIME.representation.size; j < len2; j++) {
                    for (var k = 0, len3 = resp.dimension.MEASURE.representation.size; k < len3; k++) {
                        tableData.push({
                            "geographical": searchKey(resp.dimension.GEOGRAPHICAL.representation.index, i),
                            "time": searchKey(resp.dimension.TIME.representation.index, j),
                            "measure": searchKey(resp.dimension.MEASURE.representation.index, k),
                            "observation": resp.observation[i * len2 * len3 + j * len3 + k],
                        });
                    }
                }
            }
    
            table.appendRows(tableData);
            doneCallback();
        });
    };

    tableau.registerConnector(myConnector);

    function searchKey(hash, value) {
        for (var name in hash) {
            if (hash[name] == value) {
                return name;
            }
        }
    }

    $(document).ready(function () {
        $("#dataButton").click(function () {
            var urlObj = {
                url: $('#inputUrl').val().trim()
            };

            function isValidUrl(url) {
                url = url.toString();
                return url != undefined && url != null && url.length != 0;
            }

            if (isValidUrl(urlObj.url)) {
                tableau.connectionData = JSON.stringify(urlObj);
                tableau.connectionName = "ISTAC indicator data";
                tableau.submit();
            } else {
                $('#errorMsg').html("Se debe indicar la URL.");
            }
        });
    });
})();