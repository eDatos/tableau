(function () {
    var myConnector = tableau.makeConnector();
    var urlCodelist;

    myConnector.getSchema = function (schemaCallback) {
        var cols = [
            { id : "Codigo", columnRole : "dimension", dataType : tableau.dataTypeEnum.string },
            { id : "Nombre", columnRole : "dimension", dataType : tableau.dataTypeEnum.string },
            { id : "Padre", columnRole : "dimension", dataType : tableau.dataTypeEnum.string }
        ];

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
            for (i = 0; i < dataResponse.code.length; i++) {
                tableData.push({
                    "Codigo": dataResponse.code[i].id,
                    "Nombre": _.keyBy(dataResponse.code[i].name.text, 'lang')['es'].value,
                    "Padre": dataResponse.code[i].parent ? dataResponse.code[i].parent.substring(dataResponse.code[i].parent.lastIndexOf(".") + 1) : ''
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
                    urlCodelist = $('#inputUrl').val();
                    tableau.connectionName = text['es'].codelist.name;
                    break;
                case 'variableFamily':
                    urlCodelist = $('#selectCodelist').val() + '/codes';
                    if ($('#selectCodelist').val() == null || $('#selectCodelist').val() == undefined || $('#selectCodelist').val().length == 0) {
                        urlCodelist = '';
                    }
                    tableau.connectionName = text['es'].codelist.name;
                    break;
            }
            var urlObj = {
                url: urlCodelist.trim()
            };

            function isValidUrl(url) {
                url = url.toString();
                return url.match(".+/codes(.json)?$") != null;
            }

            if (isValidUrl(urlObj.url)) {
                $('#errorMsg').html("");
                tableau.connectionData = JSON.stringify(urlObj);
                if (urlObj.url.indexOf(".json") == -1) {
                    urlObj.url = urlObj.url + ".json";
                }
                $.getJSON(urlObj.url.substring(0, urlObj.url.indexOf('/codes')), function(resp) {
                    tableau.connectionName = tableau.connectionName + _.keyBy(resp.name.text, 'lang')['es'].value;
                    tableau.submit();
                }).error(function() {
                    $("#errorMsg").html(errorMsg['es'].error.submit);
                });
            } else {
                $('#errorMsg').html(errorMsg['es'].error.codelist.url);
            }
        });
    });
})();