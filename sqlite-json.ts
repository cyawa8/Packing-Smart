import fs from "fs";
import path from "path";

const FILE_PATH = path.join(process.cwd(), "database.json");

interface User {
  id: number;
  username: string;
  password?: string;
  role: "admin" | "packer";
}

interface PackingItem {
  id: number;
  resi_number: string;
  drive_link: string;
  user_id: number;
  timestamp: string; // ISO format
}

interface LogEntry {
  id: number;
  description: string;
  user_id: number;
  timestamp: string; // ISO format
}

interface DbSchema {
  users: User[];
  packing_list: PackingItem[];
  logs: LogEntry[];
  nextUserId: number;
  nextPackingId: number;
  nextLogId: number;
}

const getTodayDateStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
};

class JSONDatabase {
  private data: DbSchema;

  constructor(filename: string, callback?: (err: Error | null) => void) {
    this.data = this.loadData();
    // Execute asynchronously to mimic sqlite initialization callback
    if (callback) {
      setTimeout(() => callback(null), 0);
    }
  }

  private loadData(): DbSchema {
    try {
      if (fs.existsSync(FILE_PATH)) {
        const raw = fs.readFileSync(FILE_PATH, "utf8");
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error("Error reading database json file, resetting:", e);
    }

    const defaultData: DbSchema = {
      users: [],
      packing_list: [],
      logs: [],
      nextUserId: 1,
      nextPackingId: 1,
      nextLogId: 1,
    };
    this.saveData(defaultData);
    return defaultData;
  }

  private saveData(data: DbSchema = this.data) {
    try {
      fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), "utf8");
    } catch (err) {
      console.error("Failed to save database JSON file:", err);
    }
  }

  serialize(cb: () => void) {
    // Just run synchronously
    cb();
  }

  run(sql: string, params?: any[] | any, callback?: (err: Error | null) => void) {
    // Standardize params as array
    let actualParams: any[] = [];
    let actualCallback = callback;
    if (typeof params === "function") {
      actualCallback = params;
    } else if (Array.isArray(params)) {
      actualParams = params;
    } else if (params !== undefined) {
      actualParams = [params];
    }

    const lowerSql = sql.toLowerCase();

    // 1. CREATE TABLE
    if (lowerSql.includes("create table")) {
      if (actualCallback) setTimeout(() => actualCallback!(null), 0);
      return this;
    }

    // 2. INSERT OR IGNORE INTO users
    if (lowerSql.includes("insert or ignore into users")) {
      const [username, password, role] = actualParams;
      const exists = this.data.users.some(u => u.username === username);
      if (!exists) {
        this.data.users.push({
          id: this.data.nextUserId++,
          username,
          password,
          role,
        });
        this.saveData();
      }
      if (actualCallback) setTimeout(() => actualCallback!(null), 0);
      return this;
    }

    // 3. INSERT OR REPLACE INTO packing_list
    if (lowerSql.includes("insert or replace into packing_list")) {
      const [resi_number, drive_link, user_id] = actualParams;
      const existingIdx = this.data.packing_list.findIndex(p => p.resi_number === resi_number);
      const nowStr = new Date().toISOString();
      if (existingIdx !== -1) {
        this.data.packing_list[existingIdx].drive_link = drive_link;
        this.data.packing_list[existingIdx].user_id = user_id;
        this.data.packing_list[existingIdx].timestamp = nowStr;
      } else {
        this.data.packing_list.push({
          id: this.data.nextPackingId++,
          resi_number,
          drive_link,
          user_id,
          timestamp: nowStr,
        });
      }
      this.saveData();
      if (actualCallback) setTimeout(() => actualCallback!(null), 0);
      return this;
    }

    // 4. INSERT INTO users
    if (lowerSql.includes("insert into users")) {
      const [username, password, role] = actualParams;
      const exists = this.data.users.some(u => u.username === username);
      if (exists) {
        if (actualCallback) {
          setTimeout(() => actualCallback!(new Error("Username already exists")), 0);
        }
        return this;
      }
      const newId = this.data.nextUserId++;
      this.data.users.push({
        id: newId,
        username,
        password,
        role,
      });
      this.saveData();
      if (actualCallback) {
        setTimeout(() => {
          actualCallback!.call({ lastID: newId }, null);
        }, 0);
      }
      return this;
    }

    // 5. INSERT INTO logs
    if (lowerSql.includes("insert into logs")) {
      const [description, user_id] = actualParams;
      const newId = this.data.nextLogId++;
      this.data.logs.push({
        id: newId,
        description,
        user_id,
        timestamp: new Date().toISOString(),
      });
      this.saveData();
      if (actualCallback) {
        setTimeout(() => {
          actualCallback!.call({ lastID: newId }, null);
        }, 0);
      }
      return this;
    }

    // 6. DELETE FROM users WHERE id = ?
    if (lowerSql.includes("delete from users where id = ?")) {
      const id = actualParams[0];
      this.data.users = this.data.users.filter(u => u.id !== Number(id));
      this.saveData();
      if (actualCallback) setTimeout(() => actualCallback!(null), 0);
      return this;
    }

    // 7. DELETE FROM users WHERE username != 'admin'
    if (lowerSql.includes("delete from users_deprecated") || (lowerSql.includes("delete from users") && lowerSql.includes("username != 'admin'"))) {
      this.data.users = this.data.users.filter(u => u.username === "admin");
      this.saveData();
      if (actualCallback) setTimeout(() => actualCallback!(null), 0);
      return this;
    }

    // 8. UPDATE users SET password = ? WHERE id = ?
    if (lowerSql.includes("update users set password = ? where id = ?")) {
      const [password, id] = actualParams;
      const idx = this.data.users.findIndex(u => u.id === Number(id));
      if (idx !== -1) {
        this.data.users[idx].password = password;
        this.saveData();
      }
      if (actualCallback) setTimeout(() => actualCallback!(null), 0);
      return this;
    }

    // 9. DELETE FROM logs
    if (lowerSql.includes("delete from logs")) {
      this.data.logs = [];
      this.saveData();
      if (actualCallback) setTimeout(() => actualCallback!(null), 0);
      return this;
    }

    // 10. DELETE FROM packing_list WHERE id = ?
    if (lowerSql.includes("delete from packing_list where id = ?")) {
      const id = actualParams[0];
      this.data.packing_list = this.data.packing_list.filter(p => p.id !== Number(id));
      this.saveData();
      if (actualCallback) setTimeout(() => actualCallback!(null), 0);
      return this;
    }

    // 11. DELETE FROM packing_list (clean reset)
    if (lowerSql.includes("delete from packing_list")) {
      this.data.packing_list = [];
      this.saveData();
      if (actualCallback) setTimeout(() => actualCallback!(null), 0);
      return this;
    }

    // Query not matches specifically, run safely
    if (actualCallback) setTimeout(() => actualCallback!(null), 0);
    return this;
  }

  get(sql: string, params?: any[] | any, callback?: (err: Error | null, row: any) => void) {
    let actualParams: any[] = [];
    let actualCallback = callback;
    if (typeof params === "function") {
      actualCallback = params;
    } else if (Array.isArray(params)) {
      actualParams = params;
    } else if (params !== undefined) {
      actualParams = [params];
    }

    const lowerSql = sql.toLowerCase();

    // 1. SELECT * FROM users WHERE username = ?
    if (lowerSql.includes("from users where username = ?")) {
      const username = actualParams[0];
      const found = this.data.users.find(u => u.username === username);
      if (actualCallback) {
        setTimeout(() => actualCallback!(null, found || null), 0);
      }
      return this;
    }

    // 2. SELECT * FROM users WHERE id = ?
    if (lowerSql.includes("from users where id = ?")) {
      const id = actualParams[0];
      const found = this.data.users.find(u => u.id === Number(id));
      if (actualCallback) {
        setTimeout(() => actualCallback!(null, found || null), 0);
      }
      return this;
    }

    // 3. SELECT COUNT(*) as count FROM packing_list WHERE DATE(timestamp) = DATE('now')
    if (lowerSql.includes("count(*) as count from packing_list")) {
      const today = getTodayDateStr();
      const count = this.data.packing_list.filter(p => p.timestamp.substring(0, 10) === today).length;
      if (actualCallback) {
        setTimeout(() => actualCallback!(null, { count }), 0);
      }
      return this;
    }

    // 4. SELECT COUNT(*) as total FROM packing_list
    if (lowerSql.includes("count(*) as total from packing_list")) {
      const total = this.data.packing_list.length;
      if (actualCallback) {
        setTimeout(() => actualCallback!(null, { total }), 0);
      }
      return this;
    }

    // 5. SELECT COUNT(*) as today FROM packing_list WHERE DATE(timestamp) = DATE('now')
    if (lowerSql.includes("count(*) as today from packing_list")) {
      const today = getTodayDateStr();
      const count = this.data.packing_list.filter(p => p.timestamp.substring(0, 10) === today).length;
      if (actualCallback) {
        setTimeout(() => actualCallback!(null, { today: count }), 0);
      }
      return this;
    }

    if (actualCallback) {
      setTimeout(() => actualCallback!(null, null), 0);
    }
    return this;
  }

  all(sql: string, params?: any[] | any, callback?: (err: Error | null, rows: any[]) => void) {
    let actualParams: any[] = [];
    let actualCallback = callback;
    if (typeof params === "function") {
      actualCallback = params;
    } else if (Array.isArray(params)) {
      actualParams = params;
    } else if (params !== undefined) {
      actualParams = [params];
    }

    const lowerSql = sql.toLowerCase();

    // 1. SELECT id, username, role FROM users
    if (lowerSql.includes("select id, username, role from users")) {
      const list = this.data.users.map(u => ({ id: u.id, username: u.username, role: u.role }));
      if (actualCallback) {
        setTimeout(() => actualCallback!(null, list), 0);
      }
      return this;
    }

    // 2. SELECT pl.*, u.username as packer_name FROM packing_list pl ...
    if (lowerSql.includes("from packing_list")) {
      let filtered = [...this.data.packing_list];
      if (lowerSql.includes("where pl.user_id = ?")) {
        const userId = actualParams[0];
        filtered = filtered.filter(p => p.user_id === Number(userId));
      }
      
      const enriched = filtered.map(item => {
        const user = this.data.users.find(u => u.id === item.user_id);
        return {
          ...item,
          packer_name: user ? user.username : "Unknown",
        };
      });

      // Sort DESC by timestamp
      enriched.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

      if (actualCallback) {
        setTimeout(() => actualCallback!(null, enriched), 0);
      }
      return this;
    }

    // 3. SELECT l.*, u.username FROM logs l JOIN users u ON l.user_id = u.id ORDER BY l.timestamp DESC LIMIT 100
    if (lowerSql.includes("from logs")) {
      let filtered = [...this.data.logs];
      if (lowerSql.includes("where l.user_id = ?")) {
        const userId = actualParams[0];
        filtered = filtered.filter(l => l.user_id === Number(userId));
      }

      const enriched = filtered.map(item => {
        const user = this.data.users.find(u => u.id === item.user_id);
        return {
          ...item,
          username: user ? user.username : "Unknown",
        };
      });

      // Sort DESC
      enriched.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

      // Limit 100
      const limited = enriched.slice(0, 100);

      if (actualCallback) {
        setTimeout(() => actualCallback!(null, limited), 0);
      }
      return this;
    }

    // 4. SELECT DATE(timestamp) as date, COUNT(*) as count FROM packing_list WHERE timestamp > DATE('now', '-7 days') GROUP BY DATE(timestamp)
    if (lowerSql.includes("group by date(timestamp)")) {
      // Past 7 days cutoff
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);
      
      const filtered = this.data.packing_list.filter(p => {
        return new Date(p.timestamp) >= cutoffDate;
      });

      const countsByDate: { [date: string]: number } = {};
      filtered.forEach(p => {
        const dateStr = p.timestamp.substring(0, 10);
        countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
      });

      const responseList = Object.keys(countsByDate).map(date => ({
        date,
        count: countsByDate[date],
      }));

      // Sort ascending by date
      responseList.sort((a, b) => a.date.localeCompare(b.date));

      if (actualCallback) {
        setTimeout(() => actualCallback!(null, responseList), 0);
      }
      return this;
    }

    // 5. Packers Query (Dashboard statistic calculation)
    if (lowerSql.includes("coalesce(p.count, 0)") || lowerSql.includes("left join (select user_id, count(*)")) {
      const today = getTodayDateStr();

      const responseList = this.data.users.map(user => {
        const userPackings = this.data.packing_list.filter(p => p.user_id === user.id);
        const totalCount = userPackings.length;
        const todayCount = userPackings.filter(p => p.timestamp.substring(0, 10) === today).length;

        return {
          username: user.username,
          count: totalCount,
          todayCount,
        };
      });

      // Sort by count DESC, then username ASC
      responseList.sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.username.localeCompare(b.username);
      });

      if (actualCallback) {
        setTimeout(() => actualCallback!(null, responseList), 0);
      }
      return this;
    }

    if (actualCallback) {
      setTimeout(() => actualCallback!(null, []), 0);
    }
    return this;
  }
}

export default {
  Database: JSONDatabase,
};
