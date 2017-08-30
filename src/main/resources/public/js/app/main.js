function datosObtener(radio) {
    var radioDivs = document.getElementsByClassName("radioDiv");
    for (var i = 0; i < radioDivs.length; i++) {
        if (radioDivs[i].id != radio.value) {
            radioDivs[i].style.display = "none";
        } else {
            radioDivs[i].style.display = "block";
        }
    }
}

function buscarIndicadores() {
    var indicadores = [];
    $.getJSON(document.getElementById("inputEndpointIndicador").value + "/indicators", function(resp) {
        for (var i = 0; i < resp.items.length; i++) {
            indicadores[i] = {id: resp.items[i].id, text: resp.items[i].id};
        }
        $('#selectIndicador').select2({
            data: indicadores,
            dropdownAutoWidth : true,            
            width: '83.3%'
        });
        document.getElementById("selectIndicador").parentElement.style.display = "block";
    });
}

function buscarSistemasIndicadores() {
    var sistemasIndicadores = [];
    $.getJSON(document.getElementById("inputEndpointSistemaIndicador").value + "/indicatorsSystems", function(resp) {
        for (var i = 0; i < resp.items.length; i++) {
            sistemasIndicadores[i] = {id: resp.items[i].id, text: resp.items[i].id};
        }
        $('#selectSistemaIndicador').select2({
            data: sistemasIndicadores,
            dropdownAutoWidth : true,            
            width: '83.3%'
        });
        document.getElementById("selectSistemaIndicador").parentElement.style.display = "block";
    });
}

function buscarInstanciasIndicadores() {
    var instanciasIndicadores = [];
    url = document.getElementById("inputEndpointSistemaIndicador").value + "/indicatorsSystems/" + document.getElementById("selectSistemaIndicador").value + "/indicatorsInstances";
    $.getJSON(url, function(resp){
        for (var i = 0; i < resp.items.length; i++) {
            instanciasIndicadores[i] = {id: resp.items[i].id, text: resp.items[i].id};
        }
        $('#selectInstanciaIndicador').select2({
            data: instanciasIndicadores,
            dropdownAutoWidth : true,            
            width: '83.3%'
        });
        document.getElementById("selectInstanciaIndicador").parentElement.style.display = "block";
        });
}