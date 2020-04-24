interface CodelistsConnectionData extends BaseConnectionData {
    decodeOptionEnabled: boolean,
    urlDecodeCodelist: string,
    codelist01Tablename: string,
    codelist02Tablename: string,
    languages: string[]
}

interface CodelistDataEntry {
    Codigo_origen?: string
    Codigo_recodificado?: string,
    Padre_origen?: string,
    Padre_recodificado?: string,
    Nombre_origen?: string,
    Nombre_recodificado?: string
}