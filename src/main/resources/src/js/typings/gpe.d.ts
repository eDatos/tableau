declare namespace GPE {

    interface Category {
        variable: string;
        codes: string[];
        labels: string[];
    }

    interface Datum {
        Valor: string;
        dimCodes: string[];
    }

    interface Dataset {
        uuid: string;
        title: string;
        uriPx: string;
        stub: string[];
        heading: string[];
        categories: Category[];
        temporals: string[];
        spatials: string[];
        contVariable: string;
        notes: string[];
        source: string;
        surveyCode: string;
        surveyTitle: string;
        publishers: string[];
        data: Datum[];
    }

}

