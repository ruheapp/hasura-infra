import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";

const cfg = new pulumi.Config();
const location = cfg.get("location") || "West US 2";

export const rg = new azure.core.ResourceGroup("ruhe-db", {
  location: location,
  name: cfg.require("resourceGroup")
});

export const dbServer = new azure.postgresql.Server("pg", {
  location: rg.location,
  resourceGroupName: rg.name,
  sku: {
    family: "Gen5",
    name: "B_Gen5_1",
    tier: "Basic",
    capacity: 1
  },
  sslEnforcement: "Disabled",
  administratorLogin: cfg.require("pguser"),
  administratorLoginPassword: cfg.requireSecret("pgpass"),
  storageProfile: {
    autoGrow: "Disabled",
    backupRetentionDays: 7,
    geoRedundantBackup: "Disabled",
    storageMb: 5120
  },
  version: "11"
});

export const db = new azure.postgresql.Database("pg-db", {
  resourceGroupName: rg.name,
  serverName: dbServer.name,
  charset: "utf8",
  collation: "en_US",
  name: cfg.get("dbname") || "ruhe"
});

const fw = new azure.postgresql.FirewallRule("pg-fw", {
  serverName: dbServer.name,
  name: "allow-azure-internal",
  startIpAddress: "0.0.0.0",
  endIpAddress: "0.0.0.0",
  resourceGroupName: rg.name
});

const appPlan = new azure.appservice.Plan("hasura", {
  location: rg.location,
  resourceGroupName: rg.name,
  kind: "Linux",
  reserved: true,
  sku: {
    size: "B1",
    tier: "Basic",
    capacity: 1
  }
});

const databaseUrl = pulumi
  .all([
    cfg.require("pguser"),
    cfg.getSecret("pgpass"),
    dbServer.name,
    dbServer.fqdn,
    db.name
  ])
  .apply(
    ([u, p, dbn, hn, n]) => `postgres://${u}%40${dbn}:${p}@${hn}:5432/${n}`
  );

export const appService = new azure.appservice.AppService("hasura", {
  appServicePlanId: appPlan.id,
  appSettings: {
    HASURA_GRAPHQL_DATABASE_URL: databaseUrl,
    HASURA_GRAPHQL_JWT_SECRET: `{"type":"RS512", "jwk_url": "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"}`,
    HASURA_GRAPHQL_ADMIN_SECRET: cfg.getSecret("pgpass"),
    HASURA_GRAPHQL_ENABLE_CONSOLE: `true`,
    HASURA_GRAPHQL_UNAUTHORIZED_ROLE: `anonymous`,
    WEBSITES_PORT: "8080"
  },
  siteConfig: {
    alwaysOn: true,
    linuxFxVersion: "DOCKER|hasura/graphql-engine:latest"
  },
  resourceGroupName: rg.name,
  location: rg.location
});
