function chooseDataOption(radio) {
    var radioDivs = document.getElementsByClassName("radioDiv");
    for (var i = 0; i < radioDivs.length; i++) {
        if (radioDivs[i].id != radio.value) {
            radioDivs[i].style.display = "none";
        } else {
            radioDivs[i].style.display = "block";
        }
    }
    $('#errorMsg').html("");
}

function searchIndicators() {
    $("#errorMsg").html("");
    $("#loaderIndicator").show();
    var indicators = [];
    $('#selectIndicator').html('').select2();
    $.getJSON(document.getElementById("inputEndpointIndicator").value + "/indicators?limit=1000", function(resp) {
        $('#errorMsg').html("");
        for (var i = 0; i < resp.items.length; i++) {
            indicators[i] = {id: resp.items[i].id, text: resp.items[i].title.__default__};
        }
        $('#selectIndicator').select2({
            data: indicators,
            dropdownAutoWidth : true,            
            width: '83.3%'
        });
        $("#loaderIndicator").hide();
        document.getElementById("selectIndicator").parentElement.style.display = "block";
    }).error(function() {
        $("#loaderIndicator").hide();
        $('#errorMsg').html(errorMsg['es'].error.endpoint);
    });
}

function searchIndicatorsSystems() {
    $("#errorMsg").html("");
    $("#loaderIndicatorSystem").show();
    document.getElementById("selectIndicatorInstance").parentElement.style.display = "none";
    var indicatorsSystems = [];
    $('#selectIndicatorSystem').html('').select2();
    $.getJSON(document.getElementById("inputEndpointIndicatorSystem").value + "/indicatorsSystems?limit=1000", function(resp) {
        $('#errorMsg').html("");
        for (var i = 0; i < resp.items.length; i++) {
            indicatorsSystems[i] = {id: resp.items[i].id, text: resp.items[i].title.__default__};
        }
        $('#selectIndicatorSystem').select2({
            data: indicatorsSystems,
            dropdownAutoWidth : true,            
            width: '83.3%'
        });
        $("#loaderIndicatorSystem").hide();
        document.getElementById("selectIndicatorSystem").parentElement.style.display = "block";
        document.getElementById("selectIndicatorSystemButton").style.display = "block";
    }).error(function() {
        $("#loaderIndicatorSystem").hide();
        $('#errorMsg').html(errorMsg['es'].error.endpoint);
    });
}

function searchIndicatorsInstances() {
    $("#errorMsg").html("");
    $("#loaderIndicatorInstance").show();
    var indicatorsInstances = [];
    $('#selectIndicatorInstance').html('').select2();
    url = document.getElementById("inputEndpointIndicatorSystem").value + "/indicatorsSystems/" + document.getElementById("selectIndicatorSystem").value + "/indicatorsInstances?limit=1000";
    $.getJSON(url, function(resp){
        for (var i = 0; i < resp.items.length; i++) {
            indicatorsInstances[i] = {id: resp.items[i].id, text: resp.items[i].title.__default__};
        }
        $('#selectIndicatorInstance').select2({
            data: indicatorsInstances,
            dropdownAutoWidth : true,            
            width: '83.3%'
        });
        $("#loaderIndicatorInstance").hide();
        document.getElementById("selectIndicatorInstance").parentElement.style.display = "block";
    }).error(function() {
        $("#loaderVariableFamily").hide();
        $('#errorMsg').html(errorMsg['es'].error.request);
    });
}

function searchVariableFamilies() {
    $("#errorMsg").html("");
    $("#loaderVariableFamily").show();
    var variableFamilies = [];
    $("#selectVariable").parent().hide();
    $("#selectCodelist").parent().hide();
    $('#selectVariableFamily').html('').select2();
    url = document.getElementById("inputEndpointVariableFamily").value + "/variablefamilies.json?limit=1000";
    $.getJSON(url, function(resp){
        for (var i = 0; i < resp.variableFamily.length; i++) {
            variableFamilies[i] = {id: resp.variableFamily[i].id, text: _.keyBy(resp.variableFamily[i].name.text, 'lang')['es'].value};
        }
        $('#selectVariableFamily').select2({
            data: variableFamilies,
            dropdownAutoWidth : true,            
            width: '83.3%'
        });
        $("#loaderVariableFamily").hide();
        document.getElementById("selectVariableFamily").parentElement.style.display = "block";
        document.getElementById("selectVaribleFamilyButton").style.display = "block";
    }).error(function() {
        $("#loaderVariableFamily").hide();
        $('#errorMsg').html(errorMsg['es'].error.endpoint);
    });
}

function searchVariables() {
    $("#errorMsg").html("");
    $("#loaderVariable").show();
    var variables = [];
    $("#selectCodelist").parent().hide();
    $("#selectVariable").html('').select2();
    url = document.getElementById("inputEndpointVariableFamily").value + "/variablefamilies/" + document.getElementById("selectVariableFamily").value + "/variables.json?limit=1000";
    $.getJSON(url, function(resp) {
        for (var i = 0; i < resp.variable.length; i++) {
            variables[i] = {id: resp.variable[i].urn, text: _.keyBy(resp.variable[i].name.text, 'lang')['es'].value};
        }
        $("#selectVariable").select2({
            data: variables,
            dropdownAutoWidth : true,
            width: '83.3%'
        });
        $("#loaderVariable").hide();
        document.getElementById("selectVariable").parentElement.style.display = "block";
        document.getElementById("selectVariableButton").style.display = "block";
    }).error(function() {
        $("#loaderCodelist").hide();
        $("#errorMsg").html(errorMsg['es'].error.request);
    });
}

function searchCodelists() {
    $("#errorMsg").html("");
    $("#loaderCodelist").show();
    var codelists = [];
    $("#selectCodelist").html('').select2();
    url = $("#inputEndpointVariableFamily").val() + '/codelists.json?limit=1000&query=VARIABLE_URN EQ "' + $("#selectVariable").val() +'" AND LATEST EQ "true"';
    $.getJSON(url, function(resp) {
        for (var i = 0; i < resp.codelist.length; i++) {
            codelists[i] = {id: resp.codelist[i].selfLink.href, text: _.keyBy(resp.codelist[i].name.text, 'lang')['es'].value};
        }
        $("#selectCodelist").select2({
            data: codelists,
            dropdownAutoWidth : true,
            width: '83.3%'
        });
        $("#loaderCodelist").hide();
        document.getElementById("selectCodelist").parentElement.style.display = "block";
    }).error(function() {
        $("#loaderCodelist").hide();
        $("#errorMsg").html(errorMsg['es'].error.request);
    });
}

function searchOperations() {
    $("#errorMsg").html("");
    $("#loaderOperation").show();
    var operations = [];
    $("#selectOperation").html('').select2();
    $.getJSON($("#inputEndpointOperation").val() + "/operations.json?limit=1000", function(resp) {
       for (var i = 0; i < resp.operation.length; i++) {
           operations[i] = {id: resp.operation[i].urn, text: _.keyBy(resp.operation[i].name.text, 'lang')['es'].value};
       }
       $("#selectOperation").select2({
           data: operations,
           dropdownAutoWidth: true,
           width: '83.3%'
       });
       $("#loaderOperation").hide();
       document.getElementById("selectOperation").parentElement.style.display = "block";
       document.getElementById("selectDatasetButton").style.display = "block";
    }).error(function() {
        $("#loaderOperation").hide();
        $("#errorMsg").html(errorMsg['es'].error.endpoint);
    });
}

function searchDatasets() {
    $("#errorMsg").html("");
    $("#loaderDataset").show();
    var datasets = [];
    $("#selectDataset").html('').select2();
    url = $("#inputEndpointOperation").val().replace("operations", "statistical-resources") + "/datasets.json?limit=1000&query=STATISTICAL_OPERATION_URN EQ '" + $("#selectOperation").val() + "'";
    $.getJSON(url, function(resp) {
        if (resp.dataset) {
            for (var i = 0; i < resp.dataset.length; i++) {
                datasets[i] = {
                    id: resp.dataset[i].selfLink.href.substring (0, resp.dataset[i].selfLink.href.lastIndexOf('/')), 
                    text: _.keyBy(resp.dataset[i].name.text, 'lang')['es'].value};
            }
        }
        $("#selectDataset").select2({
            data: _.uniqBy(datasets, 'id'),
            dropdownAutoWidth: true,
            width: '83.3%'
        });
        $("#loaderDataset").hide();
        document.getElementById("selectDataset").parentElement.style.display = "block";
    }).error(function() {
        $("#loaderDataset").hide();
        $("#errorMsg").html(errorMsg['es'].error.request);  
    });
}