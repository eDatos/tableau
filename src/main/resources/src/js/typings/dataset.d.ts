interface DatasetMeasureColumn {
    dimension?: string;
    values?: any[];
}

interface DatasetsConnectionData extends CommonConnectionData {
    resourceType: "GPE_DATASET" | "STATISTICAL_RESOURCE_DATASET"
    dimensions: {};
    languages: string[];
    measureColumns: DatasetMeasureColumn;
    timeDimension: string;
}