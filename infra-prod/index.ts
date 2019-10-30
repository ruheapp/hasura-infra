import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";
//import * as pg from "@pulumi/postgresql";

const cfg = new pulumi.Config();
const location = cfg.get("location") || "West US 2";

export const rg = new azure.core.ResourceGroup("ruhe-db", {
  location: location,
  name: cfg.require("resourceGroup")
});

export const dbServer = new azure.postgresql.Server("pg", {
  name: "pg",
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
  name: "hasura-plan",
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

/*
const network = new docker.Network("net");

const pgImg = new docker.RemoteImage("postgresql-image", {
  name: "postgres:11",
  keepLocally: true
});

const pgVol = new docker.Volume("pgdata");

export const pgContainer = new docker.Container("postgres", {
  image: pgImg.name,
  networksAdvanced: [{ name: network.name }],
  restart: "on-failure",
  volumes: [
    { volumeName: pgVol.name, containerPath: "/var/lib/postgresql/data" }
  ],
  envs: [
    `POSTGRES_USER=${cfg.require("pguser")}`,
    cfg.requireSecret("pgpass").apply(p => `POSTGRES_PASSWORD=${p}`)
  ],
  ports: [{ internal: 5432, external: 5432 }]
});

const pgProvider = new pg.Provider("pg", {
  host: pgContainer.ipAddress,
  username: cfg.require("pguser"),
  password: cfg.requireSecret("pgpass"),
  sslmode: "disable"
});

export const db = new pg.Database("ruhe", {}, { provider: pgProvider });

const hasuraImage = new docker.RemoteImage("hasura-image", {
  name: "hasura/graphql-engine:v1.0.0-beta.8",
  keepLocally: true
});

export const hasuraContainer = new docker.Container("hasura", {
  image: hasuraImage.name,
  networksAdvanced: [{ name: network.name }],
  restart: "on-failure",
  envs: [
    cfg.requireSecret("pgpass").apply(p => {
      const u = cfg.require("pguser");

      return pgContainer.name.apply(hn =>
        db.name.apply(
          name =>
            `HASURA_GRAPHQL_DATABASE_URL=postgres://${u}:${p}@${hn}:5432/${name}`
        )
      );
    }),
    cfg.requireSecret("pgpass").apply(p => `HASURA_GRAPHQL_ADMIN_SECRET=${p}`),
    `HASURA_GRAPHQL_JWT_SECRET={"type":"RS512", "jwk_url": "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"}`,
    `HASURA_GRAPHQL_ENABLE_CONSOLE=true`,
    `HASURA_GRAPHQL_UNAUTHORIZED_ROLE=anonymous`
  ],
  ports: [{ internal: 8080, external: 8081 }]
});

*/
