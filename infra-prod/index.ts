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
  charset: "UTF8",
  collation: "en-US",
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
    cfg.requireSecret("pgpass"),
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
    HASURA_GRAPHQL_ADMIN_SECRET: cfg.requireSecret("pgpass"),
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

const vnet = new azure.network.VirtualNetwork("vnet", {
  resourceGroupName: rg.name,
  addressSpaces: ["10.0.0.0/16"],
  subnets: [{ name: "default", addressPrefix: "10.0.1.0/24" }]
});

export const jumpboxIp = new azure.network.PublicIp("jumpbox-ip", {
  resourceGroupName: rg.name,
  domainNameLabel: appService.name.apply(n => `jump-${n}`),
  allocationMethod: "Dynamic",
});

const jumpboxNic = new azure.network.NetworkInterface("jumpboxNic", {
  resourceGroupName: rg.name,
  ipConfigurations: [
    {
      name: "jumpbox-ipcfg",
      subnetId: vnet.subnets[0].id,
      privateIpAddressAllocation: "Dynamic",
      publicIpAddressId: jumpboxIp.id
    }
  ]
});

const sshKey = process.env['HASURA_JUMPBOX_SSH_KEY'] || '';
if (sshKey.length < 2) {
  throw new Error("Jumpbox SSH key not set!");
}

export const jumpbox = new azure.compute.VirtualMachine("jumpbox", {
  resourceGroupName: rg.name,
  networkInterfaceIds: [jumpboxNic.id],
  vmSize: "Standard_A0",
  osProfile: {
    computerName: "jumpbox",
    adminUsername: cfg.require("pguser"),
  },
  osProfileLinuxConfig: {
    disablePasswordAuthentication: true,
    sshKeys: [
      {
        keyData: sshKey,
        path: `/home/${cfg.require('pguser')}/.ssh/authorized_keys`,
      }
    ]
  },
  storageOsDisk: {
    createOption: "FromImage",
    managedDiskType: "Standard_LRS",
    name: "myosdisk1",
    diskSizeGb: 30
  },
  storageImageReference: {
    publisher: "canonical",
    offer: "UbuntuServer",
    sku: "18.04-LTS",
    version: "latest"
  }
});

/*
export const helloWorld = new azure.appservice.HttpEventSubscription("helloWorld", {
  resourceGroup: new azure.core.ResourceGroup("ruhe-fn", { name: cfg.require("resourceGroup") + "-fn", location }),
  callback: async (_context, req) => {
    console.log("WE HAVE STARTED");
    const theUri = `https://${appService.defaultSiteHostname.get()}`;

    const ret = {
      status: 200,
      headers: { "content-type": "text/plain" },
      body: `Hasura is ${theUri} and the request body is\n${req.body}`,
    };

    console.log(`ABOUT TO RETURN - THE URI IS ${theUri}`);
    return ret;
  },
  hostSettings: { }
});
*/