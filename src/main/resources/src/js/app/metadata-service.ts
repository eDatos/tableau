'use strict';
var metadatasLoaded = {};

function getMetadataValue(metadataKey: string, data: { [key: string]: any } = null): JQuery.Promise<string> {
    var deferred = $.Deferred();
    if (metadatasLoaded.hasOwnProperty(metadataKey)) {
        return deferred.resolve(metadatasLoaded[metadataKey]).promise();
    }
    getProperties().then(properties => {
        $.getJSON(properties.endpoint.metadata + 'properties/' + metadataKey + '.json', data)
            .done(function (response) {
                metadatasLoaded[metadataKey] = response.value;
                deferred.resolve(response.value);
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