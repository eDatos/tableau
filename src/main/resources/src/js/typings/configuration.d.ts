interface MetadataKey {
    EXTERNAL: string;
    INTERNAL: string;
}

interface Operations {
    metadataKey: MetadataKey;
    version: string;
}

interface Indicators {
    metadataKey: string;
    version: string;
}

interface StructuralResources {
    metadataKey: MetadataKey;
    version: string;
}

interface StatisticalResources {
    metadataKey: MetadataKey;
    version: string;
}

interface Endpoint {
    operations: Operations;
    indicators: Indicators;
    "structural-resources": StructuralResources;
    "statistical-resources": StatisticalResources;
    metadata: string;
    complementosApps: string;
}

interface Status {
    production: string;
}

interface OperationsStatus {
    status: Status;
}

interface Configuration {
    endpoint: Endpoint;
    operations: OperationsStatus;
    installationEnvironmentType: "INTERNAL" | "EXTERNAL";
}