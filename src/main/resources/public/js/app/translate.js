var errorMsg;
$.getJSON("../translate/error.json", function(resp) {
    errorMsg = resp;
});

var text;
$.getJSON("../translate/text.json", function(resp) {
    text = resp;
    $("#titleForm").text(text['es'].form.title);
    $("#labelIndicatorUrl").append(text['es'].indicator.url);
    $("#labelUrl").text(text['es'].url);
    $("#labelSelectIndicator").append(text['es'].indicator.selectIndicator);
    $.each($(".labelEndpoint"), function(_, endpoint) {
        $(endpoint).text(text['es'].endpoint);
    });
    $("#searchIndicatorsButton").text(text['es'].indicator.search);
    $("#indicators").text(text['es'].indicator.indicators);
    $("#labelIndicatorInstance").append(text['es'].indicator.selectInstance);
    $("#searchIndicatorSystemsButton").text(text['es'].indicator.searchSystems);
    $("#indicatorSystems").text(text['es'].indicator.systems);
    $("#searchIndicatorInstancesButton").text(text['es'].indicator.searchInstances);
    $("#indicatorInstances").text(text['es'].indicator.instances);
    $("#responseFormat").text(text['es'].responseFormat);
    $("#labelShowGranularity").append(text['es'].indicator.showGranularity);
    $("#labelShowLabels").append(text['es'].indicator.showLabels);
    $("#dataButton").text(text['es'].getData);
    $("#descIndicator").prepend(text['es'].indicator.desc);
    $("#linkIndicatorAPI").attr("href", text['es'].indicator.apiLink);
    $("#linkIndicatorAPI").text(text['es'].indicator.api);
    $("#descIndicator").append(".");
    $("#indicatorUse").text(text['es'].indicator.use);
    $("#liUrlIndicator").text(text['es'].indicator.li.url);
    $("#liCriteriaIndicator").text(text['es'].indicator.li.criteria);

    $("#titleWDC").text(text['es'].home.title);
    $("#descTableau").text(text['es'].home.descTableau);
    $("#descWDC").text(text['es'].home.descWDC);
    $("#descIstac").text(text['es'].home.descIstac);
    $("#olConnectors").text(text['es'].home.olConnectors);
    $("#liIndicators").append(text['es'].home.li.indicators);
    $("#liDatasets").append(text['es'].home.li.datasets);
    $("#liCodelists").append(text['es'].home.li.codelists);
    $("#aIndicators").text(text['es'].indicator.navbar);
    $("#aDatasets").text(text['es'].dataset.navbar);
    $("#aCodelists").text(text['es'].codelist.navbar);

    $("#labelDatasetUrl").append(text['es'].dataset.url);
    $("#descDataset").prepend(text['es'].dataset.desc);
    $("#linkDatasetAPI").attr("href", text['es'].dataset.apiLink);
    $("#linkDatasetAPI").text(text['es'].dataset.api);
    $("#descDataset").append(".")
    $("#datasetUse").text(text['es'].dataset.use);
    $("#liUrlDataset").text(text['es'].dataset.li.url);
    $("#liOperationDataset").text(text['es'].dataset.li.operation);

    $("#labelCodelistUrl").append(text['es'].codelist.url);
    $("#selectVariableLabel").append(text['es'].codelist.selectVariable);
    $("#searchVariableFamiliesButton").text(text['es'].codelist.searchVariableFamilies);
    $("#families").text(text['es'].codelist.families);
    $("#searchVariablesButton").text(text['es'].codelist.searchVariables);
    $("#variables").text(text['es'].codelist.variables);
    $("#searchCodelistsButton").text(text['es'].codelist.searchCodelists);
    $("#codelists").text(text['es'].codelist.codelists);
    $("#descCodelist").prepend(text['es'].codelist.desc);
    $("#linkCodelistAPI").attr("href", text['es'].codelist.apiLink);
    $("#linkCodelistAPI").text(text['es'].codelist.api);
    $("#descCodelist").append(".");
    $("#codelistUse").text(text['es'].codelist.use);
    $("#liUrlCodelist").text(text['es'].codelist.li.url);
    $("#liCriteriaCodelist").text(text['es'].codelist.li.criteria);
});