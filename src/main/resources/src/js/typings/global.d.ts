declare var tableau: any;

interface Window {
    dataLayer?: object[];
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

declare interface DataEntry {
    Codigo_geografico?: string;
    Codigo_temporal?: string;
    Codigo_medida?: string;
    Granularidad_geografica?: any;
    Etiqueta_geografica?: any;
    Fecha?: any;
    Granularidad_temporal?: any;
    Etiqueta_temporal?: any;
}