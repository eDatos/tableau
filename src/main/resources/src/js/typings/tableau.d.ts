declare namespace Tableau {
    interface Column {

    }
    interface TableInfo {
        id: string;
        alias: string;
        columns: Column[];
    }

    interface Table {
        appendRows(tableData: DataEntry[]);
        tableInfo: TableInfo
    }
}

interface DataEntry {
    Codigo_geografico?: string;
    Codigo_temporal?: string;
    Codigo_medida?: string;
    Granularidad_geografica?: any;
    Etiqueta_geografica?: any;
    Fecha?: any;
    Granularidad_temporal?: any;
    Etiqueta_temporal?: any;
}