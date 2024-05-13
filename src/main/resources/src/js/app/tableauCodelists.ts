(function () {
    type CodeListType = 'url' | 'variableFamily';

    var myConnector = tableau.makeConnector();
    var urlDecodeCodelist;
    var urlCodelist;

    myConnector.getSchema = function (schemaCallback) {
        var schemaTables = [];
        var connectionData = JSON.parse(tableau.connectionData);

        if (connectionData.decodeOptionEnabled) {
            var colsCodelist02 = [
                { id: "Codigo_recodificado", columnRole: "dimension", dataType: tableau.dataTypeEnum.string },
                { id: "Padre_recodificado", columnRole: "dimension", dataType: tableau.dataTypeEnum.string }
            ];

            if (connectionData.allLanguages) {
                for (let i = 0; i < connectionData.languages.length; i++) {
                    colsCodelist02.push({ id: "Nombre_recodificado_" + connectionData.languages[i], columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
                }
            } else {
                colsCodelist02.push({ id: "Nombre_recodificado", columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
            }

            var colsIntersection = [
                { id: "Codigo_origen", columnRole: "dimension", dataType: tableau.dataTypeEnum.string },
                { id: "Codigo_recodificado", columnRole: "dimension", dataType: tableau.dataTypeEnum.string }
            ];

            var tableCodelist02 = {
                id: "codelist02Data",
                alias: connectionData.codelist02Tablename,
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
            { id: "Codigo_origen", columnRole: "dimension", dataType: tableau.dataTypeEnum.string },
            { id: "Padre_origen", columnRole: "dimension", dataType: tableau.dataTypeEnum.string }
        ];

        if (connectionData.allLanguages) {
            for (let i = 0; i < connectionData.languages.length; i++) {
                colsCodelist01.push({ id: "Nombre_origen_" + connectionData.languages[i], columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
            }
        } else {
            colsCodelist01.push({ id: "Nombre_origen", columnRole: "dimension", dataType: tableau.dataTypeEnum.string });
        }

        var tableCodelist01 = {
            id: "codelist01Data",
            alias: connectionData.codelist01Tablename,
            columns: _.sortBy(colsCodelist01, 'id')
        };
        schemaTables.push(tableCodelist01);

        schemaCallback(schemaTables);
    };

    myConnector.getData = function (table, doneCallback) {
        var connectionData = JSON.parse(tableau.connectionData);
        var promises = [];

        if (table.tableInfo.id == "codelist01Data" || table.tableInfo.id == "intersectionData") {
            promises.push($.getJSON(connectionData.url));
        }

        if (table.tableInfo.id == "codelist02Data" || table.tableInfo.id == "intersectionData") {
            promises.push($.getJSON(connectionData.urlDecodeCodelist));
        }
        $.when.apply($, promises).then(function () {

            var tableData = [];
            if (table.tableInfo.id != "intersectionData") {
                var dataResponse = arguments[0];

                for (let i = 0; i < dataResponse.code.length; i++) {
                    var dataEntry: CodelistDataEntry = {};
                    if (table.tableInfo.id == "codelist01Data") {
                        dataEntry.Codigo_origen = dataResponse.code[i].id;
                        dataEntry.Padre_origen = dataResponse.code[i].parent ? dataResponse.code[i].parent.substring(dataResponse.code[i].parent.lastIndexOf(".") + 1) : '';
                    } else {
                        dataEntry.Codigo_recodificado = dataResponse.code[i].id;
                        dataEntry.Padre_recodificado = dataResponse.code[i].parent ? dataResponse.code[i].parent.substring(dataResponse.code[i].parent.lastIndexOf(".") + 1) : '';
                    }
                    if (connectionData.allLanguages) {
                        for (let j = 0; j < connectionData.languages.length; j++) {
                            if (table.tableInfo.id == "codelist01Data") {
                                dataEntry['Nombre_origen_' + connectionData.languages[j]] = _.keyBy(dataResponse.code[i].name.text, 'lang')[connectionData.languages[j]].value;
                            } else {
                                dataEntry['Nombre_recodificado_' + connectionData.languages[j]] = _.keyBy(dataResponse.code[i].name.text, 'lang')[connectionData.languages[j]].value;
                            }
                        }
                    } else {
                        const language = getLanguage();
                        if (table.tableInfo.id == "codelist01Data") {
                            dataEntry.Nombre_origen = getLocalisedLabel(dataResponse.code[i].name.text);
                        } else {
                            dataEntry.Nombre_recodificado = getLocalisedLabel(dataResponse.code[i].name.text);
                        }
                    }
                    tableData.push(dataEntry);
                }
            } else {
                var dataResponseCodelist1 = arguments[0][0];
                var dataResponseCodelist2 = arguments[1][0];
                var secondaryHash: CodelistDataEntry = {};
                for (let i = 0; i < dataResponseCodelist1.code.length; i++) {
                    secondaryHash = {};
                    var variableElementId = dataResponseCodelist1.code[i].variableElement.id;
                    secondaryHash.Codigo_origen = dataResponseCodelist1.code[i].id;
                    var recodedCode = _.find(dataResponseCodelist2.code, function (item) {
                        return item.variableElement.id == variableElementId;
                    });
                    secondaryHash.Codigo_recodificado = (recodedCode) ? recodedCode.id : '';
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
        $('#codelistUrlInput').on('click', () => {
            $('#decode').prop('disabled', true).prop('checked', false);
        });
        $('#selectVariableInput').on('click', () => {
            $('#decode').prop('disabled', false);
        });
        const decodeCheckbox = $('#decode');
        decodeCheckbox.on('click', () => {
            $('#codelistUrlInput').prop('disabled', decodeCheckbox.prop('checked'));
        });

        $("#dataButton").click(function () {
            const codeListType: CodeListType = $('input[name="datatype"]:checked').val() as CodeListType;
            switch (codeListType) {
                case 'url':
                    urlCodelist = $('#inputUrl').val();
                    tableau.connectionName = "Clasificación: ";
                    break;
                case 'variableFamily':
                    urlCodelist = $('#selectCodelist').val() + '/codes?fields=+variableElement';
                    urlDecodeCodelist = $('#selectDecodeCodelist').val() + '/codes?fields=+variableElement';

                    if (isNullOrBlank($('#selectCodelist').val())) {
                        urlCodelist = '';
                    }
                    tableau.connectionName = "Clasificación: ";
                    break;
            }
            if ($('#decode').is(':checked') && !isNullOrBlank($('#selectDecodeCodelist').val())) {
                urlDecodeCodelist = $('#selectDecodeCodelist').val() + '/codes?fields=+variableElement';
            } else {
                urlDecodeCodelist = '';
            }
            var connectionData: CodelistsConnectionData = {
                url: urlCodelist.trim(),
                urlDecodeCodelist: urlDecodeCodelist.trim(),
                decodeOptionEnabled: $("#decode").is(":checked"),
                codelist01Tablename: codeListType === 'url' ? "Clasificación" : $("#selectCodelist option:checked").text(),
                codelist02Tablename: $("#selectDecodeCodelist option:checked").text(),
                allLanguages: $('#allLanguages').is(':checked'),
                languages: []
            };

            function isValidUrl(url) {
                url = url.toString();
                return url.match(/.+\/codes(.json)?(\?fields=\+variableElement)?$/) != null;
            }

            if (isValidUrl(connectionData.url) && (!$("#decode").is(":checked") || isValidUrl(connectionData.urlDecodeCodelist))) {
                $('#errorMsg').html("");
                $('#errorNotSelectedDecoded').css("right", "-350px");

                connectionData.url = addJsonFormat(connectionData.url);
                connectionData.urlDecodeCodelist = addJsonFormat(connectionData.urlDecodeCodelist);

                $.getJSON(connectionData.url.substring(0, connectionData.url.indexOf('/codes')), function (resp) {
                    const language = getLanguage();
                    tableau.connectionName = tableau.connectionName + getLocalisedLabel(resp.name.text);
                    if (connectionData.allLanguages) {
                        let languages = [];
                        for (let i = 0; i < resp.name.text.length; i++) {
                            languages[i] = resp.name.text[i].lang;
                        }
                        connectionData.languages = languages;
                    }
                    tableau.connectionData = JSON.stringify(connectionData);
                    tableau.submit();
                }).fail(function () {
                    $("#errorMsg").html(errorMsg.error.submit);
                });
            } else {
                if (isNullOrBlank($("#selectDecodeCodelist").val()) && connectionData.decodeOptionEnabled) {
                    $('#errorNotSelectedDecoded').css("right", "0px");
                } else {
                    $('#errorMsg').html(errorMsg.error.codelist.url);
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
    function isNullOrBlank(value): boolean {
        return (value == null || value == undefined || value.length == 0);
    }

})();

