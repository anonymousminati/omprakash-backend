import { DataSource } from "typeorm";
import { DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME } from "./env";

export const AppDataSource = new DataSource({
    type: "mysql",
    host: DB_HOST || "localhost",
    port: parseInt(DB_PORT || "3306"),
    username: DB_USER || "root",
    password: DB_PASS || "",
    database: DB_NAME || "omprakash_db",
    synchronize: true, // Only for dev!
    logging: false,
    entities: ["src/models/*.ts"],
    subscribers: [],
    migrations: ["src/migrations/*.ts"],
});
