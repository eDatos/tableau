var language = window.navigator.language.substr(0, 2);
var appTitle = "";
var errorMsg: any;

var translationsLoaded = $.Deferred();

getLanguage().then(lang => {
    loadTranslations(lang)
        .then(r => {
            console.info("Translations loaded");
            translationsLoaded.resolve();
        })
        .fail(() => {
            //  No file for navigator language - show default language
            getDefaultLanguage().then(defaultLanguage => {
                loadTranslations(defaultLanguage);
            });
        });
});

//obtener el valor de la cookie
const getCookieValue = (name) => (
    document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || ''
);

function getLanguage(){
    return getInternationalizationCookieName().then(cookieName => {
        const langFromCookie = getCookieValue(cookieName);
        if (langFromCookie === '') {
            //  No cookie - show navigator language
            return window.navigator.language.substr(0, 2); // from strings like ["en-US", "zh-CN", "ja-JP"] we are only interested in the language part, not the country
        } else {
            return getDefaultLanguage();
        }
    });
}

function getDefaultLanguage() {
    var deferred = $.Deferred();
    getLanguages().done(function(languages) {
        if (languages.length !== 0) {
            var arrayLanguages = languages.split(",", 1);

            deferred.resolve(arrayLanguages[0]);
        }
    });
    return deferred.promise();
}

//Solicitar el archivo de traducciones
function loadTranslations(language: string) {
    var deferred = $.Deferred();
    $.getJSON(`./i18n/${language}.json`, function(resp) {
        let translations = resp;
        loadTexts(translations);
        errorMsg = translations.errorMsg;
        appTitle = translations.tableau.title;
        deferred.resolve(translations);
    })
    .fail(function () {
        $("#errorMsg").html(errorMsg.error.request);
        deferred.reject();
    });
    return deferred.promise();
}

// Cargar las traducciones
function loadTexts(translations) {
    $("#titleTableau").text(translations.tableau.title);
    $("#titleForm").text(translations.forms.dataSelectionHeader);
    $("#labelIndicatorUrl").append(translations.indicators.form.labels.indicatorUrl);
    $("#labelUrl").text(translations.indicators.form.labels.url);
    $("#labelSelectIndicator").append(translations.indicators.form.labels.selectIndicator);
    $.each($(".labelEndpoint"), function (_, endpoint) {
        $(endpoint).text("Endpoint:");
    });
    $("#searchIndicatorsButton").text(translations.indicators.buttons.searchIndicators);
    $("#subjects").text(translations.indicators.form.labels.subjects);
    $("#indicators").text(translations.indicators.form.labels.indicators);
    $("#labelIndicatorInstance").append(translations.indicators.form.labels.indicatorInstance);
    $("#searchIndicatorSystemsButton").text(translations.indicators.buttons.searchIndicatorsSystems);
    $("#indicatorSystems").text(translations.indicators.form.labels.indicatorsSystems);
    $("#searchIndicatorInstancesButton").text(translations.indicators.buttons.searchIndicatorsInstances);
    $("#indicatorInstances").text(translations.indicators.form.labels.indicatorsInstances);
    $("#responseFormat").text(translations.forms.responseFormatHeader);
    $("#dataModel").prepend(translations.forms.dataModel);
    $("#labelMeasureColumns").append(translations.indicators.form.labels.measureColumns);
    $("#labelStarModel").append(translations.indicators.form.labels.starModel);
    $("#labeling").prepend(translations.forms.labeling);
    $("#labelRecodeDates").append(translations.indicators.form.labels.recodeDates);
    $("#labelShowGranularity").append(translations.indicators.form.labels.showGranularity);
    $("#labelShowLabels").append(translations.indicators.form.labels.showLabels);
    $("#labelAllLanguages").append(translations.indicators.form.labels.allLanguages);
    $("#dataButton").text(translations.forms.button);
    $("#descIndicator").prepend(translations.indicators.descIndicator);
    getProperties().then(properties => getEndpointMetadataValue(properties.endpoint.indicators).then(url => $("#linkIndicatorAPI").attr("href", url)));
    $("#linkIndicatorAPI").text(translations.indicators.linkIndicatorAPI);
    $("#descIndicator").append(".");
    $("#indicatorUse").text(translations.indicators.indicatorUse);
    $("#liUrlIndicator").text(translations.indicators.liUrlIndicator);
    $("#liCriteriaIndicator").text(translations.indicators.liCriteriaIndicator);

    $("#descTableau").text(translations.tableau.descTableau);
    $("#descWDC").text(translations.tableau.descWDC);
    $("#olConnectors").text(translations.tableau.olConnectors);
    $("#pIndicators").append(translations.indicators.func);
    $("#pDatasets").append(translations.datasets.func);
    $("#pCodelists").append(translations.codelists.func);
    $("#aIndicators").text(translations.indicators.title);
    $("#aDatasets").text(translations.datasets.title);
    $("#aCodelists").text(translations.codelists.title);

    $("#labelDatasetUrl").append(translations.datasets.form.labels.datasetUrl);
    $("#labelSelectOperation").append(translations.datasets.form.labels.selectOperation);
    $("#searchOperationsButton").text(translations.datasets.buttons.searchOperations);
    $("#operations").text(translations.datasets.form.labels.operations);
    $("#searchDatasetsButton").text(translations.datasets.buttons.searchDatasets);
    $("#datasets").text(translations.datasets.form.labels.datasets);
    $("#labelShowLabelsDataset").append(translations.datasets.form.labels.showLabelsDataset);
    $("#descDataset").prepend(translations.datasets.descDataset);
    getProperties().then(properties => getEndpointMetadataValue(properties.endpoint["statistical-resources"]).then(url => $("#linkDatasetAPI").attr("href", url)));
    $("#linkDatasetAPI").text(translations.datasets.linkDatasetAPI);
    $("#descDataset").append(".")
    $("#datasetUse").text(translations.datasets.datasetUse);
    $("#liUrlDataset").text(translations.datasets.liUrlDataset);
    $("#liOperationDataset").text(translations.datasets.liOperationDataset);

    $("#downloadDecodeLabel").append(translations.codelists.downloadDecodeLabel);
    $("#labelDownloadCodelist").append(translations.codelists.labelDownloadCodelist);
    $("#labelDecodeCodelist").append(translations.codelists.labelDecodeCodelist);
    $("#labelCodelistUrl").append(translations.codelists.form.labels.codelistUrl);
    $("#selectVariableLabel").append(translations.codelists.form.labels.selectVariable);
    $("#searchVariableFamiliesButton").text(translations.codelists.buttons.searchVariableFamilies);
    $("#families").text(translations.codelists.form.labels.families);
    $("#searchVariablesButton").text(translations.codelists.buttons.searchVariables);
    $("#variables").text(translations.codelists.form.labels.variables);
    $("#searchCodelistsButton").text(translations.codelists.buttons.searchCodelists);
    $("#codelists").text(translations.codelists.form.labels.codelist);
    $("#decodeCodelists").append(translations.codelists.form.labels.decodeCodelists);
    $("#decoding").prepend(translations.forms.decoding);
    $("#labelDecode").append(translations.codelists.form.labels.decode);
    $("#descCodelist").prepend(translations.codelists.descCodelist);
    getProperties().then(properties => getEndpointMetadataValue(properties.endpoint["structural-resources"]).then(url => $("#linkCodelistAPI").attr("href", url)));
    $("#linkCodelistAPI").text(translations.codelists.linkCodelistAPI);
    $("#descCodelist").append(".");
    $("#codelistUse").text(translations.codelists.codelistUse);
    $("#liUrlCodelist").text(translations.codelists.liUrlCodelist);
    $("#liCriteriaCodelist").text(translations.codelists.liCriteriaCodelist);

};