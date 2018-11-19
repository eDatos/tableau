(function () {

    var myConnector = tableau.makeConnector();
    var urlDecodeCodelist;
    var urlCodelist;

    myConnector.getSchema = function (schemaCallback) {
        var schemaTables = [];
        var urlObj = JSON.parse(tableau.connectionData);

        if (urlObj.decodeOptionEnabled) {
            var colsCodelist02 = [
                {id: "Codigo_recodificado", columnRole: "dimension", dataType: tableau.dataTypeEnum.string },
                {id: "Padre_recodificado", columnRole: "dimension", dataType: tableau.dataTypeEnum.string }
            ];

            if (urlObj.allLanguages) {
                for (i = 0; i < urlObj.languages.length; i++) {
                    colsCodelist02.push({id: "Nombre_recodificado_" + urlObj.languages[i], columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
                }
            } else {
                colsCodelist02.push({id: "Nombre_recodificado", columnRole: "dimension", dataType: tableau.dataTypeEnum.string});
            }

            var colsIntersection = [
                {id: "Codigo_origen", columnRole: "dimension", dataType: tableau.dataTypeEnum.string },
                {id: "Codigo_recodificado", columnRole: "dimension", dataType: tableau.dataTypeEnum.string }
            ];

            var tableCodelist02 = {
                id: "codelist02Data",
                alias: urlObj.codelist02Tablename,
                columns: _.sortBy(colsCodelist02, 'id')
            };
            schemaTables.push(tableCodelist02);

            var tableIntersection = {
                id: "intersectionData",
                alias: "Intersección: " + tableau.connectionName,
                columns: _.sortBy(colsIntersection, 'id')
            };
            schemaTables.push(tableIntersection);
        }

        var colsCodelist01 = [
            {id: "Codigo_origen", columnRole: "dimension", dataType: tableau.dataTypeEnum.string },
            {id: "Padre_origen", columnRole: "dimension", dataType: tableau.dataTypeEnum.string }
        ];

        if (urlObj.allLanguages) {
            for (i = 0; i < urlObj.languages.length; i++) {
                colsCodelist01.push({id: "Nombre_origen_" + urlObj.languages[i], columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
            }
        } else {
            colsCodelist01.push({id: "Nombre_origen", columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
        }

        var tableCodelist01 = {
            id: "codelist01Data",
            alias: urlObj.codelist01Tablename,
            columns: _.sortBy(colsCodelist01, 'id')
        };
        schemaTables.push(tableCodelist01);

        schemaCallback(schemaTables);
    };

    myConnector.getData = function (table, doneCallback) {
        var urlObj = JSON.parse(tableau.connectionData);
        var promises = [];

        if (table.tableInfo.id == "codelist01Data" || table.tableInfo.id == "intersectionData") {
            promises.push($.getJSON(urlObj.url));
        }

        if (table.tableInfo.id == "codelist02Data" || table.tableInfo.id == "intersectionData") {
            promises.push($.getJSON(urlObj.urlDecodeCodelist));
        }
        $.when.apply($, promises).then(function () {

            var tableData = [];
            if (table.tableInfo.id != "intersectionData") {
                var dataResponse = arguments[0];

                for (i = 0; i < dataResponse.code.length; i++) {
                    var hash = {};
                    if (table.tableInfo.id == "codelist01Data") {
                        hash.Codigo_origen = dataResponse.code[i].id;
                        hash.Padre_origen = dataResponse.code[i].parent ? dataResponse.code[i].parent.substring(dataResponse.code[i].parent.lastIndexOf(".") + 1) : '';
                    } else {
                        hash.Codigo_recodificado = dataResponse.code[i].id;
                        hash.Padre_recodificado = dataResponse.code[i].parent ? dataResponse.code[i].parent.substring(dataResponse.code[i].parent.lastIndexOf(".") + 1) : '';
                    }
                    if (urlObj.allLanguages) {
                        for (j = 0; j < urlObj.languages.length; j++) {
                            if (table.tableInfo.id == "codelist01Data") {
                                hash['Nombre_origen_' + urlObj.languages[j]] = _.keyBy(dataResponse.code[i].name.text, 'lang')[urlObj.languages[j]].value;
                            } else {
                                hash['Nombre_recodificado_' + urlObj.languages[j]] = _.keyBy(dataResponse.code[i].name.text, 'lang')[urlObj.languages[j]].value;
                            }
                        }
                    } else {
                        if (table.tableInfo.id == "codelist01Data") {
                            hash.Nombre_origen = _.keyBy(dataResponse.code[i].name.text, 'lang')[language].value;
                        } else {
                            hash.Nombre_recodificado = _.keyBy(dataResponse.code[i].name.text, 'lang')[language].value;
                        }
                    }
                    tableData.push(hash);
                }
            } else {
                var dataResponseCodelist1 = arguments[0][0];
                var dataResponseCodelist2 = arguments[1][0];
                var secondaryHash = {};
                for (i = 0; i < dataResponseCodelist1.code.length; i++) {
                    secondaryHash = {};
                    var variableElementId = dataResponseCodelist1.code[i].variableElement.id;
                    secondaryHash.Codigo_origen = dataResponseCodelist1.code[i].id;
                    var recodedCode = _.find(dataResponseCodelist2.code, function (item) {
                        return item.variableElement.id == variableElementId;
                    });
                    secondaryHash.Codigo_recodificado = (recodedCode) ? recodedCode.id: '';
                    tableData.push(secondaryHash);
                }
            }

            table.appendRows(tableData);
            doneCallback();
        }, function () {
            doneCallback();
        });
    };

    tableau.registerConnector(myConnector);

    $(document).ready(function () {
        $("#dataButton").click(function () {
            switch ($('input[name="datatype"]:checked').val()) {
            case 'url':
                urlCodelist = $('#inputUrl').val();
                    tableau.connectionName = "Clasificación: ";
                break;
            case 'variableFamily':
                urlCodelist = $('#selectCodelist').val() + '/codes?fields=+variableElement';
                urlDecodeCodelist =  $('#selectDecodeCodelist').val() + '/codes?fields=+variableElement';

                if (!$("#decode").is(":checked") || isNullOrBlank($("#selectDecodeCodelist").val())) {
                    urlDecodeCodelist = '';
                }

                if (isNullOrBlank($('#selectCodelist').val())) {
                    urlCodelist = '';
                }
                    tableau.connectionName = "Clasificación: ";
                break;
            }
            var urlObj = {
                url: urlCodelist.trim(),
                urlDecodeCodelist: urlDecodeCodelist.trim(),
                decodeOptionEnabled: $("#decode").is(":checked"),
                codelist01Tablename: $("#selectCodelist option:checked").text(),
                codelist02Tablename: $("#selectDecodeCodelist option:checked").text(),
                allLanguages: $('#allLanguages').is(':checked')
            };

            function isValidUrl(url) {
                url = url.toString();
                return url.match(".+\/codes(.json)?.+(\\?fields=+variableElement)?$") != null;
            }

            if (isValidUrl(urlObj.url) && (!$("#decode").is(":checked") || isValidUrl(urlObj.urlDecodeCodelist))) {
                $('#errorMsg').html("");
                $('#errorNotSelectedDecoded').css("right", "-350px");

                urlObj.url = addJsonFormat(urlObj.url);
                urlObj.urlDecodeCodelist = addJsonFormat(urlObj.urlDecodeCodelist);

                $.getJSON(urlObj.url.substring(0, urlObj.url.indexOf('/codes')), function (resp) {
                    tableau.connectionName = tableau.connectionName + _.keyBy(resp.name.text, 'lang')[language].value;
                    if (urlObj.allLanguages) {
                        languages = [];
                        for (i = 0; i < resp.name.text.length; i++) {
                            languages[i] = resp.name.text[i].lang;
                        }
                        urlObj.languages = languages;
                    }
                    tableau.connectionData = JSON.stringify(urlObj);
                    tableau.submit();
                }).error(function () {
                    $("#errorMsg").html(errorMsg[language].error.submit);
                });
            } else {
                if (isNullOrBlank($("#selectDecodeCodelist").val()) && urlObj.decodeOptionEnabled) {
                    $('#errorNotSelectedDecoded').css("right", "0px");
                } else {
                    $('#errorMsg').html(errorMsg[language].error.codelist.url);
                }
            }
        });
    });

    /**
     * Add '.json' in the correct place inside the url string.
     *
     * @param {any} urlString
     */
    function addJsonFormat(urlString) {
        if (urlString.indexOf(".json") == -1) {
            var indexJson = urlString.indexOf("?fields=+variableElement");
            if (indexJson != -1) {
                return urlString.slice(0, indexJson) + ".json" + urlString.slice(indexJson, urlString.length);
            }
        }
        return urlString + ".json";
    }

    /**
     * Check if the value is null, blank or empty
     *
     * @param {any} value
     * @returns
     */
    function isNullOrBlank(value) {
        return (value == null || value == undefined || value.length == 0);
    }

})();

