package com.qiyu.application.catalog;

/** Outbound port for client-facing catalog content. */
public interface ClientCatalogGateway {
    /** Returns all client copy and display dictionaries in one stable payload. */
    ClientCatalogPayload clientCatalog();
}
