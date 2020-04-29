declare var tableau: any;

interface Window {
    dataLayer: object[];
}

interface BaseConnectionData {
    url: string;
    allLanguages: boolean;
}

interface CommonConnectionData extends BaseConnectionData {
    name: string;
    labels: boolean;
    observationId: string;
    timeLanguages: string[];
    showMeasureColumns: boolean;
    starModel: boolean;
    recodeDates: boolean;
}
