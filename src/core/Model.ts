// src/Model.ts
import { db } from "./Db";
import { Request } from "./Request";

export type RelationConfig = {
  type: "hasOne" | "hasMany" | "belongsToMany";
  model: typeof Model;
  foreignKey?: string;
  localKey?: string;
  pivotTable?: string;
  foreignPivotKey?: string;
  relatedPivotKey?: string;
  columns?: string[] | string;
};

export type WithOption = string | { [relation: string]: string[] };

export class Model {
  table: string;
  private _withRelations: WithOption[] = [];
  private _conditions: Record<string, any> = {};
  private _columns?: string[] | string;

  constructor(table: string) {
    this.table = table;
  }

  /** Paginate results based on previously set WHERE */
  wheres(conditions: Record<string, any>, columns?: string[] | string) {
    this._conditions = conditions;
    this._columns = columns;
    return this;
  }

  async paginate(defaultPerPage = 10) {
    const req = Request.current(); // Get current request

    // Read from query params
    const page = parseInt(req.query.get("page") || "1", 10);
    const perPage = parseInt(
      req.query.get("perPage") || defaultPerPage.toString(),
      10
    );

    const offset = (page - 1) * perPage;
    const baseUrl = process.env.BASE_URL;

    // Prepare WHERE clause
    const keys = Object.keys(this._conditions);
    const values = Object.values(this._conditions);
    const whereClause =
      keys.length > 0
        ? "WHERE " + keys.map((k) => `\`${k}\` = ?`).join(" AND ")
        : "";

    // Count total records
    const [countRows] = await db.query(
      `SELECT COUNT(*) as total FROM \`${this.table}\` ${whereClause}`,
      values
    );
    const total = (countRows as any[])[0].total;
    const lastPage = Math.ceil(total / perPage);

    // Fetch data for current page
    const [rows] = await db.query(
      `
    SELECT ${this.formatColumns(this._columns)} 
    FROM \`${this.table}\`
    ${whereClause}
    LIMIT ? OFFSET ?
  `,
      [...values, perPage, offset]
    );

    const data = await this.loadRelations(rows as any[]);

    // Build pagination URLs
    const nextPage = page < lastPage ? page + 1 : null;
    const prevPage = page > 1 ? page - 1 : null;

    const nextPageUrl = nextPage
      ? `${baseUrl}?page=${nextPage}&perPage=${perPage}`
      : null;
    const prevPageUrl = prevPage
      ? `${baseUrl}?page=${prevPage}&perPage=${perPage}`
      : null;

    // Clear temporary query state after execution
    this._conditions = {};
    this._columns = undefined;

    return {
      data,
      pagination: {
        total,
        perPage,
        currentPage: page,
        lastPage,
        nextPageUrl,
        prevPageUrl,
      },
    };
  }

  // ---------------- Helper: Format SELECT columns ----------------
  protected formatColumns(columns?: string[] | string): string {
    if (!columns) return "*";
    if (typeof columns === "string") return columns;
    return columns.map((c) => `\`${c}\``).join(", ");
  }

  // ---------------- Relation: eager loading ----------------
  with(...relations: WithOption[]) {
    this._withRelations = relations;
    return this;
  }

  private async loadRelations(records: any[] | any): Promise<any> {
    if (!records || this._withRelations.length === 0) return records;
    const isArray = Array.isArray(records);
    const data = isArray ? records : [records];

    for (const relationOption of this._withRelations) {
      let relationName: string;
      let columns: string[] | undefined;

      if (typeof relationOption === "string") {
        relationName = relationOption;
      } else {
        relationName = Object.keys(relationOption)[0];
        columns = relationOption[relationName];
      }

      if (typeof (this as any)[relationName] !== "function") continue;

      for (const record of data) {
        const relConfig: RelationConfig = (this as any)[relationName](record);
        if (!relConfig) continue;

        // ----- hasOne / hasMany -----
        if (relConfig.type === "hasOne" || relConfig.type === "hasMany") {
          const target = new relConfig.model(
            relConfig.model.name.toLowerCase()
          );
          const results = await target.where(
            { [relConfig.foreignKey!]: record[relConfig.localKey || "id"] },
            columns || relConfig.columns
          );
          record[relationName] =
            relConfig.type === "hasOne" ? results[0] || null : results;
        }

        // ----- belongsToMany -----
        else if (relConfig.type === "belongsToMany") {
          const target = new relConfig.model(
            relConfig.model.name.toLowerCase()
          );
          const query = `
            SELECT ${this.formatColumns(columns || relConfig.columns)} 
            FROM \`${target.table}\`
            JOIN \`${relConfig.pivotTable}\` 
              ON \`${target.table}\`.id = \`${relConfig.pivotTable}\`.\`${
            relConfig.relatedPivotKey
          }\`
            WHERE \`${relConfig.pivotTable}\`.\`${
            relConfig.foreignPivotKey
          }\` = ?
          `;
          const [rows] = await db.query(query, [
            record[relConfig.localKey || "id"],
          ]);
          record[relationName] = rows;
        }
      }
    }

    return isArray ? data : data[0];
  }

  // ---------------- CRUD Methods ----------------

  /** Get all records */
  async all(columns: string[] | string = "*"): Promise<any[]> {
    const [rows] = await db.query(
      `SELECT ${this.formatColumns(columns)} FROM \`${this.table}\``
    );
    return rows as any[];
  }

  /** Find by ID */
  async find(id: number | string, columns?: string[] | string) {
    const [rows] = await db.query(
      `SELECT ${this.formatColumns(columns)} FROM \`${
        this.table
      }\` WHERE id = ? LIMIT 1`,
      [id]
    );
    return this.loadRelations((rows as any[])[0] || null);
  }

  /** Conditional WHERE query */
  async where(
    conditions: Record<string, any>,
    columns?: string[] | string
  ): Promise<any[]> {
    const keys = Object.keys(conditions);
    const values = Object.values(conditions);
    const whereClause = keys.map((k) => `\`${k}\` = ?`).join(" AND ");

    const [rows] = await db.query(
      `SELECT ${this.formatColumns(columns)} FROM \`${
        this.table
      }\` WHERE ${whereClause}`,
      values
    );
    return this.loadRelations(rows as any[]);
  }

  /** Find first record matching conditions */
  async firstWhere(conditions: Record<string, any> = {}): Promise<any | null> {
    const keys = Object.keys(conditions);
    let query = `SELECT * FROM \`${this.table}\``;
    let values: any[] = [];

    if (keys.length > 0) {
      const whereClause = keys.map((k) => `\`${k}\` = ?`).join(" AND ");
      query += ` WHERE ${whereClause}`;
      values = Object.values(conditions);
    }

    query += " LIMIT 1";
    const [rows] = await db.query(query, values);
    return (rows as any[])[0] || null;
  }

  /** Create new record */
  async create(data: Record<string, any> = {}): Promise<any> {
    if (Object.keys(data).length === 0) {
      // Create blank row using DB defaults
      const [result] = await db.query(
        `INSERT INTO \`${this.table}\` () VALUES ()`
      );
      const insertId = (result as any).insertId;
      const [rows] = await db.query(
        `SELECT * FROM \`${this.table}\` WHERE id = ? LIMIT 1`,
        [insertId]
      );
      return (rows as any[])[0];
    }

    const keys = Object.keys(data)
      .map((k) => `\`${k}\``)
      .join(", ");
    const placeholders = Object.keys(data)
      .map(() => "?")
      .join(", ");
    const values = Object.values(data);

    const [result] = await db.query(
      `INSERT INTO \`${this.table}\` (${keys}) VALUES (${placeholders})`,
      values
    );

    const insertId = (result as any).insertId;
    const [rows] = await db.query(
      `SELECT * FROM \`${this.table}\` WHERE id = ? LIMIT 1`,
      [insertId]
    );
    return (rows as any[])[0];
  }

  /** Update record by ID */
  async update(id: number | string, data: Record<string, any>) {
    const updates = Object.keys(data)
      .map((k) => `\`${k}\` = ?`)
      .join(", ");
    const values = [...Object.values(data), id];
    const [result] = await db.query(
      `UPDATE \`${this.table}\` SET ${updates} WHERE id = ?`,
      values
    );
    return result;
  }

  /** Delete record by ID */
  async delete(id: number | string) {
    const [result] = await db.query(
      `DELETE FROM \`${this.table}\` WHERE id = ?`,
      [id]
    );
    return result;
  }

  // ---------------- Relationships ----------------

  hasOne(
    TargetModel: typeof Model,
    foreignKey: string,
    localKey: string = "id"
  ): RelationConfig {
    return { type: "hasOne", model: TargetModel, foreignKey, localKey };
  }

  hasMany(
    TargetModel: typeof Model,
    foreignKey: string,
    localKey: string = "id"
  ): RelationConfig {
    return { type: "hasMany", model: TargetModel, foreignKey, localKey };
  }

  belongsToMany(
    TargetModel: typeof Model,
    pivotTable: string,
    foreignPivotKey: string,
    relatedPivotKey: string,
    localKey: string = "id",
    columns?: string[] | string
  ): RelationConfig {
    return {
      type: "belongsToMany",
      model: TargetModel,
      pivotTable,
      foreignPivotKey,
      relatedPivotKey,
      localKey,
      columns,
    };
  }

  // ---------------- Smart Helpers ----------------

  /** Find first record or create new (with optional conditions) */
  async firstOrNew(conditions?: Record<string, any>): Promise<any> {
    if (conditions && Object.keys(conditions).length > 0) {
      const existing = await this.firstWhere(conditions);
      if (existing) return existing;
      return await this.create(conditions);
    }

    const first = await this.firstWhere();
    if (first) return first;
    return await this.create();
  }

  /** Update if exists, else create */
  async updateOrCreate(
    conditions: Record<string, any>,
    values: Record<string, any>
  ): Promise<any> {
    const existing = await this.firstWhere(conditions);
    if (existing) {
      await this.update(existing.id, values);
      return await this.find(existing.id);
    }
    return await this.create({ ...conditions, ...values });
  }

  async findOne(
    conditions: Record<string, any> = {},
    columns?: string[] | string
  ): Promise<any | null> {
    const keys = Object.keys(conditions);
    if (keys.length === 0) return null;

    const whereClause = keys.map((k) => `\`${k}\` = ?`).join(" OR ");
    const values = Object.values(conditions);

    const query = `
    SELECT ${columns ? this.formatColumns(columns) : "*"}
    FROM \`${this.table}\`
    WHERE ${whereClause}
    LIMIT 1
  `;

    const [rows] = await db.query(query, values);
    return (rows as any[])[0] || null;
  }
}
