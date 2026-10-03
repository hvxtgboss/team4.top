import { Router } from 'express';
import { getSchools, getSchoolDetail, getCourses, getMajors } from '../controllers/schools';

const router = Router();

router.get('/', getSchools);
router.get('/courses', getCourses);
router.get('/majors', getMajors);
router.get('/:id', getSchoolDetail);

export default router;
