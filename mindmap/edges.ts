// edges.ts
import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { randomBytes } from "node:crypto";

const db = new SQLDatabase("mindmap", { migrations: "./migrations" });

interface Edge {
  id: string;
  type?: string;
  weight?: number;
  label?: string;
  source_node_id: string;
  target_node_id: string;
  created_at?: string;
}

interface ListEdgesResponse {
  edges: Edge[];
}

// Create an Edge
export const createEdge = api(
  { method: "POST", path: "/edges", expose: true },
  async ({
    source_node_id,
    target_node_id,
    type,
    weight,
    label
  }: {
    source_node_id: string;
    target_node_id: string;
    type?: string;
    weight?: number;
    label?: string;
  }): Promise<Edge> => {
    if (!source_node_id || !target_node_id) {
      throw APIError.invalidArgument("source_node_id and target_node_id are required");
    }

    const sourceExists = await db.queryRow`SELECT id FROM nodes WHERE id = ${source_node_id}`;
    const targetExists = await db.queryRow`SELECT id FROM nodes WHERE id = ${target_node_id}`;
    if (!sourceExists) throw APIError.notFound("Source node not found");
    if (!targetExists) throw APIError.notFound("Target node not found");

    const edgeId = randomBytes(6).toString("base64url");

    await db.exec`
      INSERT INTO edges (id, type, weight, label, source_node_id, target_node_id)
      VALUES (${edgeId}, ${type ?? ""}, ${weight ?? 0}, ${label ?? ""}, ${source_node_id}, ${target_node_id})
    `;

    return { id: edgeId, source_node_id, target_node_id, type, weight, label };
  }
);

// Get an Edge by ID
export const getEdge = api(
  { method: "GET", path: "/edges/:id", expose: true },
  async ({ id }: { id: string }): Promise<Edge> => {
    const row = await db.queryRow`
      SELECT id, type, weight, label, source_node_id, target_node_id, created_at
      FROM edges WHERE id = ${id}
    `;
    if (!row) throw APIError.notFound("Edge not found");

    return {
      id: row.id,
      type: row.type,
      weight: row.weight,
      label: row.label,
      source_node_id: row.source_node_id,
      target_node_id: row.target_node_id,
      created_at: row.created_at,
    };
  }
);

// Update an Edge
export const updateEdge = api(
  { method: "PATCH", path: "/edges/:id", expose: true },
  async ({
    id,
    type,
    weight,
    label
  }: {
    id: string;
    type?: string;
    weight?: number;
    label?: string;
  }): Promise<Edge> => {
    const edge = await db.queryRow`
      SELECT id, type, weight, label, source_node_id, target_node_id, created_at
      FROM edges WHERE id = ${id}
    `;
    if (!edge) throw APIError.notFound("Edge not found");

    const newType = type ?? edge.type;
    const newWeight = weight ?? edge.weight;
    const newLabel = label ?? edge.label;

    await db.exec`
      UPDATE edges SET type=${newType}, weight=${newWeight}, label=${newLabel}
      WHERE id = ${id}
    `;

    return {
      id: edge.id,
      type: newType,
      weight: newWeight,
      label: newLabel,
      source_node_id: edge.source_node_id,
      target_node_id: edge.target_node_id,
      created_at: edge.created_at,
    };
  }
);

// Delete an Edge
export const deleteEdge = api(
  { method: "DELETE", path: "/edges/:id", expose: true },
  async ({ id }: { id: string }): Promise<{ success: boolean }> => {
    const edgeExists = await db.queryRow`SELECT id FROM edges WHERE id = ${id}`;
    if (!edgeExists) throw APIError.notFound("Edge not found");

    await db.exec`DELETE FROM edges WHERE id = ${id}`;
    return { success: true };
  }
);

// List all Edges
export const listEdges = api(
  { method: "GET", path: "/edges", expose: true },
  async (): Promise<ListEdgesResponse> => {
    const rows = db.query`
      SELECT id, type, weight, label, source_node_id, target_node_id, created_at
      FROM edges
      ORDER BY created_at DESC
    `;
    const edges: Edge[] = [];
    for await (const row of rows) {
      edges.push({
        id: row.id,
        type: row.type,
        weight: row.weight,
        label: row.label,
        source_node_id: row.source_node_id,
        target_node_id: row.target_node_id,
        created_at: row.created_at,
      });
    }
    return { edges };
  }
);
