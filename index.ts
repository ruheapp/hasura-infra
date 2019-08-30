import * as pulumi from "@pulumi/pulumi";
import * as docker from "@pulumi/docker";
import * as pg from '@pulumi/postgresql';

const cfg = new pulumi.Config();
const network = new docker.Network("net");

const pgImg = new docker.RemoteImage("postgresql-image", {
  name: "postgres:11",
  keepLocally: true
});

const pgVol = new docker.Volume('pgdata');

const pgContainer = new docker.Container("postgres", {
  image: pgImg.name,
  networksAdvanced: [{ name: network.name }],
  restart: "on-failure",
  volumes: [{ volumeName: pgVol.name, containerPath: '/var/lib/postgresql/data' }],
  envs: [
    `POSTGRES_USER=${cfg.require('pguser')}`,
    cfg.requireSecret('pgpass').apply(p => `POSTGRES_PASSWORD=${p}`),
  ],
  ports: [{ internal: 5432, external: 5432 }]
});

/* NB: This doesn't work! 
pg.config.database = 'localhost';
pg.config.port = 5432;
pg.config.sslmode = 'disable';
pg.config.sslMode = 'disable';
pg.config.username = cfg.require('pguser');
cfg.requireSecret('pgpass').apply(p => pg.config.password = p);

const db = new pg.Database('ruhe');
*/

const hasuraImage = new docker.RemoteImage("hasura-image", {
  name: "hasura/graphql-engine:v1.0.0-beta.6",
  keepLocally: true
});

const hasuraContainer = new docker.Container("hasura", {
  image: hasuraImage.name,
  networksAdvanced: [{ name: network.name }],
  restart: "on-failure",
  envs: [
    cfg.requireSecret('pgpass').apply(p => {
      const u = cfg.require('pguser');

      return pgContainer.name.apply(hn =>
        `HASURA_GRAPHQL_DATABASE_URL=postgres://${u}:${p}@${hn}:5432/ruhe`);
    }),
    cfg.requireSecret('pgpass').apply(p =>
      `HASURA_GRAPHQL_ADMIN_SECRET=${p}`),
    `HASURA_GRAPHQL_JWT_SECRET={"type":"RS512", "jwk_url": "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"}`,
    `HASURA_GRAPHQL_UNAUTHORIZED_ROLE=anonymous`
  ],
  ports: [{ internal: 8080, external: 8080 }]
});