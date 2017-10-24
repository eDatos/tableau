var language = navigator.language.substr(0, 2);

var errorMsg;
$.getJSON("translate/error.json", function(resp) {
    errorMsg = resp;
});

var text;
$.getJSON("translate/text.json", function(resp) {
    text = resp;
    $("#titleForm").text(text[language].form.title);
    $("#labelIndicatorUrl").append(text[language].indicator.url);
    $("#labelUrl").text(text[language].url);
    $("#labelSelectIndicator").append(text[language].indicator.selectIndicator);
    $.each($(".labelEndpoint"), function(_, endpoint) {
        $(endpoint).text(text[language].endpoint);
    });
    $("#searchIndicatorsButton").text(text[language].indicator.search);
    $("#indicators").text(text[language].indicator.indicators);
    $("#labelIndicatorInstance").append(text[language].indicator.selectInstance);
    $("#searchIndicatorSystemsButton").text(text[language].indicator.searchSystems);
    $("#indicatorSystems").text(text[language].indicator.systems);
    $("#searchIndicatorInstancesButton").text(text[language].indicator.searchInstances);
    $("#indicatorInstances").text(text[language].indicator.instances);
    $("#responseFormat").text(text[language].responseFormat);
    $("#labelShowGranularity").append(text[language].indicator.showGranularity);
    $("#labelShowLabels").append(text[language].indicator.showLabels);
    $("#labelAllLanguages").append(text[language].indicator.allLanguages);
    $("#labelMeasureColumns").append(text[language].measureColumns);
    $("#labelRecodeDates").append(text[language].recodeDates);
    $("#dataButton").text(text[language].getData);
    $("#descIndicator").prepend(text[language].indicator.desc);
    $("#linkIndicatorAPI").attr("href", text[language].indicator.apiLink);
    $("#linkIndicatorAPI").text(text[language].indicator.api);
    $("#descIndicator").append(".");
    $("#indicatorUse").text(text[language].indicator.use);
    $("#liUrlIndicator").text(text[language].indicator.li.url);
    $("#liCriteriaIndicator").text(text[language].indicator.li.criteria);

    $("#titleWDC").text(text[language].home.title);
    $("#descTableau").text(text[language].home.descTableau);
    $("#descWDC").text(text[language].home.descWDC);
    $("#descIstac").text(text[language].home.descIstac);
    $("#olConnectors").text(text[language].home.olConnectors);
    $("#liIndicators").append(text[language].home.li.indicators);
    $("#liDatasets").append(text[language].home.li.datasets);
    $("#liCodelists").append(text[language].home.li.codelists);
    $("#aIndicators").text(text[language].indicator.navbar);
    $("#aDatasets").text(text[language].dataset.navbar);
    $("#aCodelists").text(text[language].codelist.navbar);

    $("#labelDatasetUrl").append(text[language].dataset.url);
    $("#labelSelectOperation").append(text[language].dataset.selectOperation);
    $("#searchOperationsButton").text(text[language].dataset.searchOperations);
    $("#operations").text(text[language].dataset.operations);
    $("#searchDatasetsButton").text(text[language].dataset.searchDatasets);
    $("#datasets").text(text[language].dataset.datasets);
    $("#labelShowLabelsDataset").append(text[language].dataset.labels);
    $("#descDataset").prepend(text[language].dataset.desc);
    $("#linkDatasetAPI").attr("href", text[language].dataset.apiLink);
    $("#linkDatasetAPI").text(text[language].dataset.api);
    $("#descDataset").append(".")
    $("#datasetUse").text(text[language].dataset.use);
    $("#liUrlDataset").text(text[language].dataset.li.url);
    $("#liOperationDataset").text(text[language].dataset.li.operation);

    $("#downloadDecodeLabel").append(text[language].codelist.downloadDecodeLabel);
    $("#labelDownloadCodelist").append(text[language].codelist.downloadCodelistOption);
    $("#labelDecodeCodelist").append(text[language].codelist.decodeCodelistOption);    
    $("#labelCodelistUrl").append(text[language].codelist.url);
    $("#selectVariableLabel").append(text[language].codelist.selectVariable);
    $("#searchVariableFamiliesButton").text(text[language].codelist.searchVariableFamilies);
    $("#families").text(text[language].codelist.families);
    $("#searchVariablesButton").text(text[language].codelist.searchVariables);
    $("#variables").text(text[language].codelist.variables);
    $("#searchCodelistsButton").text(text[language].codelist.searchCodelists);
    $("#codelists").text(text[language].codelist.codelists);
    $("#descCodelist").prepend(text[language].codelist.desc);
    $("#linkCodelistAPI").attr("href", text[language].codelist.apiLink);
    $("#linkCodelistAPI").text(text[language].codelist.api);
    $("#descCodelist").append(".");
    $("#codelistUse").text(text[language].codelist.use);
    $("#liUrlCodelist").text(text[language].codelist.li.url);
    $("#liCriteriaCodelist").text(text[language].codelist.li.criteria);
});