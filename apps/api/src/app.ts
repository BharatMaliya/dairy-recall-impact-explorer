import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import { driver, hasDatabaseConfig, read } from './db.js';

const toJson = (value: unknown): unknown => {
  if (typeof value === 'bigint') return Number(value);
  if (Array.isArray(value)) return value.map(toJson);
  if (value && typeof value === 'object') {
    const candidate = value as {properties?: unknown; toNumber?: () => number};
    if (typeof candidate.toNumber === 'function') return candidate.toNumber();
    if ('properties' in candidate) return toJson(candidate.properties);
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, toJson(item)]));
  }
  return value;
};

export function buildApp() {
  const app = Fastify({logger: true});
  app.register(cors, {origin: process.env.CORS_ORIGIN?.split(',') ?? true});

  const healthHandler = async (_request: FastifyRequest, reply: FastifyReply) => {
    if (!driver) return reply.status(503).send({status: 'unconfigured', database: 'not_connected'});
    try {
      await driver.verifyConnectivity();
      return {status: 'ok', database: 'connected'};
    } catch {
      return reply.status(503).send({status: 'degraded', database: 'unavailable'});
    }
  };
  app.get('/api/health', healthHandler);
  app.get('/health', healthHandler);

  app.get('/api/entities/search', async (request) => {
    const {q = ''} = request.query as {q?: string};
    const rows = await read<{id: string; labels: string[]; display: string}>(`
      MATCH (n:Entity)
      WHERE n.id = $term OR n.lotCode = $term OR n.sku = $term
         OR toLower(coalesce(n.name, '')) CONTAINS toLower($term)
      RETURN n.id AS id, labels(n) AS labels, coalesce(n.lotCode, n.name, n.sku, n.id) AS display
      LIMIT 25`, {term: q});
    return toJson(rows);
  });

  app.get('/api/investigations', async () => {
    const rows = await read(`
      MATCH (i:Investigation)
      OPTIONAL MATCH (owner:User)-[:OWNS]->(i)
      RETURN i.id AS id, i.title AS title, i.triggerType AS triggerType,
        i.status AS status, owner.displayName AS owner
      ORDER BY i.id`);
    return toJson(rows);
  });

  app.get('/api/complaint-clusters', async () => {
    const rows = await read(`
      MATCH (c:CustomerComplaint)-[:REPORTED_FROM]->(area:ServiceArea)
      OPTIONAL MATCH (c)-[:REPORTED_AGAINST]->(lot:FinishedLot)
      RETURN area.id AS areaId, area.name AS areaName, count(DISTINCT c) AS complaintCount,
        collect(DISTINCT lot.lotCode) AS lotCodes
      ORDER BY complaintCount DESC`);
    return toJson(rows);
  });

  app.get('/api/farms/:farmId/raw-lots', async (request) => {
    const {farmId} = request.params as {farmId: string};
    const rows = await read(`
      MATCH (raw:RawMilkLot)-[origin:PRODUCED_AT]->(farm:Farm {id: $farmId})
      RETURN raw.id AS id, raw.collectionDate AS collectionDate, raw.quantityLiters AS quantityLiters,
        raw.qualityStatus AS qualityStatus, origin.collectedAt AS collectedAt
      ORDER BY collectedAt`, {farmId});
    return toJson(rows);
  });

  app.get('/api/traces/forward/:rawLotId', async (request) => {
    const {rawLotId} = request.params as {rawLotId: string};
    const rows = await read(`
      MATCH (raw:RawMilkLot {id: $rawLotId})-[:CONSUMED_IN]->(batch:ProcessingBatch)
      MATCH (finished:FinishedLot)-[:PACKAGED_IN]->(batch)
      OPTIONAL MATCH (shipment:Shipment)-[:CONTAINS]->(finished)
      OPTIONAL MATCH (shipment)-[:SHIPPED_TO]->(destination:Location)
      RETURN raw.id AS sourceId, raw.name AS sourceName, raw.collectionDate AS collectionDate,
        raw.shift AS shift, raw.quantityLiters AS quantityLiters, batch.id AS batchId, batch.startedAt AS batchStartedAt, finished.id AS finishedLotId,
        finished.lotCode AS lotCode, collect(DISTINCT shipment.id) AS shipments,
        collect(DISTINCT destination.name) AS destinations`, {rawLotId});
    return toJson(rows);
  });

  app.get('/api/traces/reverse/:finishedLotId', async (request) => {
    const {finishedLotId} = request.params as {finishedLotId: string};
    const rows = await read(`
      MATCH (finished:FinishedLot {id: $finishedLotId})-[:PACKAGED_IN]->(batch:ProcessingBatch)
      MATCH (raw:RawMilkLot)-[:CONSUMED_IN]->(batch)
      MATCH (raw)-[:PRODUCED_AT]->(farm:Farm)
      RETURN finished.id AS finishedLotId, batch.id AS batchId, raw.id AS rawLotId,
        raw.name AS rawName, raw.collectionDate AS collectionDate, raw.quantityLiters AS quantityLiters,
        farm.id AS farmId, farm.name AS farmName`, {finishedLotId});
    return toJson(rows);
  });

  app.get('/api/traces/shared-exposure/:rawLotId', async (request) => {
    const {rawLotId} = request.params as {rawLotId: string};
    const rows = await read(`
      MATCH (suspect:RawMilkLot {id: $rawLotId})-[:STORED_IN]->(tank:StorageTank)
      MATCH (peerInput:RawMilkLot)-[:STORED_IN]->(tank)
      MATCH (peerInput)-[:CONSUMED_IN]->(batch:ProcessingBatch)<-[:PACKAGED_IN]-(peer:FinishedLot)
      WHERE peerInput.id <> suspect.id
      RETURN DISTINCT peer.id AS finishedLotId, peer.lotCode AS lotCode,
        tank.id AS sharedAssetId, tank.name AS sharedAssetName
      LIMIT 20`, {rawLotId});
    return toJson(rows);
  });

  app.get('/api/traces/batch/:batchId', async (request) => {
    const {batchId} = request.params as {batchId: string};
    const rows = await read(`
      MATCH (batch:ProcessingBatch {id: $batchId})
      MATCH (raw:RawMilkLot)-[:CONSUMED_IN]->(batch)
      MATCH (raw)-[:PRODUCED_AT]->(farm:Farm)
      OPTIONAL MATCH (finished:FinishedLot)-[:PACKAGED_IN]->(batch)
      OPTIONAL MATCH (shipment:Shipment)-[:CONTAINS]->(finished)
      OPTIONAL MATCH (shipment)-[:SHIPPED_TO]->(store:Store)
      RETURN DISTINCT batch.id AS batchId, raw.id AS rawLotId, raw.name AS rawName,
        raw.collectionDate AS collectionDate, raw.shift AS shift, raw.quantityLiters AS quantityLiters, farm.id AS farmId,
        farm.name AS farmName, finished.id AS finishedLotId, finished.lotCode AS lotCode,
        shipment.id AS shipmentId, store.id AS storeId, store.name AS storeName
      LIMIT 100`, {batchId});
    return toJson(rows);
  });

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    reply.status(hasDatabaseConfig ? 500 : 503).send({message: 'The trace service is temporarily unavailable. Please retry.'});
  });
  return app;
}
