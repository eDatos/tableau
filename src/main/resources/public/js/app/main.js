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
        $('#errorMsg').html("El endpoint indicado no existe");
    });
}

function searchIndicatorsSystems() {
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
        $('#errorMsg').html("El endpoint indicado no existe");
    });
}

function searchIndicatorsInstances() {
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
    });
}