var properties: Configuration;

var endpoint;
const RESOURCE_TYPE_CACHE: Map<string, ResourceType> = new Map();

getProperties().then(function (resp) {
    properties = resp;
    addGoogleAnalyticsScriptTag();
    $(document).ready(function () {
        const dataType = <HTMLInputElement>$("input[name='datatype']:checked")[0];
        if (dataType) {
            switch (dataType.value) {
                case "indicator":
                    searchSubjects();
                    break;
                case "variableFamily":
                    searchVariableFamilies();
                    break;
                case "operation":
                    searchOperations();
                    break;
            }
        }


    });
    $("#headerTemplate").ready(function () {
        switch (properties.installationEnvironmentType) {
            case "INTERNAL":
                $("#headerTemplate").addClass("entorno-interno");
                break;
            case "EXTERNAL":
                $("#headerTemplate").addClass("entorno-externo");
                break;
        }
    });
});

function addGoogleAnalyticsScriptTag() {
    $.getJSON(properties.endpoint.metadata + 'properties/metamac.analytics.google.tracking_id.json', function (resp) {
        var googleAnalyticsTrackId = resp.value;

        var googleAnalyticsScript = document.createElement('script');
        googleAnalyticsScript.setAttribute('src', 'https://www.googletagmanager.com/gtag/js?id=' + googleAnalyticsTrackId);
        googleAnalyticsScript.async = true;
        document.head.insertBefore(googleAnalyticsScript, null);

        executeGoogleAnalyticsInlineCode(googleAnalyticsTrackId);
    });
}

function executeGoogleAnalyticsInlineCode(trackingId) {
    window.dataLayer = window.dataLayer || [];

    function gtag(key, value) {
        window.dataLayer.push(arguments);
    }

    gtag('js', new Date());
    gtag('config', trackingId);
}

function addNumber(number) {
    return number < 10 ? "0" + number + " " : number + " ";
}

function onDownloadDecodeSelected(downloadDecodeRadio) {
    if ($("#" + downloadDecodeRadio.id).is(":checked")) {
        searchCodelists();
        updateDecodelists();
        $("#decodeWrapper").show();
    } else {
        $("#decodeWrapper").hide();
    }
}

function isGpeOrJsonStatResourceType(resourceType: ResourceType | null): boolean {
    if (resourceType == null) {
        return false;
    }
    return resourceType === ResourceType.GPE_DATASET || resourceType === ResourceType.JSON_STAT_DATASET;
}

function isGpeOrJsonStatDataset(): Promise<boolean> {
    const $inputUrl = $("#inputUrl");
    const url = $inputUrl.val() as string;

    if (RESOURCE_TYPE_CACHE.get(url) !== undefined) {
        const deferred = $.Deferred();
        deferred.resolve(isGpeOrJsonStatResourceType(RESOURCE_TYPE_CACHE[url]));
        return deferred.promise();
    }
    RESOURCE_TYPE_CACHE.clear();

    const isDatasetMode = $inputUrl.data("inputType") === "dataset";
    if (isDatasetMode) {
        // calculateResourceType is only available from tableauDataset
        return calculateResourceType(<string>$('#inputUrl').val()).then(resourceType => {
            const urlIsGpeOrJsonStat = isGpeOrJsonStatResourceType(resourceType);
            RESOURCE_TYPE_CACHE.set(url, resourceType);
            return urlIsGpeOrJsonStat;
        });
    } else {
        const deferred = $.Deferred();
        deferred.resolve(false);
        RESOURCE_TYPE_CACHE.set(url, ResourceType.STATISTICAL_RESOURCE_DATASET);
        return deferred.promise();
    }
}


function enableCheckbox(checkbox: string) {
    $(checkbox).prop("disabled", false);
}

function disableCheckbox(checkbox: string) {
    $(checkbox).prop("disabled", true);
    $(checkbox).prop("checked", false);
}

function enableCheckboxForDataset() {
    enableCheckbox("#measureColumns");
    enableCheckbox("#starModel");

    enableCheckbox("#recodeDates");
    enableCheckbox("#showLabels");
    if ($("#showLabels").is(":checked")) {
        enableCheckbox("#allLanguages");
    }
}

function enableCheckboxForGpeOrJsonStat() {
    disableCheckbox("#measureColumns");
    disableCheckbox("#starModel");

    enableCheckbox("#recodeDates");
    enableCheckbox("#showLabels");
    disableCheckbox("#allLanguages");
}

let updateOptionsDebouncer;
function updateOptions() {
    const isUrlSelected = (<HTMLInputElement>$("input[name='datatype']:checked")[0]).value == "url";
    if (isUrlSelected) {
        clearTimeout(updateOptionsDebouncer);
        updateOptionsDebouncer = setTimeout(() => {
            isGpeOrJsonStatDataset().then(isGpeOrJsonStat => {
                if (isGpeOrJsonStat) {
                    enableCheckboxForGpeOrJsonStat();
                } else {
                    enableCheckboxForDataset();
                }
            });
        }, 500);
    } else {
        enableCheckboxForDataset();
    }
}

function chooseDataOption(radio) {
    updateOptions();
    var radioDivs = document.getElementsByClassName("radioDiv") as HTMLCollectionOf<HTMLElement>;
    $(".first-loader:visible").hide();
    for (var i = 0; i < radioDivs.length; i++) {
        if (radioDivs[i].id != radio.value) {
            radioDivs[i].style.display = "none";
        } else {
            if ($("#clasificaciones").hasClass("active")) {
                if (radioDivs[i].id == "url") {
                    $("#decode").prop("checked", false);
                    $("#decode").prop("disabled", true);
                } else {
                    $("#decode").prop("disabled", false);
                }
            }
            switch (radioDivs[i].id) {
                case "indicator":
                    searchSubjects();
                    break;
                case "indicatorInstance":
                    searchIndicatorsSystems();
                    break;
                case "variableFamily":
                    searchVariableFamilies();
                    break;
                case "operation":
                    searchOperations();
                    break;
            }
            radioDivs[i].style.display = "block";
            if ($("#labelDecodeCodelist input").is(":checked")) {
                $("#decodeWrapper").hide();
            }
        }
    }
    $('#errorMsg').html("");
}


function searchSubjects() {
    $("#loaderSubject").show();
    document.getElementById("selectIndicator").parentElement.style.display = "none";
    var subjects = [];
    $('#selectSubject').html('').select2();

    getEndpointMetadataValue(properties.endpoint.indicators)
        .done(function (endpoint) {
            $.getJSON(endpoint + "/subjects", function (resp) {
                $('#errorMsg').html("");
                if (resp.items) {
                    for (var i = 0; i < resp.items.length; i++) {
                        subjects[i] = { id: resp.items[i].id, text: resp.items[i].title.__default__ };
                    }
                }
                $('#selectSubject').select2({
                    data: _.sortBy(subjects, 'text'),
                    dropdownAutoWidth: true,
                    width: '83.3%',
                });
                $("#loaderSubject").hide();
                searchIndicators();
            }).fail(function () {
                $("#loaderSubject").hide();
                $('#errorMsg').html(errorMsg.error.endpoint);
            });
        });
}

function searchIndicators() {
    $("#errorMsg").html("");
    $("#loaderIndicator").show();
    document.getElementById("selectIndicator").parentElement.style.display = "block";
    var indicators = [];
    $('#selectIndicator').html('').select2();

    getEndpointMetadataValue(properties.endpoint.indicators)
        .done(function (endpoint) {
            var subjectCode = (<HTMLInputElement>document.getElementById("selectSubject")).value;
            $.getJSON(endpoint + "/indicators?limit=1000&orderBy=ID ASC&q=subjectCode EQ '" + subjectCode + "'", function (resp) {
                $('#errorMsg').html("");
                if (resp.items) {
                    for (var i = 0; i < resp.items.length; i++) {
                        indicators[i] = { id: resp.items[i].id, text: resp.items[i].title.__default__ };
                    }
                }
                $('#selectIndicator').select2({
                    data: _.sortBy(indicators, 'text'),
                    dropdownAutoWidth: true,
                    width: '83.3%',
                });
                $("#loaderIndicator").hide();
            }).fail(function () {
                $("#loaderIndicator").hide();
                $('#errorMsg').html(errorMsg.error.endpoint);
            });
        });
}

function searchIndicatorsSystems() {
    $("#errorMsg").html("");
    $("#loaderIndicatorSystem").show();
    document.getElementById("selectIndicatorInstance").parentElement.style.display = "none";
    var indicatorsSystems = [];
    $('#selectIndicatorSystem').html('').select2();
    getEndpointMetadataValue(properties.endpoint.indicators)
        .done(function (endpoint) {
            $.getJSON(endpoint + "/indicatorsSystems?limit=1000&orderBy=ID ASC", function (resp) {
                $('#errorMsg').html("");
                if (resp.items) {
                    for (var i = 0; i < resp.items.length; i++) {
                        indicatorsSystems[i] = { id: resp.items[i].id, text: resp.items[i].title.__default__ };
                    }
                }
                $('#selectIndicatorSystem').select2({
                    data: _.sortBy(indicatorsSystems, 'text'),
                    dropdownAutoWidth: true,
                    width: '83.3%',
                });
                $("#loaderIndicatorSystem").hide();
                searchIndicatorsInstances();
            }).fail(function () {
                $("#loaderIndicatorSystem").hide();
                $('#errorMsg').html(errorMsg.error.endpoint);
            });
        });
}

function searchIndicatorsInstances() {
    $("#errorMsg").html("");
    $("#loaderIndicatorInstance").show();
    document.getElementById("selectIndicatorInstance").parentElement.style.display = "block";
    var indicatorsInstances = [];
    $('#selectIndicatorInstance').html('').select2();
    getEndpointMetadataValue(properties.endpoint.indicators).done(function (endpoint) {
        const url = endpoint + "/indicatorsSystems/" + (<HTMLInputElement>document.getElementById("selectIndicatorSystem")).value + "/indicatorsInstances?limit=1000&orderBy=ID ASC";
        $.getJSON(url, function (resp) {
            if (resp.items) {
                for (var i = 0; i < resp.items.length; i++) {
                    indicatorsInstances[i] = { id: resp.items[i].id, text: resp.items[i].title.__default__ };
                }
            }
            $('#selectIndicatorInstance').select2({
                data: _.sortBy(indicatorsInstances, 'text'),
                dropdownAutoWidth: true,
                width: '83.3%',
            });
            $("#loaderIndicatorInstance").hide();
        }).fail(function () {
            $("#loaderVariableFamily").hide();
            $('#errorMsg').html(errorMsg.error.request);
        });
    });
}

function searchVariableFamilies() {
    $("#errorMsg").html("");
    $("#loaderVariableFamily").show();
    var variableFamilies = [];
    $("#selectVariable").parent().hide();
    $("#selectCodelist").parent().hide();
    $('#selectVariableFamily').html('').select2();
    getEndpointMetadataValue(properties.endpoint['structural-resources'])
        .done(function (endpoint) {
            const url = endpoint + "/variablefamilies.json?limit=1000&orderBy=ID ASC";
            $.getJSON(url, function (resp) {
                if (resp.variableFamily) {
                    for (var i = 0; i < resp.variableFamily.length; i++) {
                        variableFamilies[i] = { id: resp.variableFamily[i].id, text: _.keyBy(resp.variableFamily[i].name.text, 'lang')[language].value };
                    }
                }
                $('#selectVariableFamily').select2({
                    data: _.sortBy(variableFamilies, 'text'),
                    dropdownAutoWidth: true,
                    width: '83.3%',
                });
                $("#loaderVariableFamily").hide();
                searchVariables();
            }).fail(function () {
                $("#loaderVariableFamily").hide();
                $('#errorMsg').html(errorMsg.error.endpoint);
            });
        });
}

function searchVariables() {
    $("#errorMsg").html("");
    $("#loaderVariable").show();
    document.getElementById("selectVariable").parentElement.style.display = "block";
    var variables = [];
    $("#selectCodelist").parent().hide();
    $("#selectVariable").html('').select2();
    // This endpoint is assigned its value on metadata-service. It´s not the best way but it´s working for now until it is refactorized
    const url = endpoint + "/variablefamilies/" + (<HTMLInputElement>document.getElementById("selectVariableFamily")).value + "/variables.json?limit=1000&orderBy=ID ASC";
    $.getJSON(url, function (resp) {
        if (resp.variable) {
            for (var i = 0; i < resp.variable.length; i++) {
                variables[i] = { id: resp.variable[i].urn, text: _.keyBy(resp.variable[i].name.text, 'lang')[language].value };
            }
        }
        $("#selectVariable").select2({
            data: _.sortBy(variables, 'text'),
            dropdownAutoWidth: true,
            width: '83.3%',
        });
        $("#loaderVariable").hide();
        searchCodelists();
    }).fail(function () {
        $("#loaderCodelist").hide();
        $("#errorMsg").html(errorMsg.error.request);
    });
}

var codelists = [];

function searchCodelists() {
    $("#errorMsg").html("");
    $("#loaderCodelist").show();
    document.getElementById("selectCodelist").parentElement.style.display = "block";
    codelists = [];
    $("#selectCodelist").html('').select2();

    const url = endpoint + '/codelists.json?limit=1000&orderBy=ID ASC&query=VARIABLE_URN EQ "' + $("#selectVariable").val() + '" AND LATEST EQ "true"';
    $.getJSON(url, function (resp) {
        if (resp.codelist) {
            for (var i = 0; i < resp.codelist.length; i++) {
                codelists[i] = { id: resp.codelist[i].selfLink.href, text: _.keyBy(resp.codelist[i].name.text, 'lang')[language].value };
            }
        }
        $("#selectCodelist").select2({
            data: _.sortBy(codelists, 'text'),
            dropdownAutoWidth: true,
            width: '83.3%',
        });
        if ($("#decode").is(":checked")) {
            updateDecodelists();
        }
        $("#loaderCodelist").hide();
    }).fail(function () {
        $("#loaderCodelist").hide();
        $("#errorMsg").html(errorMsg.error.request);
    });

}

function updateDecodelists() {
    $("#errorMsg").html("");
    $("#loaderDecode").show();
    document.getElementById("selectDecodeCodelist").parentElement.style.display = "block";
    $("#selectDecodeCodelist").html('').select2();
    $("#selectDecodeCodelist").select2({
        data: _.sortBy(_.filter(codelists, function (item) {
            return item.id != $("#selectCodelist").val();
        }), 'text'),
        dropdownAutoWidth: true,
        width: '83.3%',
        language: {
            noResults: function () {
                return "No hay ninguna clasificación de destino a la que poder recodificar";
            },
        },
    });
    $("#loaderDecode").hide();
}

function searchOperations() {
    $("#errorMsg").html("");
    $("#loaderOperation").show();
    document.getElementById("selectOperation").parentElement.style.display = "block";
    var operations = [];
    $("#selectOperation").html('').select2();

    getEndpointMetadataValue(properties.endpoint.operations)
        .done(function (endpoint) {
            $.getJSON(endpoint + "/operations.json?query=STATUS EQ \"" + properties.operations.status.production + "\"&limit=1000&orderBy=ID ASC", function (resp) {
                if (resp.operation) {
                    for (var i = 0; i < resp.operation.length; i++) {
                        operations[i] = { id: resp.operation[i].urn, text: _.keyBy(resp.operation[i].name.text, 'lang')[language].value };
                    }
                }
                $("#selectOperation").select2({
                    data: _.sortBy(operations, 'text'),
                    dropdownAutoWidth: true,
                    width: '83.3%',
                });
                $("#loaderOperation").hide();
                searchDatasets();
            }).fail(function () {
                $("#loaderOperation").hide();
                $("#errorMsg").html(errorMsg.error.endpoint);
            });

        });
}

function searchDatasets() {
    $("#errorMsg").html("");
    $("#loaderDataset").show();
    var datasets = [];
    $("#selectDataset").html('').select2();
    getEndpointMetadataValue(properties.endpoint['statistical-resources'])
        .done(function (endpoint) {
            const url = endpoint + "/datasets.json?limit=1000&orderBy=ID ASC&query=STATISTICAL_OPERATION_URN EQ '" + $("#selectOperation").val() + "'";
            $.getJSON(url, function (resp) {
                if (resp.dataset) {
                    for (var i = 0; i < resp.dataset.length; i++) {
                        datasets[i] = {
                            id: resp.dataset[i].selfLink.href.substring(0, resp.dataset[i].selfLink.href.lastIndexOf('/')),
                            text: _.keyBy(resp.dataset[i].name.text, 'lang')[language].value,
                        };
                    }
                }
                $("#selectDataset").select2({
                    data: _.sortBy(_.uniqBy(datasets, 'id'), 'text'),
                    dropdownAutoWidth: true,
                    width: '83.3%',
                });
                $("#loaderDataset").hide();
                document.getElementById("selectDataset").parentElement.style.display = "block";
            }).fail(function () {
                $("#loaderDataset").hide();
                $("#errorMsg").html(errorMsg.error.request);
            });
        });
}

function enableAllLanguages() {
    const isUrlSelected = (<HTMLInputElement>$("input[name='datatype']:checked")[0]).value == "url";
    if (isUrlSelected) {
        isGpeOrJsonStatDataset().then(isGpeOrJsonStatDataset => {
            if ($("#showLabels").is(":checked") && !isGpeOrJsonStatDataset) {
                enableCheckbox("#allLanguages")
            } else {
                disableCheckbox("#allLanguages")
            }
        });
    } else if ($("#showLabels").is(":checked")) {
        enableCheckbox("#allLanguages")
    } else {
        disableCheckbox("#allLanguages")
    }
}
