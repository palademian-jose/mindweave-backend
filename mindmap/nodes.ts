import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { randomBytes } from "node:crypto";

const db = new SQLDatabase("mindmap", { migrations: "./migrations" });

interface Node {
  id: string;
  title: string;
  description?: string;
  color?: string;
  type?: string;
  position_x?: number;
  position_y?: number;
  created_at?: Date | string;
  updated_at?: Date | string;
}

interface ListNodesResponse {
  nodes: Node[];
  total: number;
}

// Create a Node
export const createNode = api(
  { method: "POST", path: "/nodes", expose: true },
  async ({
    title,
    description,
    color,
    type,
    x,
    y,
  }: {
    title: string;
    description?: string;
    color?: string;
    type?: string;
    x?: number;
    y?: number;
  }): Promise<Node> => {
    if (!title || title.trim() === "") {
      throw APIError.invalidArgument("Title is required and cannot be empty");
    }

    const nodeId = randomBytes(6).toString("base64url");

    await db.exec`
      INSERT INTO nodes (id, title, description, color, type, position_x, position_y, created_at, updated_at)
      VALUES (${nodeId}, ${title}, ${description ?? ""}, ${color ?? ""}, ${type ?? ""}, ${x ?? 0}, ${y ?? 0}, NOW(), NOW())
    `;

    return {
      id: nodeId,
      title,
      description,
      color,
      type,
      position_x: x,
      position_y: y,
      created_at: new Date(),
      updated_at: new Date(),
    };
  }
);

// Get a Node by ID
export const getNode = api(
  { method: "GET", path: "/nodes/:id", expose: true },
  async ({ id }: { id: string }): Promise<Node> => {
    const row = await db.queryRow`
      SELECT id, title, description, color, type, position_x, position_y, created_at, updated_at
      FROM nodes WHERE id = ${id}
    `;
    if (!row) throw APIError.notFound("Node not found");

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      color: row.color,
      type: row.type,
      position_x: row.position_x,
      position_y: row.position_y,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
);

// Update a Node
export const updateNode = api(
  { method: "PATCH", path: "/nodes/:id", expose: true },
  async ({
    id,
    title,
    description,
    color,
    type,
    x,
    y,
  }: {
    id: string;
    title?: string;
    description?: string;
    color?: string;
    type?: string;
    x?: number;
    y?: number;
  }): Promise<Node> => {
    const node = await db.queryRow`
      SELECT id, title, description, color, type, position_x, position_y, created_at, updated_at
      FROM nodes WHERE id = ${id}
    `;
    if (!node) throw APIError.notFound("Node not found");

    await db.exec`
      UPDATE nodes
      SET 
        title=${title ?? node.title},
        description=${description ?? node.description},
        color=${color ?? node.color},
        type=${type ?? node.type},
        position_x=${x ?? node.position_x},
        position_y=${y ?? node.position_y},
        updated_at=NOW()
      WHERE id = ${id}
    `;

    return {
      id,
      title: title ?? node.title,
      description: description ?? node.description,
      color: color ?? node.color,
      type: type ?? node.type,
      position_x: x ?? node.position_x,
      position_y: y ?? node.position_y,
      created_at: node.created_at,
      updated_at: new Date(),
    };
  }
);

// Delete a Node
export const deleteNode = api(
  { method: "DELETE", path: "/nodes/:id", expose: true },
  async ({ id }: { id: string }): Promise<{ success: boolean }> => {
    const nodeExists = await db.queryRow`SELECT id FROM nodes WHERE id = ${id}`;
    if (!nodeExists) throw APIError.notFound("Node not found");

    await db.exec`DELETE FROM nodes WHERE id = ${id}`;
    return { success: true };
  }
);

// List all Nodes
export const listNodes = api(
    { method: "GET", path: "/nodes", expose: true },
    async ({ limit = 10, offset = 0 }: { limit?: number; offset?: number }): Promise<ListNodesResponse> => {
      const totalRows = await db.queryRow`SELECT COUNT(*) as total FROM nodes`;
      const total = totalRows?.total ?? 0;
  
      const rowsArray: any[] = [];
      for await (const row of db.query`
        SELECT id, title, description, color, type, position_x, position_y, created_at, updated_at
        FROM nodes
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `) {
        rowsArray.push(row);
      }
  
      const nodes: Node[] = rowsArray.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        color: row.color,
        type: row.type,
        position_x: row.position_x,
        position_y: row.position_y,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
  
      return { nodes, total };
    }
  );
  
