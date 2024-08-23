'use strict';
var metadatasLoaded = {};

function getMetadataValue(metadataKey: string, data: { [key: string]: any } = null): JQuery.Promise<string> {
    var deferred = $.Deferred();
    if (metadatasLoaded.hasOwnProperty(metadataKey)) {
        return deferred.resolve(metadatasLoaded[metadataKey]).promise();
    }
    getProperties().then(properties => {
        $.getJSON(properties.endpoint.metadata + 'properties/' + metadataKey + '.json')
            .done(function (response) {
                metadatasLoaded[metadataKey] = response.value;
                let queryUrl = response.value;
                if (data && !_.isEmpty(data)) {
                    queryUrl += "?" + $.param(data);
                }
                deferred.resolve(queryUrl);
            });
    });
    return deferred.promise();
}

function getEndpointMetadataValue(endpointInfo) {
    var metadataKey = endpointInfo.metadataKey;
    var deferred = $.Deferred();

    getProperties().then(properties => {
        if (typeof endpointInfo.metadataKey === 'object') {
            metadataKey = endpointInfo.metadataKey[properties.installationEnvironmentType];
        }

        if (!metadataKey) {
            console.error('Endpoint metadata key is null');
        }

        getMetadataValue(metadataKey)
            .done(function (endpointValue) {
                endpoint = endpointValue + '/' + endpointInfo.version;
                deferred.resolve(endpoint);
            });
    });
    return deferred.promise();
}

function getProperties(): JQuery.jqXHR<Configuration> {
    return $.getJSON("config/properties.json").promise();
}

function getHeaderUrl(): JQuery.Promise<string> {
    return getProperties()
        .then(prop => getMetadataValue(
            prop.endpoint.layout.metadataKey.header.key,
            prop.endpoint.layout.metadataKey.header.parameters),
        );
}

function getFooterUrl(): JQuery.Promise<string> {
    return getProperties()
        .then(prop => getMetadataValue(
            prop.endpoint.layout.metadataKey.footer.key,
            prop.endpoint.layout.metadataKey.footer.parameters),
        );
}

function getFaviconUrl(): JQuery.Promise<string> {
    return getProperties().then(prop => getMetadataValue(prop.endpoint.favicon.metadataKey));
}

function getInternationalizationCookieName(): JQuery.Promise<string> {
    return getProperties().then(prop =>
        getMetadataValue(prop.endpoint.cookie.metadataKey)
    );
}

function getLanguages(): JQuery.Promise<string> {
    return getProperties().then(prop =>
        getMetadataValue(prop.endpoint.languages.metadataKey)
    );
}

function loadHtmlFromUrlIn(id: string, url: string, callback: () => void) {
    $.ajax({
        url: url,
        dataType: 'html',
        async: false,
        success: function(html) {
            const slotHtml = document.createRange().createContextualFragment(html);
            document.getElementById(id).innerHTML = '';
            document.getElementById(id).append(slotHtml);
            callback();
        }
    });
}
