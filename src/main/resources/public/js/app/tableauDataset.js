(function () {
    var myConnector = tableau.makeConnector();
    var urlDataset;

    myConnector.getSchema = function (schemaCallback) {
        var urlObj = JSON.parse(tableau.connectionData);
        var cols = [
            { id : urlObj.observationId, alias: urlObj.name, dataType : tableau.dataTypeEnum.float }
        ];
        for (i = 0; i < Object.keys(urlObj.dimensions).length; i++) {
            cols.push({ id : urlObj.dimensions[i].id, alias: urlObj.dimensions[i].label, columnRole : "dimension", dataType : tableau.dataTypeEnum.string })
        }

        var tableInfo = {
            id : "indicatorData",
            alias : tableau.connectionName,
            columns : _.sortBy(cols, 'id')
        };
    
        schemaCallback([tableInfo]);
    };

    myConnector.getData = function(table, doneCallback) {
        var urlObj = JSON.parse(tableau.connectionData);
        var promises = [];
        
        promises.push($.getJSON(urlObj.url));
        
        $.when.apply($, promises).then(function() {
            var tableData = [];
            var dataResponse = arguments[0];
            var observations = dataResponse.data.observations.split(" | ");
            var total = 1;
            for (i = 0; i < Object.keys(urlObj.dimensions).length; i++) {
                total = total * dataResponse.data.dimensions.dimension[i].representations.total;
            }
            for ( i = 0; i < observations.length; i++) {
                var hash = {};
                hash[urlObj.observationId] = observations[i];
                var remaining = i;
                var subtotal = total;
                for (j = 0; j < dataResponse.data.dimensions.total; j++) {
                    var totalDimension = dataResponse.data.dimensions.dimension[j].representations.total;
                    subtotal = Math.floor(subtotal / totalDimension);
                    indDimension = Math.floor(remaining / subtotal);
                    remaining = remaining % subtotal;
                    hash[urlObj.dimensions[j].id] = _.keyBy(dataResponse.data.dimensions.dimension[j].representations.representation, 'index')[indDimension].code;
                }
                tableData.push(hash);
            }
            
            table.appendRows(tableData);
            doneCallback();
        }, function() {
            $("#errorMsg").html("La url indicada no existe");
            doneCallback();
        })
    };

    tableau.registerConnector(myConnector);

    $(document).ready(function () {
        $("#dataButton").click(function () {
            switch($('input[name="datatype"]:checked').val()) {
                case 'url':
                    urlDataset = $('#inputUrl').val();
                    tableau.connectionName = "Cubo: ";
                    break;
                case 'variableFamily':
                    urlDataset = $('#selectCodelist').val() + '/codes';
                    if ($('#selectCodelist').val() == null || $('#selectCodelist').val() == undefined || $('#selectCodelist').val().length == 0) {
                        urlDataset = '';
                    }
                    tableau.connectionName = "Clasificación: ";
                    break;
            }
            var urlObj = {
                url: urlDataset.trim()
            };

            function isValidUrl(url) {
                url = url.toString();
                return url.match(".+") != null;
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
                string = _.replace(string, new RegExp("[^a-zA-Z0-9_]", "g"), "");
                return string;
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
                $.getJSON(urlObj.url, function(resp) {
                    tableau.connectionName = tableau.connectionName + _.keyBy(resp.name.text, 'lang')['es'].value;
                    urlObj.name = _.keyBy(resp.name.text, 'lang')['es'].value;
                    urlObj.observationId = removeAccents(_.replace(urlObj.name, new RegExp(" ", "g"), "_"));
                    var dimensions = {};
                    for (i = 0; i < resp.metadata.dimensions.total; i++) {
                        dimensions[i] = {
                            id: resp.metadata.dimensions.dimension[i].id, 
                            label: _.keyBy(resp.metadata.dimensions.dimension[i].name.text, 'lang')['es'].value
                        }
                    }
                    urlObj.dimensions = dimensions;
                    tableau.connectionData = JSON.stringify(urlObj);
                    tableau.submit();
                });
            } else {
                $('#errorMsg').html("La URL del indicador está incompleta o no es correcta");
            }
        });
    });
})();