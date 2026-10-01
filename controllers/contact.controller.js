const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'Elgynasio@gmail.com',
      pass: process.env.EMAIL_PASSWORD // App password from Gmail
    }
  });
};

// @desc    Send contact form message to owner's email
// @route   POST /api/contact
// @access  Public
const sendContactMessage = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and message'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    const transporter = createTransporter();

    // Email options for owner
    const ownerMailOptions = {
      from: `"EL GYMNASIO Contact Form" <${process.env.EMAIL_USER || 'Elgynasio@gmail.com'}>`,
      to: process.env.OWNER_EMAIL || 'Elgynasio@gmail.com',
      subject: `🏋️ New Contact Form Message from ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
            .header { background: linear-gradient(135deg, #ff6b35, #ff8a65); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #ff6b35; }
            .value { margin-top: 5px; padding: 10px; background: #f5f5f5; border-radius: 5px; }
            .message-box { background: #fff3e0; padding: 15px; border-left: 4px solid #ff6b35; border-radius: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏋️ EL GYMNASIO</h1>
              <p>New Contact Form Submission</p>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">👤 Name:</div>
                <div class="value">${name}</div>
              </div>
              <div class="field">
                <div class="label">📧 Email:</div>
                <div class="value"><a href="mailto:${email}">${email}</a></div>
              </div>
              <div class="field">
                <div class="label">📱 Phone:</div>
                <div class="value">${phone || 'Not provided'}</div>
              </div>
              <div class="field">
                <div class="label">💬 Message:</div>
                <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
              </div>
            </div>
            <div class="footer">
              <p>This message was sent from the EL GYMNASIO website contact form.</p>
              <p>© ${new Date().getFullYear()} EL GYMNASIO - Owner: Malik Muhammad Azlan</p>
            </div>
          </div>
        </body>
        </html>
      `,
      replyTo: email
    };

    // Confirmation email for the sender
    const senderMailOptions = {
      from: `"EL GYMNASIO" <${process.env.EMAIL_USER || 'Elgynasio@gmail.com'}>`,
      to: email,
      subject: '✅ Thank you for contacting EL GYMNASIO!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
            .header { background: linear-gradient(135deg, #ff6b35, #ff8a65); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
            .highlight { color: #ff6b35; font-weight: bold; }
            .contact-info { background: #fff3e0; padding: 20px; border-radius: 10px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏋️ EL GYMNASIO</h1>
              <p>Thank You for Reaching Out!</p>
            </div>
            <div class="content">
              <p>Dear <span class="highlight">${name}</span>,</p>
              <p>Thank you for contacting EL GYMNASIO! We have received your message and will get back to you as soon as possible.</p>
              <p>We typically respond within 24-48 hours during business days.</p>
              
              <div class="contact-info">
                <h3>📞 Need Immediate Assistance?</h3>
                <p><strong>Phone:</strong> +92 324 0145654</p>
                <p><strong>Email:</strong> Elgynasio@gmail.com</p>
                <p><strong>Location:</strong> Kahna Nau, Lahore, Pakistan</p>
                <p><strong>Owner:</strong> Malik Muhammad Azlan</p>
              </div>
              
              <p style="margin-top: 20px;">We look forward to helping you achieve your fitness goals!</p>
              <p>Best regards,<br><span class="highlight">The EL GYMNASIO Team</span></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} EL GYMNASIO - Your Fitness Journey Starts Here</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // Send email to owner
    await transporter.sendMail(ownerMailOptions);
    
    // Send confirmation email to sender
    await transporter.sendMail(senderMailOptions);

    res.status(200).json({
      success: true,
      message: 'Message sent successfully! We will get back to you soon.'
    });

  } catch (error) {
    console.error('Error sending contact email:', error);
    
    // Check for specific email errors
    if (error.code === 'EAUTH') {
      return res.status(500).json({
        success: false,
        message: 'Email authentication failed. Please contact us directly at +92 324 0145654'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again or contact us directly at +92 324 0145654'
    });
  }
};

module.exports = {
  sendContactMessage
};
