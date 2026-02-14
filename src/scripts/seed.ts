import { AppDataSource } from '../config/database';
import { User } from '../models/User';

const seed = async () => {
    try {
        await AppDataSource.initialize();
        console.log('Database connected for seeding...');

        const userRepository = AppDataSource.getRepository(User);

        const superAdminEmail = 'superadmin@example.com';
        const existingAdmin = await userRepository.findOne({
            where: { email: superAdminEmail },
        });

        if (!existingAdmin) {
            console.log('Creating Super Admin user...');
            const superAdmin = new User();
            superAdmin.name = 'Super Admin';
            superAdmin.email = superAdminEmail;
            superAdmin.password_hash = 'supersecret'; // In production, hash this!
            superAdmin.role = 'superadmin';
            superAdmin.is_active = true;
            superAdmin.created_by = 'system';
            superAdmin.updated_by = 'system';

            await userRepository.save(superAdmin);
            console.log('Super Admin created successfully.');
        } else {
            console.log('Super Admin already exists. Skipping...');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seed();
