var language = "es";
var errorMsg = {
    "error": {
        "endpoint": "El endpoint indicado no existe",
        "request": "Ha ocurrido un error al realizar la petición",
        "indicator": {
            "url": "La URL del indicador no es válida"
        },
        "codelist": {
            "url": "La URL de la clasificación no es válida"
        },
        "dataset": {
            "url": {
                "invalid": "La URL del cubo no es válida",
                "unsupportedResourceType": "El tipo de recurso asociado a la URL no está soportado" // Este error nunca debe darse
            }
        },
        "submit": "Ha ocurrido un error, es posible que la URL indicada sea incorrecta"
    }
};

function loadTexts() {
    $("#titleForm").text("Seleccione los datos que desea obtener:");
    $("#labelIndicatorUrl").append("URL del indicador / instancia de indicador");
    $("#labelUrl").text("URL: ");
    $("#labelSelectIndicator").append("Seleccionar indicador");
    $.each($(".labelEndpoint"), function (_, endpoint) {
        $(endpoint).text("Endpoint:");
    });
    $("#searchIndicatorsButton").text("Buscar indicadores");
    $("#subjects").text("Temas");
    $("#indicators").text("Indicadores");
    $("#labelIndicatorInstance").append("Seleccionar instancia de indicador");
    $("#searchIndicatorSystemsButton").text("Buscar sistemas de indicadores");
    $("#indicatorSystems").text("Sistemas de indicadores:");
    $("#searchIndicatorInstancesButton").text("Buscar instancias de indicadores");
    $("#indicatorInstances").text("Instancias de indicadores");
    $("#responseFormat").text("Formato de respuesta:");
    $("#dataModel").prepend("Modelo de datos");
    $("#labelMeasureColumns").append("Visualizar las medidas como columnas");
    $("#labelStarModel").append("Modelo estrella");
    $("#labeling").prepend("Etiquetado");
    $("#labelRecodeDates").append("Incluir campo calculado con fecha a partir de periodos de referencia");
    $("#labelShowGranularity").append("Añadir las columnas \"Granularidad geográfica\" y \"Granularidad temporal\"");
    $("#labelShowLabels").append("Añadir las etiquetas geográficas y temporales al conjunto de datos");
    $("#labelAllLanguages").append("Añadir todos los idiomas");
    $("#dataButton").text("Obtener datos");
    $("#descIndicator").prepend("Este conector le permite cargar los datos de un indicador o de una instancia de indicador. Estos datos se publican originalmente a través de la ");
    $("#linkIndicatorAPI").attr("href", "http://www.gobiernodecanarias.org/istac/api/indicators/v1.0");
    $("#linkIndicatorAPI").text("API de indicadores");
    $("#descIndicator").append(".");
    $("#indicatorUse").text("A la hora de seleccionar los datos del indicador a cargar tiene varias opciones:");
    $("#liUrlIndicator").text("Introducir la URL de los datos que desea cargar. Esta URL debe ser una petición de las que finalizan en \"data\" de la API anteriormente mencionada.");
    $("#liCriteriaIndicator").text("Navegador por distintos criterios para seleccionar el recurso que desea cargar.");

    $("#descTableau").text("Tableau es una herramienta que permite crear visualizaciones de manera muy rápida sobre cualquier conjunto de datos. Con esta herramienta podrá crear sus propios cuadros de mandos y aprovechar así la potencia que le brinda Tableau para realizar análisis sobre los datos.");
    $("#descWDC").text("Los Web Data Connectors de Tableau permiten conectar la herramienta con datos externos para poder obtenerlos de manera automática y muy sencilla.");
    $("#olConnectors").text("En concreto los conectores disponibles están destinados a los siguientes fines:");
    $("#pIndicators").append("Permite obtener datos de cualquier indicador y/o instancia de indicador que se publica a través de eDatos.");
    $("#pDatasets").append("Permite obtener datos de cualquier dataset y/o consulta que se publica a través de eDatos. De la misma manera, este conector también permite la importación de ficheros que estén publicados haciendo uso del estándar JSONStat (https://json-stat.org/). Para hacer uso de esta opción bastará con que se especifique la URL en la que se publica el recurso en el formato indicado.");
    $("#pCodelists").append("Permite obtener cualquier clasificación publicada a través de eDatos. Estas clasificaciones son especialmente útiles puesto que son las utilizadas en la codificación de las variables de los datasets y las publicaciones.");
    $("#aIndicators").text("Indicadores");
    $("#aDatasets").text("Cubos");
    $("#aCodelists").text("Clasificaciones");

    $("#labelDatasetUrl").append("URL del cubo / consulta de datos");
    $("#labelSelectOperation").append("Seleccionar operación estadística");
    $("#searchOperationsButton").text("Buscar operaciones");
    $("#operations").text("Operaciones estadísticas:");
    $("#searchDatasetsButton").text("Buscar cubos");
    $("#datasets").text("Cubos: ");
    $("#labelShowLabelsDataset").append("Añadir las etiquetas de las dimensiones al conjunto de datos");
    $("#descDataset").prepend("Este conector le permite cargar los datos de un dataset o una consulta. Estos datos se publican originalmente a través de la ");
    $("#linkDatasetAPI").attr("href", "http://estadisticas.arte-consultores.com/statistical-resources/v1.0");
    $("#linkDatasetAPI").text("API de Recursos Estadísticos");
    $("#descDataset").append(".")
    $("#datasetUse").text("A la hora de seleccionar los datos a cargar disponemos de varias opciones:");
    $("#liUrlDataset").text("Introducir la URL de los datos que se desean cargar. Esta URL debe ser una petición para obtener un dataset o una query de la API. Además, en el caso de los datasets podrá hacer uso del parámetro \"dim\" para filtrar los datos a obtener y así reducir el tamaño de la respuesta.");
    $("#liOperationDataset").text("Navegar por operación estadística para seleccionar el dataset o query que desea cargar.");

    $("#downloadDecodeLabel").append("Indique la operación que desea realizar:");
    $("#labelDownloadCodelist").append("Descargar una clasificación");
    $("#labelDecodeCodelist").append("Recodificar una clasificación");
    $("#labelCodelistUrl").append("URL de la clasificación");
    $("#selectVariableLabel").append("Seleccionar variable");
    $("#searchVariableFamiliesButton").text("Buscar familias de variables");
    $("#families").text("Familias de variables:");
    $("#searchVariablesButton").text("Buscar variables");
    $("#variables").text("Variables:");
    $("#searchCodelistsButton").text("Buscar clasificaciones");
    $("#codelists").text("Clasificaciones:");
    $("#decodeCodelists").append("Clasificación a recodificar:");
    $("#decoding").prepend("Recodificación");
    $("#labelDecode").append("¿Desea realizar un recodificación?");
    $("#descCodelist").prepend("Este conector le permite cargar cualquiera de las clasificaciones que se utilizan para codificar sus variables/conceptos.");
    $("#linkCodelistAPI").attr("href", "http://www.gobiernodecanarias.org/istac/api/structural-resources");
    $("#linkCodelistAPI").text("API de Recursos Estructurales");
    $("#descCodelist").append(".");
    $("#codelistUse").text("A la hora de seleccionar la clasificación que se desea obtener disponemos de varias opciones:");
    $("#liUrlCodelist").text("Introducir la URL de los datos que se desea cargar. Esta URL debe ser una petición que devuelva los códigos de una clasificación y, por tanto, debe acabar en \"/codes\".");
    $("#liCriteriaCodelist").text("Navegar por distintos criterios para seleccionar el recurso que desea cargar.");
};