import '../config/env'; // load dotenv before anything else
import { SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD } from '../config/env';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

if (!SUPERADMIN_EMAIL || !SUPERADMIN_PASSWORD) {
    console.error('Missing env vars: SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD are required.');
    process.exit(1);
}

// After the guard above, both are guaranteed to be strings
const email = SUPERADMIN_EMAIL as string;
const password = SUPERADMIN_PASSWORD as string;

const seedSuperadmin = async () => {
    try {
        await AppDataSource.initialize();
        console.log('Database initialized');

        const userRepository = AppDataSource.getRepository(User);

        const existingSuperadmin = await userRepository.findOne({ where: { email } });

        if (existingSuperadmin) {
            console.log('Superadmin already exists');
        } else {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);

            const superadmin = userRepository.create({
                name: 'Super Admin',
                email,
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
