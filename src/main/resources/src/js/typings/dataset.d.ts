interface DatasetMeasureColumn {
    dimension?: string;
    values?: any[];
}

interface DatasetsConnectionData extends CommonConnectionData {
    resourceType: ResourceType
    dimensions: {};
    languages: string[];
    measureColumns: DatasetMeasureColumn;
    timeDimension: string;
}