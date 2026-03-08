import { AppDataSource } from "../config/database";

async function fixMigrations() {
    await AppDataSource.initialize();
    try {
        console.log("Inserting completed migration records...");

        // Define the missing migrations that we know are already applied to the DB
        const missingMigrations = [
            { id: 2, timestamp: 1771053853039, name: 'RBACSetup1771053853039' },
            { id: 3, timestamp: 1771070000000, name: 'CreateInnovationsTable1771070000000' },
            { id: 4, timestamp: 1772533842595, name: 'BunnyNetSetup1772533842595' },
            { id: 5, timestamp: 1772601000001, name: 'AddComplaintContactModulesRBAC1772601000001' }
        ];

        for (const migration of missingMigrations) {
            // Check if it already exists to be safe
            const existing = await AppDataSource.query(`SELECT * FROM migrations WHERE timestamp = ?`, [migration.timestamp]);
            if (existing.length === 0) {
                await AppDataSource.query(`INSERT INTO migrations (id, timestamp, name) VALUES (?, ?, ?)`, [migration.id, migration.timestamp, migration.name]);
                console.log(`Inserted ${migration.name}`);
            } else {
                console.log(`${migration.name} already exists.`);
            }
        }

        console.log("Migration tracker fixed. TypeORM should now correctly only run the AddGalleryModels migration.");
    } catch (e) {
        console.error("Error fixing migrations:", e);
    }
    await AppDataSource.destroy();
}
fixMigrations();
