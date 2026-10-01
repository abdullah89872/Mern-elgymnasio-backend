const express = require('express');
const router = express.Router();
const {
  addMember,
  getAllMembers,
  getMemberById,
  deleteMember,
  addTrainer,
  addNutritionist,
  getAllTrainers,
  getAllNutritionists,
  assignTrainerToMember,
  assignNutritionistToMember,
  getDashboardStats,
  deleteTrainer,
  deleteNutritionist
} = require('../controllers/admin.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { validateMemberData } = require('../middleware/validation.middleware');

router.use(protect);
router.use(adminOnly);

router.route('/members')
  .get(getAllMembers)
  .post(validateMemberData, addMember);

router.get('/members/:id', getMemberById);
router.delete('/members/:memberId', deleteMember);
router.put('/members/:memberId/assign-trainer', assignTrainerToMember);
router.put('/members/:memberId/assign-nutritionist', assignNutritionistToMember);

router.route('/trainers')
  .get(getAllTrainers)
  .post(addTrainer);

router.delete('/trainers/:trainerId', deleteTrainer);

router.route('/nutritionists')
  .get(getAllNutritionists)
  .post(addNutritionist);

router.delete('/nutritionists/:nutritionistId', deleteNutritionist);

router.get('/dashboard', getDashboardStats);

module.exports = router;