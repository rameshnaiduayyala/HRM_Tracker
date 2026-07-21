import { Router } from 'express';
import { tasksController } from './tasks.controller';
import { authenticate } from '../authentication/auth.middleware';
import { companyGuard } from '../../shared/middlewares/companyGuard';

const router = Router();

router.use(authenticate);
router.use(companyGuard);

// Projects
router.get('/projects', tasksController.listProjects);
router.post('/projects', tasksController.createProject);
router.get('/projects/:id', tasksController.getProject);
router.put('/projects/:id', tasksController.updateProject);
router.delete('/projects/:id', tasksController.deleteProject);

// Project Members
router.post('/projects/:id/members', tasksController.addProjectMember);
router.delete('/projects/:id/members/:employeeId', tasksController.removeProjectMember);

// Project Milestones
router.post('/projects/:id/milestones', tasksController.createMilestone);
router.put('/milestones/:milestoneId', tasksController.toggleMilestone);

// Tasks
router.get('/', tasksController.listTasks);
router.post('/', tasksController.createTask);
router.get('/:id', tasksController.getTask);
router.put('/:id', tasksController.updateTask);
router.delete('/:id', tasksController.deleteTask);

// Task Comments
router.post('/:id/comments', tasksController.addTaskComment);

// Task Time Logs
router.post('/:id/time-logs', tasksController.addTaskTimeLog);

export default router;
