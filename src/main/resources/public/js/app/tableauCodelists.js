(function () {
    var myConnector = tableau.makeConnector();
    var urlIndicator;

    myConnector.getSchema = function (schemaCallback) {
        var cols = [
            { id : "code", columnRole : "dimension", dataType : tableau.dataTypeEnum.string },
            { id : "name", columnRole : "dimension", dataType : tableau.dataTypeEnum.string },
            { id : "parent", columnRole : "dimension", dataType : tableau.dataTypeEnum.string }
        ];

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

        promises.push($.getJSON(urlObj.url + '.json'));
        
        $.when.apply($, promises).then(function() {
            var tableData = [];
            var dataResponse = arguments[0];
            for (i = 0; i < dataResponse.code.length; i++) {
                tableData.push({
                    "code": dataResponse.code[i].id,
                    "name": _.keyBy(dataResponse.code[i].name.text, 'lang')['es'].value,
                    "parent": dataResponse.code[i].parent
                });
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
                url: urlIndicator.trim()
            };

            function isValidUrl(url) {
                url = url.toString();
                return url.match(".+/codes") != null;
            }

            if (isValidUrl(urlObj.url)) {
                $('#errorMsg').html("");
                tableau.connectionData = JSON.stringify(urlObj);
                $.getJSON(urlObj.url.substring(0, urlObj.url.indexOf('/codes')) + '.json', function(resp) {
                    tableau.connectionName = tableau.connectionName + _.keyBy(resp.shortName.text, 'lang')['es'].value;
                    tableau.submit();
                });
            } else {
                $('#errorMsg').html("La URL del indicador está incompleta o no es correcta");
            }
        });
    });
})();