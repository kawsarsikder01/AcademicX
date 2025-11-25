// src/core/Model.ts
import { db } from "./Db";
import { Request } from "./Request";

/* --------------------  TYPES  -------------------- */
export type RelationConfig =
  | {
      type: "hasOne" | "hasMany" | "belongsTo" | "belongsToMany";
      model: typeof Model;
      foreignKey?: string;
      localKey?: string;
      pivotTable?: string;
      foreignPivotKey?: string;
      relatedPivotKey?: string;
      columns?: string[] | string;
    }
  | {
      type: "morphOne" | "morphMany";
      model: typeof Model;
      morphName: string;
      columns?: string[] | string;
    }
  | {
      type: "morphTo";
      morphName: string;
      modelResolver: (type: string) => typeof Model | null;
    };

export type WithOption = string | { [relation: string]: string[] | string };

/* --------------------  BASE MODEL  -------------------- */
export class Model {
  public table: string;
  private _conditions: Record<string, any> = {};
  private _columns?: string[] | string;
  private _withRelations: WithOption[] = [];
  private _whereIn: Record<string, any[]> = {};
  constructor(table: string) {
    this.table = table;
  }

  /* ============================================================
   * QUERY BUILDER  (chainable)
   * ============================================================ */
  where(conditions: Record<string, any>, columns?: string[] | string) {
    this._conditions = { ...this._conditions, ...conditions };
    if (columns) this._columns = columns;
    return this;
  }

  whereIn(column: string, values: any[]): this {
    if (!values.length) return this; // skip empty
    this._whereIn[column] = values;
    return this;
  }

  select(columns: string[] | string) {
    this._columns = columns;
    return this;
  }

  with(...relations: WithOption[]) {
    this._withRelations.push(...relations);
    return this;
  }

  /* ============================================================
   * EXECUTION
   * ============================================================ */
  async get(): Promise<any[]> {
    const { sql, values } = this.buildSelect();
    const [rows] = await db.query(sql, values);
    const out = await this.loadRelations(rows as any[]);
    this.resetQuery();
    return out;
  }

  async all(): Promise<any[]> {
    return this.get();
  }

  async first(): Promise<any | null> {
    const { sql, values } = this.buildSelect(1);
    const [rows] = await db.query(sql, values);
    const row = (rows as any[])[0] ?? null;
    const out = await this.loadRelations(row);
    this.resetQuery();
    return out;
  }

  async find(id: number | string, pk = "id") {
    const [rows] = await db.query(
      `SELECT ${this.formatColumns(this._columns)} FROM \`${
        this.table
      }\` WHERE \`${pk}\` = ? LIMIT 1`,
      [id]
    );
    const row = (rows as any[])[0] ?? null;
    const out = await this.loadRelations(row);
    this.resetQuery();
    return out;
  }

  async paginate(defaultPerPage = 10) {
    const req = Request.current();
    const page = Math.max(1, Number(req.query.get("page") || 1));
    const perPage = Math.max(
      1,
      Number(req.query.get("perPage") || defaultPerPage)
    );
    const offset = (page - 1) * perPage;

    const { sql: cntSql, values: cntVals } = this.buildCount();
    const [cntRows] = await db.query(cntSql, cntVals);
    const total = (cntRows as any[])[0].total;
    const lastPage = Math.ceil(total / perPage);

    const { sql, values } = this.buildSelect(perPage, offset);
    const [rows] = await db.query(sql, values);
    const data = await this.loadRelations(rows as any[]);
    this.resetQuery();

    const base = (process.env.BASE_URL || "").replace(/\/$/, "");
    return {
      data,
      pagination: {
        total,
        perPage,
        currentPage: page,
        lastPage,
        nextPageUrl:
          page < lastPage
            ? `${base}?page=${page + 1}&perPage=${perPage}`
            : null,
        prevPageUrl:
          page > 1 ? `${base}?page=${page - 1}&perPage=${perPage}` : null,
      },
    };
  }

  /* ============================================================
   * CRUD
   * ============================================================ */
  async create(data: Record<string, any> = {}): Promise<any> {
    const keys = Object.keys(data);
    const vals = Object.values(data);

    let sql: string;
    if (keys.length) {
      sql =
        `INSERT INTO \`${this.table}\` (` +
        keys.map((k) => `\`${k}\``).join(", ") +
        ") VALUES (" +
        vals.map(() => "?").join(", ") +
        ")";
    } else {
      sql = `INSERT INTO \`${this.table}\` VALUES ROW()`; // MySQL 8
    }

    const [res] = await db.query(sql, vals);
    return this.find((res as any).insertId);
  }

  async update(id: number | string, data: Record<string, any>, pk = "id") {
    const set = Object.keys(data)
      .map((k) => `\`${k}\` = ?`)
      .join(", ");
    await db.query(`UPDATE \`${this.table}\` SET ${set} WHERE \`${pk}\` = ?`, [
      ...Object.values(data),
      id,
    ]);
    return this.find(id, pk);
  }

  async delete(id: number | string, pk = "id") {
    await db.query(`DELETE FROM \`${this.table}\` WHERE \`${pk}\` = ?`, [id]);
  }

  async firstWhere(conditions: Record<string, any> = {}): Promise<any | null> {
    return this.where(conditions).first();
  }

  async updateOrCreate(
    conditions: Record<string, any>,
    values: Record<string, any>
  ) {
    const found = await this.firstWhere(conditions);
    if (found) return this.update(found.id, values);
    return this.create({ ...conditions, ...values });
  }

  async firstOrNew(conditions?: Record<string, any>): Promise<any> {
    if (conditions && Object.keys(conditions).length) {
      const found = await this.firstWhere(conditions);
      if (found) return found;
      return this.create(conditions);
    }
    const found = await this.firstWhere();
    if (found) return found;
    return this.create();
  }

  async findOne(
    conditions: Record<string, any> = {},
    columns?: string[] | string
  ) {
    const keys = Object.keys(conditions);
    if (!keys.length) return null;
    const where = keys.map((k) => `\`${k}\` = ?`).join(" OR ");
    const [rows] = await db.query(
      `SELECT ${this.formatColumns(columns)} FROM \`${
        this.table
      }\` WHERE ${where} LIMIT 1`,
      Object.values(conditions)
    );
    return (rows as any[])[0] ?? null;
  }

  /* ============================================================
   * RELATIONSHIP DECLARATIONS  (zero-arg methods)
   * ============================================================ */
  hasOne(Target: typeof Model, fk: string, localKey = "id"): RelationConfig {
    return { type: "hasOne", model: Target, foreignKey: fk, localKey };
  }
  hasMany(Target: typeof Model, fk: string, localKey = "id"): RelationConfig {
    return { type: "hasMany", model: Target, foreignKey: fk, localKey };
  }
  belongsTo(Target: typeof Model, fk: string, ownerKey = "id"): RelationConfig {
    return {
      type: "belongsTo",
      model: Target,
      foreignKey: fk,
      localKey: ownerKey,
    };
  }
  belongsToMany(
    Target: typeof Model,
    pivot: string,
    fkPivot: string,
    relPivot: string,
    localKey = "id"
  ): RelationConfig {
    return {
      type: "belongsToMany",
      model: Target,
      pivotTable: pivot,
      foreignPivotKey: fkPivot,
      relatedPivotKey: relPivot,
      localKey,
    };
  }
  morphOne(Target: typeof Model, name: string): RelationConfig {
    return { type: "morphOne", model: Target, morphName: name };
  }
  morphMany(Target: typeof Model, name: string): RelationConfig {
    return { type: "morphMany", model: Target, morphName: name };
  }
  morphTo(name: string, map: Record<string, typeof Model>): RelationConfig {
    return {
      type: "morphTo",
      morphName: name,
      modelResolver: (t) => map[t] || null,
    };
  }

  /* ============================================================
   * INTERNALS
   * ============================================================ */
  private buildSelect(limit?: number, offset?: number) {
    const { where, values } = this.buildWhere();
    let sql = `SELECT ${this.formatColumns(this._columns)} FROM \`${
      this.table
    }\` ${where}`;
    if (limit) sql += ` LIMIT ${limit}`;
    if (offset) sql += ` OFFSET ${offset}`;
    return { sql, values };
  }

  private buildCount() {
    const { where, values } = this.buildWhere();
    const sql = `SELECT COUNT(*) as total FROM \`${this.table}\` ${where}`;
    return { sql, values };
  }

  private buildWhere() {
    const keys = Object.keys(this._conditions);
    const whereInKeys = Object.keys(this._whereIn);
    const values: any[] = [];
  
    let whereParts: string[] = [];
  
    // Normal conditions
    for (const k of keys) {
      values.push(this._conditions[k]);
      whereParts.push(`\`${k}\` = ?`);
    }
  
    // WHERE IN conditions
    for (const k of whereInKeys) {
      const vals = this._whereIn[k];
      if (!vals.length) continue;
      const placeholders = vals.map(() => "?").join(", ");
      whereParts.push(`\`${k}\` IN (${placeholders})`);
      values.push(...vals);
    }
  
    const where = whereParts.length ? "WHERE " + whereParts.join(" AND ") : "";
    return { where, values };
  }
  

  private formatColumns(cols?: string[] | string): string {
    if (!cols) return "*";
    if (typeof cols === "string") return cols;
    return cols.map((c) => `\`${c}\``).join(", ");
  }

  private resetQuery() {
    this._conditions = {};
    this._columns = undefined;
    this._withRelations = [];
    this._whereIn = {};
  }

  /* ============================================================
   * EAGER-LOAD RELATIONS (fixed for nested relations)
   * ============================================================ */
  /* ============================================================
   * EAGER-LOAD RELATIONS (fixed, TS-safe)
   * ============================================================ */
  private async loadRelations(
    records: any | any[],
    _withRelations?: WithOption[]
  ): Promise<any> {
    if (!records) return records;

    const single = !Array.isArray(records);
    const data = single ? [records] : records;

    const relations = _withRelations ?? this._withRelations;
    if (!relations.length) return single ? data[0] : data;

    for (const opt of relations) {
      const [relName, ...nestedParts] =
        typeof opt === "string" ? opt.split(".") : [Object.keys(opt)[0]];
      const columns = typeof opt === "object" ? opt[relName] : undefined;

      for (const row of data) {
        let target: Model | null = null; // TS-safe
        let result: any = null;

        const cfg: RelationConfig = (this as any)[relName]?.();
        if (!cfg) continue;

        switch (cfg.type) {
          case "hasOne":
          case "hasMany":
            target = new cfg.model(cfg.model.name.toLowerCase());
            result = await target
              .where({ [cfg.foreignKey!]: row[cfg.localKey || "id"] })
              .select(columns ?? cfg.columns ?? "*")
              .get();
            if (cfg.type === "hasOne") result = result[0] ?? null;
            break;

          case "belongsTo":
            target = new cfg.model(cfg.model.name.toLowerCase());
            const [btRows] = await db.query(
              `SELECT ${this.formatColumns(columns ?? cfg.columns ?? "*")}
             FROM \`${target.table}\`
             WHERE \`${cfg.localKey}\` = ?
             LIMIT 1`,
              [row[cfg.foreignKey!]]
            );
            result = (btRows as any[])[0] ?? null;
            break;

          case "belongsToMany":
            target = new cfg.model(cfg.model.name.toLowerCase());
            const [btmRows] = await db.query(
              `SELECT ${this.formatColumns(columns ?? cfg.columns ?? "*")}
             FROM \`${target.table}\`
             JOIN \`${cfg.pivotTable}\`
               ON \`${target.table}\`.id = \`${cfg.pivotTable}\`.\`${
                cfg.relatedPivotKey
              }\`
             WHERE \`${cfg.pivotTable}\`.\`${cfg.foreignPivotKey}\` = ?`,
              [row[cfg.localKey || "id"]]
            );
            result = btmRows as any[];
            break;

          case "morphOne":
          case "morphMany":
            target = new cfg.model(cfg.model.name.toLowerCase());
            const typeCol = cfg.morphName + "_type";
            const idCol = cfg.morphName + "_id";
            const [morphRows] = await db.query(
              `SELECT ${this.formatColumns(columns ?? cfg.columns ?? "*")}
             FROM \`${target.table}\`
             WHERE \`${typeCol}\` = ?
               AND \`${idCol}\` = ?
             ${cfg.type === "morphOne" ? "LIMIT 1" : ""}`,
              [(this as any).constructor.name, row.id]
            );
            result =
              cfg.type === "morphOne"
                ? (morphRows as any[])[0] ?? null
                : (morphRows as any[]);
            break;

          case "morphTo":
            const type = row[cfg.morphName + "_type"];
            const id = row[cfg.morphName + "_id"];
            if (!type || !id) {
              result = null;
              break;
            }
            const Klass = cfg.modelResolver(type);
            if (!Klass) {
              result = null;
              break;
            }
            target = new Klass(Klass.name.toLowerCase());
            const [rows] = await db.query(
              `SELECT * FROM \`${target.table}\` WHERE \`id\` = ? LIMIT 1`,
              [id]
            );
            result = (rows as any[])[0] ?? null;
            break;
        }

        // Attach result to row
        row[relName] =
          result ??
          (cfg.type === "hasMany" ||
          cfg.type === "belongsToMany" ||
          cfg.type === "morphMany"
            ? []
            : null);

        // Recurse for nested relations
        if (nestedParts.length && row[relName]) {
          const nestedDot = nestedParts.join(".");
          if (Array.isArray(row[relName])) {
            for (const item of row[relName]) {
              if (target) await target.with(nestedDot).loadRelations(item);
            }
          } else {
            if (target)
              await target.with(nestedDot).loadRelations(row[relName]);
          }
        }
      }
    }

    return single ? data[0] : data;
  }
}
