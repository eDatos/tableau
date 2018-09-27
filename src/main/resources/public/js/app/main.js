var properties;
$.getJSON("config/properties.json", function (resp) {
    properties = resp;
    addGoogleAnalyticsScriptTag();
    $("form").ready(function () {
        if ($("input[name='datatype']:checked")[0]) {
            switch ($("input[name='datatype']:checked")[0].value) {
                case "indicator":
                    $("#labelSelectIndicator").ready(searchSubjects());
                    break;
                case "variableFamily":
                    $("#selectVariableLabel").ready(searchVariableFamilies());
                    break;
                case "operation":
                    $("#labelSelectOperation").ready(searchOperations());
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
    $.getJSON(properties.endpoint.metadata + 'properties/metamac.analytics.google.tracking_id.json', function(resp) {
        var googleAnalyticsTrackId = resp.value;

        var googleAnalyticsScript = document.createElement('script');
        googleAnalyticsScript.setAttribute('src', 'https://www.googletagmanager.com/gtag/js?id=' + googleAnalyticsTrackId);
        googleAnalyticsScript.async = true;
        document.head.prepend(googleAnalyticsScript);

        executeGoogleAnalyticsInlineCode(googleAnalyticsTrackId);
    });
}

function executeGoogleAnalyticsInlineCode(trackingId) {
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
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

function chooseDataOption(radio) {
    var radioDivs = document.getElementsByClassName("radioDiv");
    $(".first-loader:visible").hide();
    for (var i = 0; i < radioDivs.length; i++) {
        if (radioDivs[i].id != radio.value) {
            radioDivs[i].style.display = "none";
        } else {
            if ($("#clasificaciones").hasClass("active")) {
                if (radioDivs[i].id == "url") {
                    $("#decode").attr("checked", false);
                    $("#decode").attr("disabled", true);
                } else {
                    $("#decode").attr("disabled", false);
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

var endpoint;

function searchSubjects() {
    $("#loaderSubject").show();
    document.getElementById("selectIndicator").parentElement.style.display = "none";
    var subjects = [];
    $('#selectSubject').html('').select2();

    endpoint = properties.endpoint.indicators;
    if (endpoint[endpoint.length - 1] == "/") {
        endpoint = endpoint.substring(0, endpoint.lastIndexOf("/"));
    }

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
            width: '83.3%'
        });
        $("#loaderSubject").hide();
        searchIndicators();
    }).error(function () {
        $("#loaderSubject").hide();
        $('#errorMsg').html(errorMsg[language].error.endpoint);
    });
}

function searchIndicators() {
    $("#errorMsg").html("");
    $("#loaderIndicator").show();
    document.getElementById("selectIndicator").parentElement.style.display = "block";
    var indicators = [];
    $('#selectIndicator').html('').select2();

    endpoint = properties.endpoint.indicators;
    if (endpoint[endpoint.length - 1] == "/") {
        endpoint = endpoint.substring(0, endpoint.lastIndexOf("/"));
    }

    var subjectCode = document.getElementById("selectSubject").value
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
            width: '83.3%'
        });
        $("#loaderIndicator").hide();
    }).error(function () {
        $("#loaderIndicator").hide();
        $('#errorMsg').html(errorMsg[language].error.endpoint);
    });
}

function searchIndicatorsSystems() {
    $("#errorMsg").html("");
    $("#loaderIndicatorSystem").show();
    document.getElementById("selectIndicatorInstance").parentElement.style.display = "none";
    var indicatorsSystems = [];
    $('#selectIndicatorSystem').html('').select2();
    endpoint = properties.endpoint.indicators;
    if (endpoint[endpoint.length - 1] == "/") {
        endpoint = endpoint.substring(0, endpoint.lastIndexOf("/"));
    }
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
            width: '83.3%'
        });
        $("#loaderIndicatorSystem").hide();
        searchIndicatorsInstances();
    }).error(function () {
        $("#loaderIndicatorSystem").hide();
        $('#errorMsg').html(errorMsg[language].error.endpoint);
    });
}

function searchIndicatorsInstances() {
    $("#errorMsg").html("");
    $("#loaderIndicatorInstance").show();
    document.getElementById("selectIndicatorInstance").parentElement.style.display = "block";
    var indicatorsInstances = [];
    $('#selectIndicatorInstance').html('').select2();
    url = endpoint + "/indicatorsSystems/" + document.getElementById("selectIndicatorSystem").value + "/indicatorsInstances?limit=1000&orderBy=ID ASC";
    $.getJSON(url, function (resp) {
        if (resp.items) {
            for (var i = 0; i < resp.items.length; i++) {
                indicatorsInstances[i] = { id: resp.items[i].id, text: resp.items[i].title.__default__ };
            }
        }
        $('#selectIndicatorInstance').select2({
            data: _.sortBy(indicatorsInstances, 'text'),
            dropdownAutoWidth: true,
            width: '83.3%'
        });
        $("#loaderIndicatorInstance").hide();
    }).error(function () {
        $("#loaderVariableFamily").hide();
        $('#errorMsg').html(errorMsg[language].error.request);
    });
}

function searchVariableFamilies() {
    $("#errorMsg").html("");
    $("#loaderVariableFamily").show();
    var variableFamilies = [];
    $("#selectVariable").parent().hide();
    $("#selectCodelist").parent().hide();
    $('#selectVariableFamily').html('').select2();
    endpoint = properties.endpoint['structural-resources'];
    if (endpoint[endpoint.length - 1] == "/") {
        endpoint = endpoint.substring(0, endpoint.lastIndexOf("/"));
    }
    url = endpoint + "/variablefamilies.json?limit=1000&orderBy=ID ASC";
    $.getJSON(url, function (resp) {
        if (resp.variableFamily) {
            for (var i = 0; i < resp.variableFamily.length; i++) {
                variableFamilies[i] = { id: resp.variableFamily[i].id, text: _.keyBy(resp.variableFamily[i].name.text, 'lang')[language].value };
            }
        }
        $('#selectVariableFamily').select2({
            data: _.sortBy(variableFamilies, 'text'),
            dropdownAutoWidth: true,
            width: '83.3%'
        });
        $("#loaderVariableFamily").hide();
        searchVariables();
    }).error(function () {
        $("#loaderVariableFamily").hide();
        $('#errorMsg').html(errorMsg[language].error.endpoint);
    });
}

function searchVariables() {
    $("#errorMsg").html("");
    $("#loaderVariable").show();
    document.getElementById("selectVariable").parentElement.style.display = "block";
    var variables = [];
    $("#selectCodelist").parent().hide();
    $("#selectVariable").html('').select2();
    url = endpoint + "/variablefamilies/" + document.getElementById("selectVariableFamily").value + "/variables.json?limit=1000&orderBy=ID ASC";
    $.getJSON(url, function (resp) {
        if (resp.variable) {
            for (var i = 0; i < resp.variable.length; i++) {
                variables[i] = { id: resp.variable[i].urn, text: _.keyBy(resp.variable[i].name.text, 'lang')[language].value };
            }
        }
        $("#selectVariable").select2({
            data: _.sortBy(variables, 'text'),
            dropdownAutoWidth: true,
            width: '83.3%'
        });
        $("#loaderVariable").hide();
        searchCodelists();
    }).error(function () {
        $("#loaderCodelist").hide();
        $("#errorMsg").html(errorMsg[language].error.request);
    });
}

var codelists = [];

function searchCodelists() {
    $("#errorMsg").html("");
    $("#loaderCodelist").show();
    document.getElementById("selectCodelist").parentElement.style.display = "block";
    codelists = [];
    $("#selectCodelist").html('').select2();
    url = endpoint + '/codelists.json?limit=1000&orderBy=ID ASC&query=VARIABLE_URN EQ "' + $("#selectVariable").val() + '" AND LATEST EQ "true"';
    $.getJSON(url, function (resp) {
        if (resp.codelist) {
            for (var i = 0; i < resp.codelist.length; i++) {
                codelists[i] = { id: resp.codelist[i].selfLink.href, text: _.keyBy(resp.codelist[i].name.text, 'lang')[language].value };
            }
        }
        $("#selectCodelist").select2({
            data: _.sortBy(codelists, 'text'),
            dropdownAutoWidth: true,
            width: '83.3%'
        });
        if ($("#decode").is(":checked")) {
            updateDecodelists();
        }
        $("#loaderCodelist").hide();
    }).error(function () {
        $("#loaderCodelist").hide();
        $("#errorMsg").html(errorMsg[language].error.request);
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
                return text[language].codelist.emptyDecodeCodelists;
            }
        }
    });
    $("#loaderDecode").hide();
}

function searchOperations() {
    $("#errorMsg").html("");
    $("#loaderOperation").show();
    document.getElementById("selectOperation").parentElement.style.display = "block";
    var operations = [];
    $("#selectOperation").html('').select2();
    endpoint = properties.endpoint.operations;
    if (endpoint[endpoint.length - 1] == "/") {
        endpoint = endpoint.substring(0, endpoint.lastIndexOf("/"));
    }
    $.getJSON(endpoint + "/operations.json?query=STATUS EQ \"" + properties.operations.status.production + "\"&limit=1000&orderBy=ID ASC", function (resp) {
        if (resp.operation) {
            for (var i = 0; i < resp.operation.length; i++) {
                operations[i] = { id: resp.operation[i].urn, text: _.keyBy(resp.operation[i].name.text, 'lang')[language].value };
            }
        }
        $("#selectOperation").select2({
            data: _.sortBy(operations, 'text'),
            dropdownAutoWidth: true,
            width: '83.3%'
        });
        $("#loaderOperation").hide();
        searchDatasets();
    }).error(function () {
        $("#loaderOperation").hide();
        $("#errorMsg").html(errorMsg[language].error.endpoint);
    });
}

function searchDatasets() {
    $("#errorMsg").html("");
    $("#loaderDataset").show();
    var datasets = [];
    $("#selectDataset").html('').select2();
    endpoint = properties.endpoint['statistical-resources'];
    if (endpoint[endpoint.length - 1] == "/") {
        endpoint = endpoint.substring(0, endpoint.lastIndexOf("/"));
    }
    url = endpoint + "/datasets.json?limit=1000&orderBy=ID ASC&query=STATISTICAL_OPERATION_URN EQ '" + $("#selectOperation").val() + "'";
    $.getJSON(url, function (resp) {
        if (resp.dataset) {
            for (var i = 0; i < resp.dataset.length; i++) {
                datasets[i] = {
                    id: resp.dataset[i].selfLink.href.substring(0, resp.dataset[i].selfLink.href.lastIndexOf('/')),
                    text: _.keyBy(resp.dataset[i].name.text, 'lang')[language].value
                };
            }
        }
        $("#selectDataset").select2({
            data: _.sortBy(_.uniqBy(datasets, 'id'), 'text'),
            dropdownAutoWidth: true,
            width: '83.3%'
        });
        $("#loaderDataset").hide();
        document.getElementById("selectDataset").parentElement.style.display = "block";
    }).error(function () {
        $("#loaderDataset").hide();
        $("#errorMsg").html(errorMsg[language].error.request);
    });
}

function enableAllLanguages() {
    if ($("#showLabels").is(":checked")) {
        $("#allLanguages").attr("disabled", false);
    } else {
        $("#allLanguages").attr("checked", false);
        $("#allLanguages").attr("disabled", true);
    }
}