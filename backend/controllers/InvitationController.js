const crypto = require('crypto');
const User = require('../models/User');
const Invitation = require('../models/Invitation');
const { sendEmail } = require('../lib/emailService');


const inviteTeamMember = async (req, res) => {
  try {
    const { email } = req.body;
    
    const role = 'employee';
    
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only admins can send invitations' 
      });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }
    
    const existingInvitation = await Invitation.findOne({ 
      email, 
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });
    
    if (existingInvitation) {
      return res.status(400).json({ 
        success: false, 
        message: 'An invitation has already been sent to this email' 
      });
    }
    
    const token = crypto.randomBytes(20).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token valid for 7 days
    
    const invitation = new Invitation({
      email,
      role,
      token,
      expiresAt,
      invitedBy: req.user._id
    });
    
    await invitation.save();
    
    const inviteUrl = `${process.env.FRONTEND_URL}/register?token=${token}`;
    
    try {
      await sendEmail({
        to: email,
        subject: 'Invitation to join the team',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h1 style="color: #333;">You've been invited to join the team</h1>
            <p>You've been invited by ${req.user.name}</p>
            <p>Click the button below to create your account:</p>
            <a href="${inviteUrl}" style="display: inline-block; padding: 10px 20px; background-color: #3182ce; color: white; border-radius: 5px; text-decoration: none; margin: 15px 0;">Accept Invitation</a>
            <p style="color: #666; font-size: 0.9em;">This invitation expires in 7 days.</p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
            <p style="color: #999; font-size: 0.8em;">If you're having trouble with the button above, copy and paste this URL into your browser: <br> ${inviteUrl}</p>
          </div>
        `
      });
      
      return res.status(200).json({
        success: true,
        message: 'Invitation sent successfully'
      });
    } catch (emailError) {
      await Invitation.findByIdAndDelete(invitation._id);
      
      console.error('Error sending invitation email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send invitation email'
      });
    }
  } catch (error) {
    console.error('Error creating invitation:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating invitation'
    });
  }
};

const getPendingInvitesCount = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only admins can view pending invitations' 
      });
    }
    
    const count = await Invitation.countDocuments({ 
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });
    
    return res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error getting pending invites count:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting pending invites count'
    });
  }
};

const verifyInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    
    const invitation = await Invitation.findOne({ 
      token,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });
    
    if (!invitation) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired invitation'
      });
    }
    
    return res.status(200).json({
      success: true,
      invitation: {
        email: invitation.email,
        role: invitation.role
      }
    });
  } catch (error) {
    console.error('Error verifying invitation:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying invitation'
    });
  }
};

const processCsvInvitations = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only admins can send batch invitations' 
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No CSV file uploaded'
      });
    }
    
    const csvData = req.file.buffer.toString('utf8');
    const rows = csvData.split('\n').filter(row => row.trim());
    
    // Always skip the first row (header row)
    const results = {
      total: rows.length - 1,
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };
    
    const role = 'employee';
    
    // Start from row 2 (index 1)
    for (let i = 1; i < rows.length; i++) {
      const columns = rows[i].split(',').map(col => col.trim());
      
      // Email should be in second column (index 1)
      if (columns.length < 2) {
        results.failed++;
        results.errors.push(`Row ${i+1}: Invalid format - missing email column`);
        continue;
      }
      
      const email = columns[1];
      
      // Basic email validation
      if (!email || !email.includes('@')) {
        results.failed++;
        results.errors.push(`Row ${i+1}: Invalid email format - ${email}`);
        continue;
      }
      
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          results.skipped++;
          results.errors.push(`Row ${i+1}: User already exists - ${email}`);
          continue;
        }
        
        // Check if invitation already exists
        const existingInvitation = await Invitation.findOne({ 
          email, 
          status: 'pending',
          expiresAt: { $gt: new Date() }
        });
        
        if (existingInvitation) {
          results.skipped++;
          results.errors.push(`Row ${i+1}: Invitation already sent - ${email}`);
          continue;
        }
        
        const token = crypto.randomBytes(20).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Token valid for 7 days
        
        const invitation = new Invitation({
          email,
          role,
          token,
          expiresAt,
          invitedBy: req.user._id
        });
        
        await invitation.save();
        
        const inviteUrl = `${process.env.FRONTEND_URL}/register?token=${token}`;
        
        await sendEmail({
          to: email,
          subject: 'Invitation to join the team',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <h1 style="color: #333;">You've been invited to join the team</h1>
              <p>You've been invited by ${req.user.name}</p>
              <p>Click the button below to create your account:</p>
              <a href="${inviteUrl}" style="display: inline-block; padding: 10px 20px; background-color: #3182ce; color: white; border-radius: 5px; text-decoration: none; margin: 15px 0;">Accept Invitation</a>
              <p style="color: #666; font-size: 0.9em;">This invitation expires in 7 days.</p>
              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
              <p style="color: #999; font-size: 0.8em;">If you're having trouble with the button above, copy and paste this URL into your browser: <br> ${inviteUrl}</p>
            </div>
          `
        });
        
        results.sent++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Row ${i+1}: ${error.message} - ${email}`);
        console.error(`Error processing invitation for ${email}:`, error);
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'CSV invitation processing completed',
      results
    });
  } catch (error) {
    console.error('Error processing CSV invitations:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing CSV invitations'
    });
  }
};

module.exports = {
  inviteTeamMember,
  getPendingInvitesCount,
  verifyInvitation,
  processCsvInvitations
};


