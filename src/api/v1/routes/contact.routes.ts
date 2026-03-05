import express from 'express';
import { createContact, getContacts, getContactById, deleteContact, markAsRead } from '../controllers/contact.controller';
import { authenticate, authorize } from '../../../middleware/auth';

const router = express.Router();

// Public route for form submission
router.post('/', createContact);

// Protected routes for backpanel
router.get('/', authenticate, authorize('contacts', 'read'), getContacts);
router.get('/:id', authenticate, authorize('contacts', 'read'), getContactById);
router.patch('/:id/read', authenticate, authorize('contacts', 'update'), markAsRead);
router.delete('/:id', authenticate, authorize('contacts', 'delete'), deleteContact);

export default router;
