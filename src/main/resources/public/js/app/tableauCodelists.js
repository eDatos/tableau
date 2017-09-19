(function () {
    var myConnector = tableau.makeConnector();
    var urlCodelist;

    myConnector.getSchema = function (schemaCallback) {
        var urlObj = JSON.parse(tableau.connectionData);
        var cols = [
            { id : "Codigo", columnRole : "dimension", dataType : tableau.dataTypeEnum.string },
            { id : "Padre", columnRole : "dimension", dataType : tableau.dataTypeEnum.string }
        ];

        if (urlObj.allLanguages) {
            for (i = 0; i < urlObj.languages.length; i++) {
                cols.push({ id : "Nombre_" + urlObj.languages[i], columnRole : "dimension", dataType : tableau.dataTypeEnum.string });
            }
        } else {
            cols.push({ id : "Nombre", columnRole : "dimension", dataType : tableau.dataTypeEnum.string });
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
            for (i = 0; i < dataResponse.code.length; i++) {
                var hash = {};
                hash.Codigo = dataResponse.code[i].id;
                hash.Padre = dataResponse.code[i].parent ? dataResponse.code[i].parent.substring(dataResponse.code[i].parent.lastIndexOf(".") + 1) : '';
                if (urlObj.allLanguages) {
                    for (j = 0; j < urlObj.languages.length; j++) {
                        hash['Nombre_' + urlObj.languages[j]] = _.keyBy(dataResponse.code[i].name.text, 'lang')[urlObj.languages[j]].value;
                    }
                } else {
                    hash.Nombre = _.keyBy(dataResponse.code[i].name.text, 'lang')['es'].value;
                }
                tableData.push(hash);
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
                url: urlCodelist.trim(),
                allLanguages: $('#allLanguages').is(':checked')
            };

            function isValidUrl(url) {
                url = url.toString();
                return url.match(".+/codes(.json)?$") != null;
            }

            if (isValidUrl(urlObj.url)) {
                $('#errorMsg').html("");
                if (urlObj.url.indexOf(".json") == -1) {
                    urlObj.url = urlObj.url + ".json";
                }
                $.getJSON(urlObj.url.substring(0, urlObj.url.indexOf('/codes')), function(resp) {
                    tableau.connectionName = tableau.connectionName + _.keyBy(resp.name.text, 'lang')['es'].value;
                    if (urlObj.allLanguages) {
                        languages = [];
                        for (i = 0; i < resp.name.text.length; i++) {
                            languages[i] = resp.name.text[i].lang;
                        }
                        urlObj.languages = languages;
                    }
                    tableau.connectionData = JSON.stringify(urlObj);
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