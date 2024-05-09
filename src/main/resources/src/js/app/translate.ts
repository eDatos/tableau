var appTitle = "";
var errorMsg: any;
declare var Edatos:  { i18n: { getChosenLocaleCookie, getDefaultLanguage }}; 

var translationsLoaded = $.Deferred();

function initializeTranslations() {
    loadTranslations()
        .then(r => {
            console.info("Translations loaded");
            translationsLoaded.resolve();
        })
        .fail(() => {
            loadTranslations(getDefaultLanguage())
            .then(r => {
                console.info("Default translations loaded");
                translationsLoaded.resolve();
            })
            .fail(() => {
                translationsLoaded.reject();
            });
        });
}
    
function getLanguage(){     
    const langFromCookie = typeof Edatos !== 'undefined' ? Edatos.i18n.getChosenLocaleCookie() : null;
    if (!langFromCookie) {
        return getDefaultLanguage();
    } else {
        return langFromCookie;
    }
}

function getDefaultLanguage() {
    return typeof Edatos !== 'undefined' && typeof Edatos.i18n.getDefaultLanguage !== 'undefined' ? Edatos.i18n.getDefaultLanguage() : 'es';
}

//Solicitar el archivo de traducciones
function loadTranslations(lang?: string) {
    const language = lang || getLanguage();
    var deferred = $.Deferred();
    $.getJSON(`./i18n/${language}.json`, function(resp) {
        let translations = resp;
        loadTexts(translations);
        errorMsg = translations.errorMsg;
        appTitle = translations.tableau.title;
        deferred.resolve(translations);
    })
    .fail(function () {
        $("#errorMsg").html(errorMsg?.error.request);
        deferred.reject();
    });
    return deferred.promise();
}

// Cargar las traducciones
function loadTexts(translations) {
    $("#titleTableau").text(translations.tableau.title);
    $("#titleForm").text(translations.forms.dataSelectionHeader);
    $("#labelIndicatorUrl").text(translations.indicators.form.labels.indicatorUrl);
    $("#labelUrl").text(translations.indicators.form.labels.url);
    $("#labelSelectIndicator").text(translations.indicators.form.labels.selectIndicator);
    $.each($(".labelEndpoint"), function (_, endpoint) {
        $(endpoint).text("Endpoint:");
    });
    $("#searchIndicatorsButton").text(translations.indicators.buttons.searchIndicators);
    $("#subjects").text(translations.indicators.form.labels.subjects);
    $("#indicators").text(translations.indicators.form.labels.indicators);
    $("#labelIndicatorInstance").text(translations.indicators.form.labels.indicatorInstance);
    $("#searchIndicatorSystemsButton").text(translations.indicators.buttons.searchIndicatorsSystems);
    $("#indicatorSystems").text(translations.indicators.form.labels.indicatorsSystems);
    $("#searchIndicatorInstancesButton").text(translations.indicators.buttons.searchIndicatorsInstances);
    $("#indicatorInstances").text(translations.indicators.form.labels.indicatorsInstances);
    $("#responseFormat").text(translations.forms.responseFormatHeader);
    $("#dataModel").text(translations.forms.dataModel);
    $("#labelMeasureColumns").text(translations.indicators.form.labels.measureColumns);
    $("#labelStarModel").text(translations.indicators.form.labels.starModel);
    $("#labeling").text(translations.forms.labeling);
    $("#labelRecodeDates").text(translations.indicators.form.labels.recodeDates);
    $("#labelShowGranularity").text(translations.indicators.form.labels.showGranularity);
    $("#labelShowLabels").text(translations.indicators.form.labels.showLabels);
    $("#labelAllLanguages").text(translations.indicators.form.labels.allLanguages);
    $("#dataButton").text(translations.forms.button);
    $("#descIndicatorPre").text(translations.indicators.descIndicator);
    getProperties().then(properties => getEndpointMetadataValue(properties.endpoint.indicators).then(url => $("#linkIndicatorAPI").attr("href", url)));
    $("#linkIndicatorAPI").text(translations.indicators.linkIndicatorAPI);
    $("#descIndicatorPost").text(".");
    $("#indicatorUse").text(translations.indicators.indicatorUse);
    $("#liUrlIndicator").text(translations.indicators.liUrlIndicator);
    $("#liCriteriaIndicator").text(translations.indicators.liCriteriaIndicator);

    $("#descTableau").text(translations.tableau.descTableau);
    $("#descWDC").text(translations.tableau.descWDC);
    $("#olConnectors").text(translations.tableau.olConnectors);
    $("#pIndicators").html(translations.indicators.func);
    $("#pDatasets").html(translations.datasets.func);
    $("#pCodelists").html(translations.codelists.func);
    $("#aIndicators").text(translations.indicators.title);
    $("#aDatasets").text(translations.datasets.title);
    $("#aCodelists").text(translations.codelists.title);

    $("#labelDatasetUrl").text(translations.datasets.form.labels.datasetUrl);
    $("#labelSelectOperation").text(translations.datasets.form.labels.selectOperation);
    $("#searchOperationsButton").text(translations.datasets.buttons.searchOperations);
    $("#operations").text(translations.datasets.form.labels.operations);
    $("#searchDatasetsButton").text(translations.datasets.buttons.searchDatasets);
    $("#datasets").text(translations.datasets.form.labels.datasets);
    $("#labelShowLabelsDataset").text(translations.datasets.form.labels.showLabelsDataset);
    $("#descDatasetPre").text(translations.datasets.descDataset);
    getProperties().then(properties => getEndpointMetadataValue(properties.endpoint["statistical-resources"]).then(url => $("#linkDatasetAPI").attr("href", url)));
    $("#linkDatasetAPI").text(translations.datasets.linkDatasetAPI);
    $("#descDataset").text(".")
    $("#datasetUse").text(translations.datasets.datasetUse);
    $("#liUrlDataset").text(translations.datasets.liUrlDataset);
    $("#liOperationDataset").text(translations.datasets.liOperationDataset);

    $("#downloadDecodeLabel").text(translations.codelists.downloadDecodeLabel);
    $("#labelDownloadCodelist").text(translations.codelists.labelDownloadCodelist);
    $("#labelDecodeCodelist").text(translations.codelists.labelDecodeCodelist);
    $("#labelCodelistUrl").text(translations.codelists.form.labels.codelistUrl);
    $("#selectVariableLabel").text(translations.codelists.form.labels.selectVariable);
    $("#searchVariableFamiliesButton").text(translations.codelists.buttons.searchVariableFamilies);
    $("#families").text(translations.codelists.form.labels.families);
    $("#searchVariablesButton").text(translations.codelists.buttons.searchVariables);
    $("#variables").text(translations.codelists.form.labels.variables);
    $("#searchCodelistsButton").text(translations.codelists.buttons.searchCodelists);
    $("#codelists").text(translations.codelists.form.labels.codelist);
    $("#decodeCodelists").text(translations.codelists.form.labels.decodeCodelists);
    $("#decoding").text(translations.forms.decoding);
    $("#labelDecode").text(translations.codelists.form.labels.decode);
    $("#descCodelistPre").text(translations.codelists.descCodelist);
    getProperties().then(properties => getEndpointMetadataValue(properties.endpoint["structural-resources"]).then(url => $("#linkCodelistAPI").attr("href", url)));
    $("#linkCodelistAPI").text(translations.codelists.linkCodelistAPI);
    $("#descCodelistPost").text(".");
    $("#codelistUse").text(translations.codelists.codelistUse);
    $("#liUrlCodelist").text(translations.codelists.liUrlCodelist);
    $("#liCriteriaCodelist").text(translations.codelists.liCriteriaCodelist);

};