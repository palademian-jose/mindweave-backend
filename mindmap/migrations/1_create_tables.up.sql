-- mindmap/migrations/1_create_tables.up.sql
CREATE TABLE nodes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT,
  type TEXT,
  position_x DOUBLE PRECISION,
  position_y DOUBLE PRECISION,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE edges (
  id TEXT PRIMARY KEY,
  type TEXT,
  weight DOUBLE PRECISION,
  label TEXT,
  source_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_source FOREIGN KEY(source_node_id) REFERENCES nodes(id) ON DELETE CASCADE,
  CONSTRAINT fk_target FOREIGN KEY(target_node_id) REFERENCES nodes(id) ON DELETE CASCADE
);
