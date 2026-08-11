# Dairy Recall Impact Explorer

## Implementation-ready project requirements

**Product type:** Recall-impact investigation web application  
**Graph database:** CognoDB, accessed through the official Neo4j JavaScript driver  
**Proposed stack:** React + TypeScript frontend, TypeScript backend API, CognoDB  
**Primary user:** Priya, Dairy Quality & Recall Manager  
**Scenario boundary:** An Amul-style Indian dairy supply-chain example for an assignment. All farms, people, locations, lots, complaint records, and operational practices are fictional; this document does not describe, imply access to, or make claims about Amul's actual systems or data.

---

## 1. Product purpose

Dairy Recall Impact Explorer lets a quality team rapidly determine *what is affected* when a potential safety, quality, adulteration, temperature-control, or labeling incident is reported after milk or dairy products may already have moved through the supply chain. The prototype uses an Amul-style dairy company as its illustrative context.

It provides an interactive, explainable view of how raw-milk source lots, ingredients, processing batches, finished-product lots, shipments, distribution centers, stores, and customers are connected. Priya can start with any known entity—such as a complained-about retail product lot, a suspect farm collection lot, a vehicle, or a production batch—and explore both directions:

- **Forward trace:** What products, destinations, and customers could be affected by this source or processing event?
- **Reverse trace:** What sources, ingredients, transport legs, and batches contributed to this product lot?
- **Shared exposure:** What other finished lots may be implicated because they shared a source lot, truck, tank, processing line, or distribution event?

It supports two equally important starting points:

- **Customer complaint cluster:** Several customers, retailers, or service centres report a problem in the same delivery/service area. The team groups the complaints by area and time, identifies the lots delivered there, and traces their common and non-common sources to investigate a possible quality issue, adulteration, tampering, or record anomaly.
- **Farmer self-report:** A farmer later reports that milk from a specific collection/date may be contaminated. The team identifies the raw-milk lot(s) from that farm and date, then traces forward through every known stage—collection, tanker, tank, processing, finished lots, shipments, distribution centres, stores, and fulfilled orders—to define a candidate recall scope.

The application supports an investigation and a defensible impact assessment; it does not autonomously decide that a regulatory recall is required.

## 2. Primary persona and incident context

### Priya — Dairy Quality & Recall Manager

Priya coordinates product-quality incidents for a regional dairy manufacturer. Her responsibilities include triaging complaints, tracing material and product movement, identifying potentially exposed inventory, preparing recall scope recommendations, and documenting the evidence used. She works under time pressure with operations, logistics, customer service, legal, and regulators.

She needs answers she can explain: not merely “these lots are affected,” but “these lots are included because they used raw-milk lot `RML-2026-08-041-A`, which was unloaded into tank `TANK-RT-12` and then used by processing batch `PB-2026-08-117`.”

### Realistic incident triggers

**Complaint-led trigger.** Customer service receives several off-odor complaints about 2% milk from the same service area. A retailer may provide a printed finished-lot code or order reference, but some complaints may initially contain only product, purchase date, retailer, and area. The product may already have shipped to multiple stores. Priya clusters the reports by service area and time, links each resolvable report to its lot, and uses the delivery records plus reverse trace to identify candidate common sources.

**Farmer-led trigger.** A farmer reports that milk collected from their farm on a given date may have been contaminated. Priya resolves the report to the applicable raw-milk collection lot(s), creates an investigation, and forward-traces them through all known custody and transformation records. Material can be held at any intervening stage and recalled from every known downstream destination.

In either trigger, the cause, intent, and final recall scope are not yet confirmed. Repeated reports from one area are a lead for investigation, not proof that a farm, farmer, or person committed fraud.

## 3. Exact problem solved

The product shortens the manual search for connected supply-chain entities after a post-shipment incident. It transforms fragmented identifiers and many-to-many movements into a navigable trace that answers:

1. Which upstream materials and process steps contributed to a reported product lot?
2. Which downstream shipments, stores, and customer orders received a suspect lot?
3. Which other lots share an exposure path even if they are not descendants of the original reported lot?
4. What is the supporting path and what data is still unknown?
5. Do multiple complaints from the same service area/time window map to the same delivered lot, processing batch, raw-milk lot, or only a shared exposure?

The system must retain the distinction between **confirmed facts**, **investigation hypotheses**, and **candidate impacts**. A path is evidence for review, not automatic proof of contamination.

## 4. Scope and non-goals

### In scope

- Create, view, and manage recall investigations.
- Record privacy-minimized complaint reports; cluster them by service area, product, and time window before a lot is known.
- Search supply-chain entities by human-readable identifier.
- Reverse and forward multi-hop tracing over lot transformation and movement records.
- Identify shared exposure through common raw-source lots, transport loads, storage tanks, processing batches/lines, and distribution legs.
- Display a graph, a tabular impact list, quantities, dates, locations, and explainable path evidence.
- Filter by product, lot, event date, location, status, and relationship type.
- Export a candidate-impact list and trace evidence as CSV.
- Identify potential quality, adulteration, tampering, or record-anomaly signals for human review; never determine fraud or blame a farmer automatically.
- Ship deterministic seed data and a scripted demonstration scenario.
- Use CognoDB via the official Neo4j driver; keep Cypher concentrated in backend repositories.

### Explicit non-goals

- No automatic recall decision, regulator filing, customer notification, or ERP/WMS integration in the assignment version.
- No real-time IoT ingestion, laboratory information-management system, route optimization, inventory reservation, or financial settlement.
- No machine-learning contamination prediction or clinical/medical advice.
- No universal supply-chain ontology; the model is intentionally optimized for milk and cultured dairy products.
- No mutation workflow for operational chain-of-custody data beyond seed/admin tooling. Complaint reports and farmer disclosures are investigation records, not edits to the historical custody chain.

## 5. Functional requirements and user journeys

### Journey A: Triage a consumer complaint

1. Priya records each complaint with received time, product/pack information, printed lot code if available, retailer/order reference if available, service-area code, and a concise description. Customer names, phone numbers, and addresses are not stored in the demo.
2. The workspace clusters reports with the same service area, product, and selected time window. It shows the count, the resolvable lot codes, and whether reports are unresolved; a cluster is a triage lead, not a contamination finding.
3. Priya creates a `CUSTOMER_COMPLAINT` investigation from the cluster. The system resolves known lot codes or flags them as unresolved without inventing a graph link. For complaints with no lot code, Priya can inspect finished lots shipped to the area/retailer in the relevant window.
4. She opens each plausible lot and runs **Reverse Trace** to review contributing batches, ingredients, raw collection lots, and farms. For every farm shown, the UI displays the raw-lot and transformation path proving that its milk could have reached the complained-about area; the UI compares overlap across complained-about lots and does not assign blame from connectivity alone.
5. She marks a source lot or batch as `SUSPECT` for this investigation only, then runs **Forward Trace** to obtain affected intermediate/finished lots, shipments, distribution centres, stores, and linked customer orders.
6. She runs **Shared Exposure** to include peer lots that passed through the same transport/tank/processing batch/line within the selected time window.
7. She reviews why each result is included, excludes false positives with a required reason, and exports the candidate list.

### Journey B: Farmer self-reports a possible contamination

1. The farmer or collection officer supplies the farm identifier, collection date/time window, and any known collection/tanker or raw-lot reference. Priya searches `FARM-014` plus the reported collection window, or opens `RML-2026-08-041-A` when its ID is known.
2. The system lists all raw-milk lots produced at that farm in the window. Priya confirms the applicable lot(s), records the farmer disclosure, and creates a `FARMER_SELF_REPORT` investigation with each applicable lot marked `SUSPECT`.
3. Forward trace shows every known material and custody stage: collection centre, tanker, storage tank, processing batch, intermediate material, finished lot, shipment, distribution centre, store, and linked customer order.
4. Priya can place a hold/candidate-recall recommendation on any downstream stage already reached and can see products still in transit or at an unknown arrival state.
5. Shared-exposure analysis finds other product lots that used the same co-loaded tanker, shared tank, or line-window, including paths without direct consumption of the suspect raw lot.
6. Priya records the investigation’s current decision as `UNDER_REVIEW` and exports evidence for cross-functional and regulatory review.

### Journey C: Operations answers “why is this lot on the list?”

1. An operations user selects an impacted finished lot from the table.
2. The detail panel displays one or more shortest qualifying paths, relationship dates/quantities, and the matching exposure rule.
3. The user can open each connected entity and verify its identifiers, source records, and timestamps.

## 6. UI requirements

### Global behavior

- Desktop-first responsive layout; usable at 1280 px width and above, with coherent tablet layout.
- Persistent top bar: product name, global entity search, active investigation selector, user menu.
- Complaint-cluster controls use a service-area code (for example, a PIN-code prefix, retailer delivery zone, or distributor service zone), product, and time window. They must not use or expose a customer's street address.
- All times displayed in the facility’s timezone with ISO timestamps available in detail views.
- Every table supports loading, empty, error, and no-results states. API errors use a retry action and do not show credentials or raw stack traces.
- Never label an entity “contaminated” from graph connectivity alone. Use terms such as `candidate impact`, `suspect`, `under review`, and `confirmed` only when an investigator has set that status.

### Screen 1: Investigation dashboard

- List cards/table: ID, title, trigger, status, owner, created time, known anchor entities, candidate impacted-lot count.
- Actions: create investigation, open, filter by status, search by ID/title.
- States: initial seeded list; no matches; backend error; empty state with **Create investigation** CTA.

### Screen 2: Create/Edit Investigation

- Required: title, trigger type (`CUSTOMER_COMPLAINT`, `STORE_REPORT`, `REGULATOR_NOTIFICATION`, `INTERNAL_QC`, `FARMER_SELF_REPORT`), received-at timestamp, narrative, owner.
- Optional: severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), external reference, anchor entity IDs.
- `FARMER_SELF_REPORT` requires farm ID and collection date/time window, unless one or more verified raw-lot IDs are supplied. `CUSTOMER_COMPLAINT` requires at least one complaint report or a concise cluster summary.
- Validation: title/non-empty narrative; valid timestamp; known selected anchors only; save failure keeps entered data.

### Screen 3: Investigation workspace

- Header: investigation status, trigger, owner, timestamps, actions to edit/export.
- For complaint-led investigations, a complaint-cluster panel shows reports, area/time grouping, resolved lot links, and deliveries into the selected area. For farmer-led investigations, a source-resolution panel lists the selected farm/date window and every matching raw-milk lot before tracing begins.
- Left control rail: anchor selector, direction (forward/reverse/shared), max hops (default 8; cap 12), date window, relationship-type filters, result limit (default 200; cap 1,000), run button.
- Main graph canvas: zoom/pan, type-colored nodes, directional edges, compact edge labels, selected node focus, path highlighting.
- Right evidence panel: selected entity details, all qualifying paths, relationship facts, and investigation-specific decision/exclusion fields.
- Bottom results table: type, ID, product/location, status, quantity if relevant, qualifying rule, shortest-hop count, links to evidence.
- Graph result may be truncated. If so, state the cap and offer narrowing filters; do not imply completeness.

### Screen 4: Entity search and detail

- Search across canonical identifiers, display names, and aliases (e.g., printed lot code).
- Detail includes label/type, properties, connected entities grouped by relation, and actions to start a trace or add as an investigation anchor.
- Not-found state offers creation of an *unresolved reference* only within an investigation, not a fabricated operational entity.

### Screen 5: Export preview

- Displays row count, active filters, generation timestamp, and columns before download.
- CSV includes investigation ID, run parameters, impacted entity type/ID, impact classification, path summary, and investigator decision where present.

## 7. Graph data model

### Design principles

- Use immutable, human-readable business IDs alongside internal graph IDs. Application APIs address entities by `id`.
- Preserve physical transformations as relationships with quantity, unit, and time; do not overwrite lineage.
- Model lots separately from product definitions and equipment/location entities.
- Use `:Entity` only as an optional common label for global search; each operational node has one or more specific labels.
- Quantities are decimal strings or integer minor units in the API. For the assignment, store `quantityLiters` as a numeric property; document rounding in the UI.

### Nodes

| Labels | ID example | Required properties | Purpose |
|---|---|---|---|
| `:Product:Entity` | `PROD-MILK-2PCT-1L` | `id`, `name`, `category`, `sku`, `uom` | Sellable/produced product definition. |
| `:RawMilkLot:Lot:Entity` | `RML-2026-08-041-A` | `id`, `collectionDate`, `qualityStatus`, `quantityLiters`, `sourceRecordRef` | Milk collected at a farm or collection center before processing. |
| `:IngredientLot:Lot:Entity` | `ING-2026-08-040-CULT` | `id`, `ingredientName`, `receivedAt`, `quantity`, `uom`, `supplierLotCode` | Non-milk input such as culture, stabilizer, or vitamin premix. |
| `:IntermediateLot:Lot:Entity` | `IML-2026-08-117-A` | `id`, `materialType`, `createdAt`, `quantityLiters`, `status` | Pasteurized/standardized material between processing stages. |
| `:FinishedLot:Lot:Entity` | `FL-2PCT-2026-08-117-B` | `id`, `lotCode`, `productionDate`, `expiryDate`, `quantityUnits`, `status` | Packaged, traceable finished product lot. |
| `:Farm:Entity` | `FARM-014` | `id`, `name`, `licenseNumber`, `region` | Raw milk producer. |
| `:Supplier:Entity` | `SUP-021` | `id`, `name`, `supplierCode` | Ingredient supplier. |
| `:CollectionCenter:Location:Entity` | `CC-03` | `id`, `name`, `address`, `timezone` | Location where collection occurs. |
| `:Plant:Location:Entity` | `PLANT-01` | `id`, `name`, `address`, `timezone` | Processing facility. |
| `:DistributionCenter:Location:Entity` | `DC-02` | `id`, `name`, `address`, `timezone` | Downstream distribution facility. |
| `:Store:Location:Entity` | `STORE-118` | `id`, `name`, `storeCode`, `address` | Retail destination. |
| `:Vehicle:Entity` | `VEH-TK-12` | `id`, `vehicleCode`, `vehicleType`, `sanitationStatus` | Tanker or distribution vehicle. |
| `:StorageTank:Equipment:Entity` | `TANK-RT-12` | `id`, `tankCode`, `plantId`, `capacityLiters` | Bulk/raw/intermediate storage vessel. |
| `:ProcessingLine:Equipment:Entity` | `LINE-P2` | `id`, `lineCode`, `plantId`, `lineType` | Packaging/processing line. |
| `:ProcessingBatch:Entity` | `PB-2026-08-117` | `id`, `batchCode`, `startedAt`, `endedAt`, `processType`, `status` | A discrete manufacturing run. |
| `:Shipment:Entity` | `SHP-2026-08-118-04` | `id`, `shipmentCode`, `departedAt`, `arrivedAt`, `status`, `sourceSystemRef` | Planned/actual transport movement. |
| `:CustomerOrder:Entity` | `ORD-88219` | `id`, `orderRef`, `orderedAt`, `channel`, `status` | Optional downstream customer/order exposure record; use privacy-safe/minimal data only. |
| `:ServiceArea:Location:Entity` | `AREA-AHMEDABAD-W-01` | `id`, `name`, `areaCode`, `district`, `state` | Privacy-preserving retailer/distributor service area used to group complaints and deliveries. |
| `:CustomerComplaint:Entity` | `CMP-2026-0081` | `id`, `receivedAt`, `category`, `narrative`, `productDescription`, `reportedLotCode`, `areaCode`, `sourceReference`, `resolutionStatus` | A privacy-minimized customer or retailer report. It does not store personal contact or street-address data. |
| `:FarmerDisclosure:Entity` | `FDR-2026-0011` | `id`, `receivedAt`, `reportedByRole`, `concernType`, `collectionFrom`, `collectionTo`, `narrative`, `sourceReference`, `verificationStatus` | A farmer/collection-officer disclosure received by the quality authority. It records the reported concern and collection window without deciding contamination or fault. |
| `:Investigation:Entity` | `INV-2026-014` | `id`, `title`, `triggerType`, `status`, `severity`, `receivedAt`, `createdAt`, `ownerId`, `narrative` | Recall-impact case. |
| `:User:Entity` | `USR-PRIYA` | `id`, `displayName`, `role`, `email` | Authenticated application user. |

### Relationships (all directions are intentional)

| Relationship | From → To | Required relationship properties | Meaning |
|---|---|---|---|
| `:PRODUCED_AT` | `RawMilkLot` → `Farm` | `collectedAt`, `quantityLiters` | A raw lot originated at a farm. |
| `:COLLECTED_AT` | `RawMilkLot` → `CollectionCenter` | `receivedAt` | Collection-center receipt. |
| `:SUPPLIED_BY` | `IngredientLot` → `Supplier` | `receivedAt` | Ingredient provenance. |
| `:LOADED_ON` | `Lot` → `Vehicle` | `loadedAt`, `unloadedAt`, `quantity`, `uom`, `compartment` | A particular material/finished lot occupied a vehicle. |
| `:STORED_IN` | `Lot` → `StorageTank` | `startedAt`, `endedAt`, `quantityLiters` | A lot was present in a storage tank. |
| `:CONSUMED_IN` | `Lot` → `ProcessingBatch` | `consumedAt`, `quantity`, `uom` | Input lot consumed by batch. |
| `:GENERATED_BY` | `IntermediateLot` → `ProcessingBatch` | `createdAt`, `quantityLiters` | Intermediate material output of batch. |
| `:PACKAGED_IN` | `FinishedLot` → `ProcessingBatch` | `packagedAt`, `quantityUnits` | Finished lot output from batch. |
| `:OF_PRODUCT` | `FinishedLot` → `Product` | `assignedAt` | Finished lot’s product definition. |
| `:RAN_ON` | `ProcessingBatch` → `ProcessingLine` | `startedAt`, `endedAt` | Batch ran on a line. |
| `:CONTAINS` | `Shipment` → `Lot` | `quantity`, `uom`, `loadedAt`, `unloadedAt` | A shipment carried a lot; supports split shipments. |
| `:SHIPPED_FROM` | `Shipment` → `Location` | `departedAt` | Shipment origin. |
| `:SHIPPED_TO` | `Shipment` → `Location` | `arrivedAt` | Shipment destination. |
| `:FULFILLED_BY` | `CustomerOrder` → `FinishedLot` | `quantityUnits`, `fulfilledAt` | Order received units from a lot. |
| `:SOLD_AT` | `CustomerOrder` → `Store` | `fulfilledAt` | Retail/store attribution. |
| `:SERVES` | `Store` → `ServiceArea` | `effectiveFrom`, `effectiveTo` | Store/distributor delivery coverage for complaint-area analysis. |
| `:REPORTED_FROM` | `CustomerComplaint` → `ServiceArea` | `reportedAt` | The complaint's reported service area. |
| `:REPORTED_AGAINST` | `CustomerComplaint` → `FinishedLot` | `resolvedAt`, `resolutionMethod`, `confidence` | Verified link from a complaint to a finished lot. Omit this relationship while the lot is unresolved. |
| `:HAS_COMPLAINT` | `Investigation` → `CustomerComplaint` | `addedAt` | Complaint evidence included in an investigation. |
| `:REPORTED_BY` | `FarmerDisclosure` → `Farm` | `reportedAt` | Farm identified by the disclosure. |
| `:IDENTIFIES` | `FarmerDisclosure` → `RawMilkLot` | `resolvedAt`, `resolutionMethod`, `confidence` | Verified raw-lot link for the disclosure. Omit until farm/date resolution is confirmed. |
| `:HAS_DISCLOSURE` | `Investigation` → `FarmerDisclosure` | `addedAt` | Farmer disclosure evidence included in an investigation. |
| `:HAS_ANCHOR` | `Investigation` → `Entity` | `addedAt`, `reason`, `assessmentStatus` | Case anchor: `REPORTED`, `SUSPECT`, or `CONFIRMED`. |
| `:ASSESSED` | `Investigation` → `Entity` | `status`, `updatedAt`, `rationale`, `updatedBy` | Investigator classification: `UNDER_REVIEW`, `CANDIDATE_IMPACT`, `EXCLUDED`, `CONFIRMED_IMPACT`. |
| `:OWNS` | `User` → `Investigation` | `assignedAt` | Case ownership. |

### Lot mixing and splitting assumptions

1. **Mixing:** multiple input lots may each have `CONSUMED_IN` relationships to one processing batch; the batch may generate one or many output/intermediate/finished lots. This is a many-to-many transformation.
2. **Splitting:** one lot may appear in multiple `CONTAINS` relationships, each with its shipped quantity; the total must not exceed the available quantity for a complete operational dataset.
3. **Aggregation:** when physical material is mixed in a tanker or storage tank, create lot-presence relationships (`LOADED_ON`/`STORED_IN`) for every contributing lot with intervals and quantities. Do not replace constituents with an untraceable aggregate ID.
4. **Temporal exposure:** a shared vehicle/tank/line is a candidate exposure only when configured time intervals overlap or fall within an explicit sanitation/changeover window. Default UI window: 24 hours, configurable per run.
5. **Mass balance:** the demo validates simple totals but does not model loss/yield/rework in depth. Production hardening should add reconciliation and unit-conversion rules.
6. **Complaint geography:** a repeated complaint area narrows the lots/deliveries that should be investigated. It is not a lineage relationship and must not, by itself, mark a product or farmer as contaminated, fraudulent, or responsible.

### Constraints and indexes

Create uniqueness constraints for each label’s `id` (or a single `:Entity(id)` constraint if CognoDB supports the label strategy consistently):

```cypher
CREATE CONSTRAINT entity_id_unique IF NOT EXISTS
FOR (n:Entity) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT product_sku_unique IF NOT EXISTS
FOR (p:Product) REQUIRE p.sku IS UNIQUE;

CREATE CONSTRAINT finished_lot_code_unique IF NOT EXISTS
FOR (l:FinishedLot) REQUIRE l.lotCode IS UNIQUE;
```

Create indexes supporting search and date filtering:

```cypher
CREATE INDEX entity_name_idx IF NOT EXISTS FOR (n:Entity) ON (n.name);
CREATE INDEX investigation_status_idx IF NOT EXISTS FOR (i:Investigation) ON (i.status, i.receivedAt);
CREATE INDEX batch_started_idx IF NOT EXISTS FOR (b:ProcessingBatch) ON (b.startedAt);
CREATE INDEX shipment_departed_idx IF NOT EXISTS FOR (s:Shipment) ON (s.departedAt);
```

If CognoDB’s supported Cypher DDL differs, record the equivalent migration syntax and preserve the logical uniqueness/index intent.

## 8. Seed-data requirements

Seed data must be deterministic, idempotent, and loadable through an explicit backend/admin script (not automatically on every app start). Provide a seed manifest and a clear reset procedure appropriate to the chosen environment.

The seed graph must contain at least:

- 3 farms, 2 collection centers, 1 plant, 2 distribution centers, 5 stores, and 2 vehicles.
- 6+ raw milk lots across three collection dates, including `RML-2026-08-041-A` from `FARM-014`.
- 3+ ingredient lots and 4+ processing batches on at least two processing lines.
- 8+ intermediate and finished lots across at least three product definitions.
- Two service areas, including `AREA-AHMEDABAD-W-01`, with store coverage and five privacy-minimized complaint records. At least three reports in the same area/time window must form a visible cluster; some should have a printed-lot code and at least one should initially be unresolved.
- One `FarmerDisclosure` for `FARM-014` with a collection window that resolves to `RML-2026-08-041-A` only after investigator confirmation.
- A direct downstream path from `RML-2026-08-041-A` to `FL-2PCT-2026-08-117-B`, one of the customer-complaint anchors.
- At least two finished lots that **do not consume** that raw lot but share a tanker, tank, batch, or line-window exposure with it. This proves the shared-exposure feature is not merely a normal descendant trace.
- Split shipments of at least one finished lot to two stores and a downstream customer order linked to one store.
- Pre-existing `INV-2026-014` with Priya as owner, the clustered complaint narrative, linked complaint records, reported finished-lot anchor, suspect raw-lot anchor, and at least one excluded candidate with rationale.
- Pre-existing `INV-2026-015` with Priya as owner, trigger `FARMER_SELF_REPORT`, farm/date disclosure narrative, and `RML-2026-08-041-A` as its suspect raw-lot anchor.
- Intentional edge cases: a still-in-transit shipment, an unassigned/unknown arrival time, an entity with an alias/printed lot code, and a query that returns no results.

Seed values must use fictional organizations, locations, people, and identifiers. Do not use personal customer information beyond a synthetic order reference.

## 9. Query requirements (Cypher)

All Cypher is parameterized. The backend must use an allowlist for variable relationship types and labels; it must never interpolate untrusted user text into Cypher. Queries should return stable DTOs, not raw driver records.

### Q1: Entity lookup

Input: exact or prefix identifier/name. Return up to 25 matching entities with labels and a display string.

```cypher
MATCH (n:Entity)
WHERE n.id = $term OR n.lotCode = $term OR n.sku = $term
   OR toLower(coalesce(n.name, '')) CONTAINS toLower($term)
RETURN n.id AS id, labels(n) AS labels,
       coalesce(n.lotCode, n.name, n.sku, n.id) AS display
LIMIT 25;
```

### Q1a: Complaint-area cluster

Input: service-area code, product text (optional), and received-time window. Return privacy-minimized clusters, their resolved lot codes, and unresolved-report count. The result guides investigation; it does not classify a lot or source as contaminated.

```cypher
MATCH (complaint:CustomerComplaint)-[:REPORTED_FROM]->(area:ServiceArea {id: $serviceAreaId})
WHERE complaint.receivedAt >= $from AND complaint.receivedAt < $to
  AND ($productTerm IS NULL
       OR toLower(complaint.productDescription) CONTAINS toLower($productTerm))
OPTIONAL MATCH (complaint)-[:REPORTED_AGAINST]->(finished:FinishedLot)
RETURN area.id AS serviceAreaId,
       count(DISTINCT complaint) AS complaintCount,
       count(DISTINCT CASE WHEN finished IS NULL THEN complaint END) AS unresolvedCount,
       collect(DISTINCT finished.id) AS resolvedFinishedLotIds
LIMIT $limit;
```

### Q1b: Farmer/date raw-lot resolution

Input: farm ID and collection-date/time window. Return the verified raw-milk lot candidates before a farmer-led forward trace begins.

```cypher
MATCH (raw:RawMilkLot)-[origin:PRODUCED_AT]->(farm:Farm {id: $farmId})
WHERE raw.collectionDate >= $from AND raw.collectionDate < $to
RETURN raw.id AS rawLotId, raw.collectionDate AS collectionDate,
       raw.quantityLiters AS quantityLiters, raw.qualityStatus AS qualityStatus,
       origin.collectedAt AS collectedAt
ORDER BY collectedAt, rawLotId
LIMIT $limit;
```

### Q2: Reverse multi-hop trace

Starting at a finished lot, find upstream material/batch/source paths. Material lineage is directional by *role*, not by one physical relationship direction: an output lot points to its producing batch (`PACKAGED_IN` or `GENERATED_BY`), while each input lot points to the consuming batch (`CONSUMED_IN`). The backend must use this two-edge phase repeatedly; a single variable-length relationship alternation would follow the arrows incorrectly.

```cypher
// One bounded reverse-lineage phase; repeat in the repository only for
// IntermediateLot inputs, carrying the accumulated path and visited IDs.
MATCH (output:Lot {id: $outputLotId})
      -[outputRel:PACKAGED_IN|GENERATED_BY]->(batch:ProcessingBatch)
MATCH (input:Lot)-[inputRel:CONSUMED_IN]->(batch)
RETURN output.id AS outputLotId, batch.id AS batchId, input.id AS inputLotId,
       type(outputRel) AS outputRelationship,
       type(inputRel) AS inputRelationship,
       labels(input) AS inputLabels
LIMIT $phaseLimit;
```

The repository performs breadth-first traversal with default maximum 8 phases (cap 12), a result limit, and a visited `(lotId, batchId)` set. It returns accumulated, explainable paths and stops when it reaches `RawMilkLot` or `IngredientLot`. This same implementation supports multiple inputs and intermediate stages without creating false lineage paths.

### Q3: Forward multi-hop trace

Starting at a suspect raw lot, identify every resulting intermediate/finished lot and all known downstream custody events. The first query is one bounded forward-lineage phase; the repository repeats it for `IntermediateLot` outputs, carries path evidence, and then loads custody for every reached lot.

```cypher
// One bounded forward-lineage phase; do not use a one-direction variable path.
MATCH (input:Lot {id: $inputLotId})-[inputRel:CONSUMED_IN]->(batch:ProcessingBatch)
MATCH (output:Lot)-[outputRel:GENERATED_BY|PACKAGED_IN]->(batch)
OPTIONAL MATCH (batch)-[ranOn:RAN_ON]->(line:ProcessingLine)
RETURN input.id AS inputLotId, batch.id AS batchId, output.id AS outputLotId,
       labels(output) AS outputLabels,
       type(inputRel) AS inputRelationship,
       type(outputRel) AS outputRelationship,
       line.id AS processingLineId, ranOn.startedAt AS lineStartedAt,
       ranOn.endedAt AS lineEndedAt
LIMIT $phaseLimit;
```

For each reached lot, the custody query includes records at every known point, rather than only a final retail destination:

```cypher
MATCH (lot:Lot)
WHERE lot.id IN $lotIds
OPTIONAL MATCH (lot)-[origin:PRODUCED_AT]->(farm:Farm)
OPTIONAL MATCH (lot)-[collected:COLLECTED_AT]->(collectionCenter:CollectionCenter)
OPTIONAL MATCH (lot)-[vehiclePresence:LOADED_ON]->(vehicle:Vehicle)
OPTIONAL MATCH (lot)-[tankPresence:STORED_IN]->(tank:StorageTank)
OPTIONAL MATCH (shipment:Shipment)-[contains:CONTAINS]->(lot)
OPTIONAL MATCH (shipment)-[to:SHIPPED_TO]->(destination:Location)
OPTIONAL MATCH (order:CustomerOrder)-[fulfilled:FULFILLED_BY]->(lot)
OPTIONAL MATCH (order)-[soldAt:SOLD_AT]->(store:Store)
RETURN lot.id AS lotId, farm, origin, collectionCenter, collected,
       vehicle, vehiclePresence, tank, tankPresence,
       shipment, contains, destination, to, order, fulfilled, store, soldAt;
```

The response must distinguish source/collection, in-process, in-transit, delivered, and unknown-arrival stages. A farmer report may therefore produce candidate actions before a finished lot or store is reached.

### Q4: Relationally awkward shared-exposure query

Find peer finished lots that are not downstream descendants of the suspect raw lot but qualify through a shared physical exposure route. The MVP evaluates two transparent rules: (a) common vehicle/tank interval and (b) same processing line within a configured time window. Results must include the exact exposure object and rule. `descendantFinishedLotIds` is the bounded Q3 result, so this query never uses an incorrectly directed generic lineage path to exclude direct descendants.

```cypher
MATCH (suspect:RawMilkLot {id: $rawLotId})
MATCH (suspect)-[suspectPresence:LOADED_ON]->(shared:Vehicle)
MATCH (peerInput:Lot)-[peerPresence:LOADED_ON]->(shared)
MATCH (peerInput)-[:CONSUMED_IN]->(:ProcessingBatch)<-[:PACKAGED_IN]-(peer:FinishedLot)
WHERE peer.id <> $reportedFinishedLotId
  AND peerPresence.loadedAt <= suspectPresence.unloadedAt + duration({hours: $windowHours})
  AND suspectPresence.loadedAt <= peerPresence.unloadedAt + duration({hours: $windowHours})
  AND NOT peer.id IN $descendantFinishedLotIds
RETURN DISTINCT peer.id AS peerFinishedLotId, shared.id AS sharedAssetId,
       labels(shared) AS sharedAssetLabels,
       'SHARED_VEHICLE_WINDOW' AS rule,
       peerPresence.loadedAt AS peerExposureStart,
       peerPresence.unloadedAt AS peerExposureEnd;
```

The backend implements the tank rule separately with `STORED_IN` and its `startedAt`/`endedAt` fields, and the processing-line rule separately. It unions normalized DTOs and de-duplicates by `(peerFinishedLotId, rule, sharedAssetId)`. Use an alternative overlap predicate if CognoDB lacks temporal `duration` arithmetic.

### Q5: Explainable candidate paths

For a selected impact result, return up to five shortest qualifying paths and relationship metadata. The API must include node IDs/labels/properties needed for rendering, edge type/direction, and the classification rule. Avoid unrestricted all-shortest-path queries on broad graphs.

### Query correctness and performance acceptance

- Seed scenario Q2 finds `RML-2026-08-041-A` while tracing from `FL-2PCT-2026-08-117-B`.
- Seed scenario Q3 finds that finished lot and at least its two store destinations when tracing from the suspect raw lot.
- Q4 finds at least two peer finished lots not returned merely as descendants.
- Q1a returns the seeded repeated-complaint cluster for `AREA-AHMEDABAD-W-01`, clearly showing both resolved and unresolved reports.
- Q1b returns `RML-2026-08-041-A` when given `FARM-014` and its seeded collection window.
- The farmer-led forward result includes every reached custody stage and visibly distinguishes material that is in process, in transit, delivered, or has an unknown arrival state.
- Duplicate nodes/paths are collapsed in UI without losing distinct explanations.
- P95 query time is under 2 seconds for the seed dataset on local development hardware; all trace queries are bounded by hop and result limits.

## 10. Architecture

### Frontend (React + TypeScript)

- React application using a component library or custom accessible components.
- React Router routes: `/investigations`, `/investigations/:id`, `/entities/:id`.
- Server-state client (e.g., TanStack Query) for query caching, loading/error states, and retry behavior.
- Graph renderer (e.g., Cytoscape.js or React Flow) receives a normalized graph DTO; it does not create Cypher.
- Form validation mirrors backend validation but backend remains authoritative.
- CSV download calls an authenticated backend export endpoint.

### Backend (TypeScript)

- HTTP REST API (Express, Fastify, or equivalent) with a clear route/controller/service/repository split.
- Repository layer owns all Cypher and uses the official `neo4j-driver` package to create sessions and parameterized queries against CognoDB.
- Service layer validates inputs, enforces max hops/limits/relationship allowlists, maps driver records to typed DTOs, and composes shared-exposure rules.
- Auth middleware derives the actor; investigation mutations write user ID and timestamps.
- Structured logs include request/correlation ID, investigation ID where present, query name, duration, result count, and errors—but never credentials or customer PII.

### Proposed API contract

| Method/path | Purpose |
|---|---|
| `GET /api/health` | Dependency-safe health response; must not leak configuration. |
| `GET /api/entities/search?q=` | Global entity lookup. |
| `GET /api/entities/:id` | Entity details and immediate connections. |
| `GET /api/investigations` | List/filter investigations. |
| `POST /api/investigations` | Create an investigation. |
| `GET /api/investigations/:id` | Investigation, anchors, and assessments. |
| `PATCH /api/investigations/:id` | Edit case metadata/status. |
| `POST /api/investigations/:id/anchors` | Add a verified graph entity as anchor. |
| `POST /api/investigations/:id/complaints` | Add a privacy-minimized complaint record and optionally resolve it to a verified finished lot. |
| `POST /api/investigations/:id/farmer-disclosures` | Record a farmer/collection-officer report and, after resolution, link verified raw-milk lots. |
| `PUT /api/investigations/:id/assessments/:entityId` | Store classification/rationale. |
| `POST /api/complaint-clusters/query` | Find repeated complaint reports by service area, product, and time window. |
| `POST /api/farm-raw-lots/query` | Resolve a farmer/date disclosure to verified raw-milk lot candidates. |
| `POST /api/traces/reverse` | Bounded reverse-trace request. |
| `POST /api/traces/forward` | Bounded forward-trace request. |
| `POST /api/traces/shared-exposure` | Shared-vehicle/tank/line candidate impacts. |
| `GET /api/investigations/:id/export.csv` | Export a documented result set. |

Trace request body: `anchorId`, `maxHops`, `limit`, optional `from`, `to`, optional `relationshipTypes`; backend returns `{ nodes, edges, results, paths, truncation, queryMeta }`. Farmer-led traces accept one or more raw-lot anchors only after the farm/date resolution step is confirmed.

### CognoDB integration requirements

- Configure a single Neo4j driver instance from environment variables and verify connectivity during controlled startup/health checks.
- Use `session.executeRead`/read transactions for exploration and write transactions for investigation metadata.
- Close sessions in `finally`; close the driver during graceful shutdown.
- Treat CognoDB compatibility as an explicit acceptance check: connection, constraints/indexes, parameterized reads/writes, and required Cypher constructs must be tested against the target instance, not assumed from Neo4j alone.

## 11. Security, privacy, and environments

### Required environment variables

```dotenv
NODE_ENV=development
PORT=3001
COGNODB_URI=neo4j+s://your-cognodb-endpoint
COGNODB_USERNAME=app_user
COGNODB_PASSWORD=replace-me
COGNODB_DATABASE=neo4j
AUTH_MODE=demo
SESSION_SECRET=replace-with-long-random-secret
CORS_ORIGIN=http://localhost:5173
```

- Commit `.env.example` with placeholders only; never commit `.env`, database credentials, access tokens, or production exports.
- Keep database credentials server-side. The React bundle must never contain `COGNODB_PASSWORD` or connect directly to CognoDB.
- Require authenticated users in non-demo environments. Minimum roles: `QUALITY_MANAGER` (create/update/export), `OPERATIONS_VIEWER` (read-only), `ADMIN` (seed/migration only).
- Use HTTPS in deployed environments; configure CORS to explicit origins; validate and rate-limit API requests.
- Customer order data is limited to synthetic/order reference and store. Do not seed names, emails, addresses, payment data, or health information.
- Complaint and farmer-disclosure records contain only the investigation information needed for the demo. Do not seed customer or farmer contact details, home addresses, or allegations about individual wrongdoing.
- Audit investigation changes (actor, time, old/new status, rationale) in application logs or dedicated audit nodes/table as a production extension.

## 12. Acceptance criteria

The deliverable is accepted when all of the following are demonstrable:

1. A reviewer can run documented setup and load the deterministic seed data into CognoDB.
2. Priya can create/open `INV-2026-014`, see its clustered complaint evidence, reported finished-lot and suspect raw-lot anchors, and understand the incident narrative.
3. Global search resolves a finished lot by printed lot code and a raw lot by ID.
4. Reverse trace from `FL-2PCT-2026-08-117-B` returns its upstream batch and `RML-2026-08-041-A` with a visible path.
5. Forward trace from `RML-2026-08-041-A` returns downstream finished lot(s), shipment(s), and at least two store destinations.
6. Shared exposure returns at least two peer finished lots that do not directly consume the suspect raw lot; each result shows a tanker/tank/line and temporal reason.
7. The UI distinguishes candidate impact, excluded, and confirmed impact and requires a rationale for exclusions.
8. Result limits/truncation, empty results, invalid input, and database/API failure states are handled visibly and safely.
9. Exported CSV contains the run context and explainable evidence, not only a flat list of lot IDs.
10. Secrets are absent from source control and the browser; the official Neo4j driver is used only by the backend to connect to CognoDB.
11. The demo walkthrough completes using seed data without manual graph edits.
12. A reviewer can open the repeated complaint cluster for `AREA-AHMEDABAD-W-01`, see its resolved and unresolved reports, and confirm that area repetition alone does not set a contamination or fraud status.
13. A reviewer can open `INV-2026-015`, resolve the `FARM-014` disclosure to `RML-2026-08-041-A`, and forward-trace it to every known affected stage and destination.

## 13. README and delivery checklist

The project README must contain:

- Project purpose and a one-paragraph scenario.
- Architecture diagram or concise component explanation.
- Prerequisites, exact environment-variable setup, install/run commands, and verified CognoDB compatibility notes.
- Database schema/constraint migration instructions and seed/reset commands.
- How to run tests and what each test category covers.
- Seed data glossary with the key demo IDs.
- API endpoint summary and sample trace request/response shape.
- Demo walkthrough linked below.
- Limitations/assumptions, including that graph connectivity is candidate evidence, not a recall determination.

Before delivery, verify:

- [ ] No implementation code beyond the agreed project scope.
- [ ] Requirements, schema, seed IDs, API contract, and demo walkthrough use consistent identifiers.
- [ ] All required Cypher is parameterized and bounded.
- [ ] A fresh environment can use `.env.example` plus documented setup without guessing.
- [ ] The seed scenario demonstrates direct lineage, lot splitting, lot mixing, and shared non-descendant exposure.
- [ ] Screenshots/video for the job assignment use only fictional data and conceal credentials.

## 14. Five-minute demo walkthrough

1. Open `INV-2026-014`, **Off-odor complaints: 2% milk, August 2026**, and show the three-or-more complaint cluster in `AREA-AHMEDABAD-W-01`. Point out its resolved and unresolved reports, and that the cluster is an investigation lead rather than a conclusion about a farmer.
2. Show the reported anchor `FL-2PCT-2026-08-117-B`, then run reverse trace and select the path to `RML-2026-08-041-A`, including contributing batch/tank relationships.
3. Run forward trace from the suspect raw lot to show finished lots, shipments, distribution/store destinations, and an in-transit or unknown-arrival edge case.
4. Run shared exposure. Highlight peer finished lots connected through the tanker/tank or line-window rule, and point out that these lots are candidates even though they are not direct descendants of the suspect raw lot.
5. Open `INV-2026-015`, **Farmer self-report: FARM-014 collection**, and show the farm/date resolution returning `RML-2026-08-041-A` before the trace is run.
6. Show its forward custody chain and explain that any reached stage can be recommended for hold/recall while the investigation remains `UNDER_REVIEW`.
7. Open a peer lot’s evidence panel, show relationship times and the precise inclusion rule, then record an example exclusion with rationale.
8. Preview and download CSV, showing that the exported data includes paths/rules and investigation context. Close by stating that Priya has a faster, explainable scope assessment for human recall decision-making.

## 15. Why a graph database

A simple, fixed upstream or downstream trace can be modeled in SQL with recursive queries and carefully designed join tables. This product does not claim otherwise.

The difficult part is exploratory impact analysis across many changing, many-to-many directions: mixed lots become multiple batches; a lot splits across shipments; products share a tanker, tank, line, or distribution event; and an investigator must pivot repeatedly from source to product to vehicle to peer lot to store while preserving the evidence path. In a relational model, each new question typically expands into self-joins, bridge tables, recursive CTEs, and special-case query logic. In a graph, the domain connections are first-class and multi-hop traversals naturally return the explanation path along with the result.

CognoDB is therefore justified here for flexible, bounded lineage and shared-exposure exploration—not because SQL cannot trace a fixed chain, but because this recall workflow needs fast navigation across multiple relationship types and directions as the investigation evolves.

## 16. Free deployment plan

The assignment deployment consists of three separate services. CognoDB remains the managed graph database; the browser never connects to it directly.

```text
Cloudflare Pages (React frontend)
        -> HTTPS API requests
Koyeb Free Web Service (Fastify API + official neo4j-driver)
        -> Bolt + TLS
CognoDB Cloud (managed graph database)
```

### 16.1 Deployment boundaries

- **Cloudflare Pages:** hosts the static React/Vite application.
- **Koyeb:** hosts the Node.js/Fastify API. It is stateless and stores no graph data on its local filesystem.
- **CognoDB Cloud:** holds constraints, seed data, investigations, complaint/disclosure records, and all graph relationships.
- **GitHub:** holds source code, README, screenshots, and deployment configuration; the repository is private until the reviewer is granted access or it is made public for submission.
- The production frontend communicates only with `https://<api>.koyeb.app`. Only the API uses the official `neo4j-driver` and database credentials.

### 16.2 Secret handling and environment files

Normalize the local `.env` before implementation. It must contain dotenv key/value pairs only, with one active CognoDB connection configuration:

```dotenv
NODE_ENV=development
PORT=3001
COGNODB_URI=bolt+s://your-instance.databases.cognodb.cloud
COGNODB_USERNAME=cognodb
COGNODB_PASSWORD=replace-me
CORS_ORIGIN=http://localhost:5173
```

Requirements:

- `.env` is in `.gitignore` and is never committed, copied into screenshots, or placed in frontend source.
- Commit `.env.example` with the same keys and placeholder values only.
- If credentials have been exposed outside the developer's local machine, rotate the CognoDB password before deployment.
- The only frontend environment variable is `VITE_API_BASE_URL=https://<api>.koyeb.app`; it is public and must never contain a CognoDB URI, username, or password.
- Koyeb environment variables contain the production `COGNODB_URI`, `COGNODB_USERNAME`, `COGNODB_PASSWORD`, `NODE_ENV=production`, and the final Cloudflare Pages `CORS_ORIGIN`.

### 16.3 API deployment: Koyeb

1. Create one Koyeb **Free Web Service** from the GitHub repository.
2. Use the Node.js build/start commands documented in the final README. For the proposed pnpm workspace structure, the commands are:

   ```bash
   pnpm install --frozen-lockfile && pnpm --filter api build
   pnpm --filter api start
   ```

3. Bind the Fastify server to Koyeb's supplied `PORT` and `0.0.0.0`.
4. Set `/api/health` as the service health endpoint. It returns a safe status response and never a connection string, password, stack trace, or raw CognoDB error.
5. Add the production secrets through Koyeb's environment-variable dashboard, not source control.
6. Record the generated `https://<api>.koyeb.app` URL in the deployment checklist and use it as `VITE_API_BASE_URL` for the frontend.

The API must gracefully report an unavailable database to the frontend, while structured backend logs retain the correlation ID and sanitized error reason for diagnosis.

### 16.4 Production migration and seed

1. Run the migration/constraint script against CognoDB Cloud from a controlled developer machine using the production environment configuration.
2. Run the idempotent seed command once, for example:

   ```bash
   pnpm seed:production
   ```

3. The seed command creates `INV-2026-014`, `INV-2026-015`, the complaint cluster, farmer disclosure, direct lineage, shared exposure, split shipments, and documented edge cases.
4. Do not expose a public HTTP endpoint that can seed, reset, or delete production data.
5. Rerunning the seed must not create duplicate nodes or relationships.

### 16.5 Frontend deployment: Cloudflare Pages

1. Import the GitHub repository into Cloudflare Pages.
2. Build the React/Vite frontend with the documented command. For the proposed pnpm workspace structure:

   ```bash
   pnpm install --frozen-lockfile && pnpm --filter web build
   ```

3. Configure the output directory as `apps/web/dist`.
4. Configure `VITE_API_BASE_URL=https://<api>.koyeb.app` in Cloudflare Pages environment variables.
5. Include an SPA fallback file so direct links to routes such as `/investigations/INV-2026-014` resolve correctly:

   ```text
   /* /index.html 200
   ```

6. Deploy once to obtain the `https://<project>.pages.dev` URL.
7. Set Koyeb's `CORS_ORIGIN` to that exact Pages origin and redeploy/restart the API if needed. Do not leave production CORS open to `*`.

### 16.6 Submission readiness

- Add the live Cloudflare Pages URL and Koyeb health URL to the README.
- Keep the CognoDB instance, Koyeb service, and Pages deployment running until the reviewer has completed evaluation.
- Provide repository access if the GitHub repository remains private.
- Record a short screen demonstration of the two primary journeys after the live test passes.

## 17. Live deployment test checklist

Run this checklist after every first production deployment and before submitting the assignment.

### 17.1 Security and connectivity

- [ ] The Cloudflare Pages application loads over HTTPS.
- [ ] `GET https://<api>.koyeb.app/api/health` succeeds and confirms only safe application/database status.
- [ ] The browser bundle and network requests contain no `COGNODB_URI`, database username, or database password.
- [ ] The API accepts requests only from the configured Cloudflare Pages origin.
- [ ] GitHub has no committed `.env` file, credentials, or production export.
- [ ] Simulating an unavailable database produces a clear retryable UI state, not a blank page or raw error.

### 17.2 Seed and graph behavior

- [ ] Global search resolves `FL-2PCT-2026-08-117-B` by printed lot code and `RML-2026-08-041-A` by ID.
- [ ] Complaint-area cluster query shows the repeated reports in `AREA-AHMEDABAD-W-01`, including resolved and unresolved reports.
- [ ] Reverse trace from the complained-about finished lot shows the underlying raw-milk lot and farm path.
- [ ] `INV-2026-015` resolves the `FARM-014` disclosure to `RML-2026-08-041-A` before the farmer-led trace is run.
- [ ] Farmer-led forward trace visibly reaches every known stage: collection centre, tanker, tank, batch/line, intermediate lot, finished lot, shipment, destination, and customer-order/store data when present.
- [ ] Shared-exposure trace returns the seeded non-descendant peer lots with an exact tanker, tank, or line-window explanation.
- [ ] The seed command can be rerun without duplicating the graph.

### 17.3 Reviewer experience

- [ ] At desktop width, navigation, graph controls, evidence panel, and results table are usable without clipping.
- [ ] Loading, empty, invalid-input, no-results, and API/database-error states are readable and actionable.
- [ ] Export preview and CSV include investigation context and path/rule evidence.
- [ ] README includes setup, environment variables, data-model diagram, query explanation, screenshots, live demo URL, and a "Why a graph database?" section.
- [ ] Screen recording demonstrates: complaint cluster -> farm path -> farmer disclosure -> forward recall scope -> shared exposure -> evidence/export.
