import { AppDataSource } from "../config/database";

async function run() {
    await AppDataSource.initialize();
    try {
        await AppDataSource.query("ALTER TABLE `permissions` DROP FOREIGN KEY `FK_f10931e7bb05a3b434642ed2797`");
        console.log("FK dropped");
    } catch(e) {
        console.log("Error dropping FK:", e.message);
    }
    await AppDataSource.destroy();
}
run();
