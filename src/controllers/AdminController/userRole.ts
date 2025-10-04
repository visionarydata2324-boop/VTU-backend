import { Request, Response } from 'express';
import User from '../../models/users'; // Adjust the path based on your project structure
import { AppError } from '../../utils/HandleErrors';

class UserRoleController {
    // Method to change user role
    public async changeUserRole(req: Request, res: Response): Promise<void> {
        try {
            const { userId, newRole } = req.body;

            // Validate input
            if (!userId || !newRole) {
                throw  new AppError('User ID and new role are required.', 400);
            }
            if (newRole !== 'admin' && newRole !== 'user') {
                throw new AppError('Invalid role. Role must be either "admin" or "user".', 400);
            }

            // Find the user by ID
            const user = await User.findById(userId);
            if (!user) {
               throw new AppError('User not found.', 404);
            }
            if (user.role === newRole) {
                throw new AppError(`User's role already set to ${user.role}`, 400);
            }

            // Update the user's role
            user.role = newRole;
            await user.save();

            res.status(200).json({ message: 'User role updated successfully.', user });
        } catch (error: AppError | any) {
            console.error('Error updating user role:', error);
            res.status(error.statusCode).json({ message: error.message });
        }
    }

    public async getAllUsers(req: Request, res: Response): Promise<void> {
        try {
            const users = await User.find().select('-password'); // Exclude password field
            res.status(200).json({ users });
        } catch (error: AppError | any) {
            console.error('Error fetching users:', error);
            res.status(error.statusCode || 500).json({ message: error.message });
        }
}
}


export const newUserRoleController = new UserRoleController();

