interface Parameter {
    key: string;
    parameters: {[key: string]: string | number};
}

interface Layout {
    header: Parameter;
    footer: Parameter;
}

interface MetadataKey {
    EXTERNAL: string;
    INTERNAL: string;
}

interface Operations {
    metadataKey: MetadataKey;
    version: string;
}

interface VersionedMetadataKey {
    metadataKey: string;
    version: string;
}

interface SimpleMetadataKey {
    metadataKey: string;
}

interface LayoutResources {
    metadataKey: Layout;
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
    indicators: VersionedMetadataKey;
    "structural-resources": StructuralResources;
    "statistical-resources": StatisticalResources;
    layout: LayoutResources;
    favicon: SimpleMetadataKey;
    cookie: SimpleMetadataKey;
    metadata: string;
    complementosApps: SimpleMetadataKey;
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