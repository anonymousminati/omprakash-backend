import { Request, Response } from 'express';
import { AppDataSource } from '../../../config/database';
import { User } from '../../../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export class AuthController {
    private userRepository = AppDataSource.getRepository(User);

    login = async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;

            const user = await this.userRepository.createQueryBuilder("user")
                .addSelect("user.password_hash")
                .where("user.email = :email", { email })
                .getOne();

            if (!user) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            const isMatch = await bcrypt.compare(password, user.password_hash);

            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            if (!user.is_active) {
                return res.status(403).json({ success: false, message: 'Account is inactive' });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Remove password from response
            const { password_hash, ...userWithoutPassword } = user;

            return res.status(200).json({
                success: true,
                token,
                user: userWithoutPassword
            });
        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
}
