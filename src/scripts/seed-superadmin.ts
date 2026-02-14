import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

const seedSuperadmin = async () => {
    try {
        await AppDataSource.initialize();
        console.log('Database initialized');

        const userRepository = AppDataSource.getRepository(User);

        const existingSuperadmin = await userRepository.findOne({ where: { email: 'superadmin@omprakash.com' } });

        if (existingSuperadmin) {
            console.log('Superadmin already exists');
        } else {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash('admin123', salt);

            const superadmin = userRepository.create({
                name: 'Super Admin',
                email: 'superadmin@omprakash.com',
                password_hash,
                role: 'superadmin',
                is_active: true
            });

            await userRepository.save(superadmin);
            console.log('Superadmin created successfully');
        }

        await AppDataSource.destroy();
    } catch (error) {
        console.error('Error seeding superadmin:', error);
        process.exit(1);
    }
};

seedSuperadmin();
