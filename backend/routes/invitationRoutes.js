const express = require('express');
const router = express.Router();
const multer = require('multer');
const { inviteTeamMember, getPendingInvitesCount, verifyInvitation, processCsvInvitations } = require('../controllers/InvitationController');
const { protectRoute } = require('../middleware/authMiddleware');

// Setup multer for file upload (CSV)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 // Limit to 1MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

router.post('/invite', protectRoute, inviteTeamMember);
router.post('/invite-csv', protectRoute, upload.single('csvFile'), processCsvInvitations);
router.get('/pending-invites/count', protectRoute, getPendingInvitesCount);
router.get('/verify-invitation/:token', verifyInvitation);

module.exports = router; 