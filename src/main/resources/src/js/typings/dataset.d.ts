interface DatasetMeasureColumn {
    dimension?: string;
    values?: any[];
}

interface DatasetsConnectionData extends CommonConnectionData {
    dimensions: {};
    languages: string[];
    measureColumns: DatasetMeasureColumn;
    timeDimension: string;
}