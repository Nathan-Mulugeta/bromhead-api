const express = require('express');
const router = express.Router();
const projectsController = require('../controllers/projectController');
const verifyJWT = require('../middleware/verifyJWT');
const checkRole = require('../middleware/checkRole');

router.use(verifyJWT);

router
  .route('/')
  .get(projectsController.getAllProjects)
  .post(checkRole, projectsController.createNewProject)
  .patch(projectsController.updateProject)
  .delete(checkRole, projectsController.deleteProject);

module.exports = router;
