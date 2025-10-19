import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Ensure environment variables are loaded
dotenv.config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.initializeSync();
  }

  initializeSync() {
    try {
      const emailProvider = process.env.EMAIL_PROVIDER || 'auto';
      
      console.log('🔧 Email Provider Setting:', emailProvider);
      console.log('📧 Available Configurations:');
      console.log('   SendGrid:', process.env.SENDGRID_API_KEY ? 'Available ✓' : 'Not configured');
      console.log('   Gmail:', (process.env.EMAIL_SERVICE === 'gmail' && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) ? 'Available ✓' : 'Not configured');
      
      // Debug Gmail detection
      console.log('🔍 Gmail Debug:');
      console.log('   EMAIL_SERVICE:', JSON.stringify(process.env.EMAIL_SERVICE));
      console.log('   EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'NOT SET');
      console.log('   EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET');
      console.log('   Gmail condition result:', (process.env.EMAIL_SERVICE === 'gmail' && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD));
      
      // Gmail configuration (priority when EMAIL_PROVIDER=gmail or EMAIL_SERVICE=gmail)
      if ((emailProvider === 'gmail' || process.env.EMAIL_SERVICE === 'gmail') && 
          process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });
        console.log('✅ Email service initialized with Gmail');
        this.currentProvider = 'gmail';
        this.initialized = true;
      }
      // SendGrid configuration (priority when EMAIL_PROVIDER=sendgrid or auto with SendGrid available)
      else if ((emailProvider === 'sendgrid' || emailProvider === 'auto') && process.env.SENDGRID_API_KEY) {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
          }
        });
        console.log('✅ Email service initialized with SendGrid');
        this.currentProvider = 'sendgrid';
        this.initialized = true;
      }
      // Fallback: Gmail if available and SendGrid failed
      else if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });
        console.log('✅ Email service initialized with Gmail (fallback)');
        this.currentProvider = 'gmail';
        this.initialized = true;
      }
      // Development mode (logs to console)
      else {
        console.warn('⚠️  Email service not configured. Emails will be logged to console.');
        console.warn('   Set EMAIL_PROVIDER=gmail or EMAIL_PROVIDER=sendgrid in .env');
        console.warn('   Gmail: Set EMAIL_SERVICE=gmail, EMAIL_USER, EMAIL_PASSWORD');
        console.warn('   SendGrid: Set SENDGRID_API_KEY, SENDGRID_FROM_EMAIL');
        this.transporter = nodemailer.createTransport({
          streamTransport: true,
          newline: 'unix',
          buffer: true
        });
        this.currentProvider = 'console';
        this.initialized = true;
      }
    } catch (error) {
      console.error('❌ Email service initialization error:', error);
      this.initialized = false;
    }
  }

  async verifyConnection() {
    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
    }
    
    try {
      console.log(`🔍 Verifying ${this.currentProvider} connection...`);
      
      if (this.currentProvider === 'gmail' || this.currentProvider === 'sendgrid') {
        await this.transporter.verify();
        console.log(`✅ ${this.currentProvider} connection verified successfully`);
        return true;
      } else {
        console.log('ℹ️  Email verification skipped (console mode)');
        return true;
      }
    } catch (error) {
      console.error(`❌ ${this.currentProvider} connection verification failed:`, error.message);
      throw error;
    }
  }

  async sendInvitationEmail({ to, inviterName, chatTitle, invitationLink, role }) {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const fromEmail = this.currentProvider === 'gmail' ? 
        process.env.EMAIL_USER : 
        (process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER || 'noreply@citruslab.dev');
      
      const logoPath = path.resolve(process.cwd(), '..', 'react', 'src', 'assets', 'citrus-logo.png');
      console.log('📧 Sending invitation email:');
      console.log('   Provider:', this.currentProvider);
      console.log('   From:', fromEmail);
      console.log('   To:', to);
      console.log('   Subject:', `${inviterName} invited you to collaborate on "${chatTitle}"`);
      console.log('   Invitation Link:', invitationLink);
      console.log('   Logo Path:', logoPath);
      console.log('   Logo Exists:', fs.existsSync(logoPath));
      
      // Validate email address
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(to)) {
        throw new Error(`Invalid email address: ${to}`);
      }
      
      const mailOptions = {
        from: {
          name: 'CitrusLab',
          address: fromEmail
        },
        to: to,
        subject: `${inviterName} invited you to collaborate on "${chatTitle}"`,
        html: this.getInvitationTemplate({ inviterName, chatTitle, invitationLink, role }),
        text: `${inviterName} invited you to collaborate on "${chatTitle}". Click here to join: ${invitationLink}`,
        attachments: [{
          filename: 'citrus-logo.png',
          path: logoPath,
          cid: 'citruslab-logo'
        }]
      };

      console.log(`📤 Attempting to send email via ${this.currentProvider}...`);
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Invitation email sent successfully!');
      console.log('   To:', to);
      console.log('   Message ID:', info.messageId);
      console.log('   Response:', info.response);
      console.log('   Accepted:', info.accepted);
      console.log('   Rejected:', info.rejected);
      
      return { 
        success: true, 
        messageId: info.messageId, 
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected
      };
    } catch (error) {
      console.error('❌ Email sending failed:');
      console.error('   Error code:', error.code);
      console.error('   Error message:', error.message);
      console.error('   Error response:', error.response);
      console.error('   Error responseCode:', error.responseCode);
      console.error('   Full error:', error);
      
      // Provide more specific error messages
      let userFriendlyMessage = error.message;
      if (error.code === 'EAUTH') {
        userFriendlyMessage = 'Email authentication failed. Please check your SendGrid API key.';
      } else if (error.code === 'ECONNECTION') {
        userFriendlyMessage = 'Failed to connect to email server. Please check your internet connection.';
      } else if (error.responseCode === 401) {
        userFriendlyMessage = 'Invalid SendGrid API key. Please verify your credentials.';
      } else if (error.responseCode === 403) {
        userFriendlyMessage = 'SendGrid account access denied. Please check your account status.';
      }
      
      return { 
        success: false, 
        error: userFriendlyMessage, 
        code: error.code,
        responseCode: error.responseCode,
        originalError: error.message
      };
    }
  }

  getInvitationTemplate({ inviterName, chatTitle, invitationLink, role }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #f8f9fa;
          }
          .container {
            background: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.06);
            border: 1px solid #e9ecef;
          }
          .header {
            text-align: center;
            margin-bottom: 32px;
            padding-bottom: 20px;
            border-bottom: 1px solid #f1f3f4;
          }
          .header img {
            height: 48px;
            width: auto;
            margin-bottom: 12px;
            display: block;
            margin-left: auto;
            margin-right: auto;
          }
          .content {
            margin: 24px 0;
          }
          .content h2 {
            color: #1a202c;
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 20px;
            text-align: center;
          }
          .invitation-card {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
            text-align: center;
          }
          .invitation-card p {
            margin: 6px 0;
            font-size: 16px;
            color: #495057;
          }
          .chat-title {
            font-size: 18px;
            font-weight: 700;
            color: #1a202c;
            margin: 12px 0;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: #c9d900;
            color: #1a202c;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 24px 0;
            text-align: center;
            transition: background-color 0.2s ease;
          }
          .button:hover {
            background: #b8c700;
          }
          .features-list {
            margin: 24px 0;
            padding: 0;
            list-style: none;
          }
          .features-list li {
            padding: 12px 0;
            color: #495057;
            font-size: 15px;
            display: flex;
            align-items: center;
          }
          .icon-svg {
            width: 20px;
            height: 20px;
            margin-right: 12px;
            flex-shrink: 0;
          }
          .link-section {
            background: #f8f9fa;
            border-radius: 6px;
            padding: 16px;
            margin: 24px 0;
            border-left: 3px solid #c9d900;
          }
          .link-section p {
            margin: 0 0 8px 0;
            color: #6c757d;
            font-size: 14px;
          }
          .link-code {
            background: #ffffff;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 10px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 12px;
            word-break: break-all;
            color: #495057;
          }
          .footer {
            text-align: center;
            margin-top: 32px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
          }
          .role-badge {
            display: inline-block;
            padding: 4px 12px;
            background: #c9d900;
            color: #1a202c;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .divider {
            height: 1px;
            background: #e9ecef;
            margin: 24px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="cid:citruslab-logo" alt="CitrusLab" />
          </div>
          
          <div class="content">
            <h2>You've been invited to collaborate</h2>
            
            <div class="invitation-card">
              <p><strong>${inviterName}</strong> has invited you to collaborate on</p>
              <div class="chat-title">"${chatTitle}"</div>
              <p>as a <span class="role-badge">${role}</span></p>
            </div>
            
            <ul class="features-list">
              <li>
                <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="#c9d900" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  ${role === 'editor' ? 
                    '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>' :
                    '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>'
                  }
                </svg>
                ${role === 'editor' ? 'Edit and contribute to the chat' : 'View the chat and add comments'}
              </li>
              <li>
                <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="#c9d900" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                Collaborate in real-time
              </li>
              <li>
                <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="#c9d900" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="3" fill="#c9d900"></circle>
                </svg>
                See who's online
              </li>
              <li>
                <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="#c9d900" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                </svg>
                Get instant updates
              </li>
            </ul>
            
            <div class="divider"></div>
            
            <div style="text-align: center;">
              <a href="${invitationLink}" class="button">
                <svg style="width: 16px; height: 16px; margin-right: 8px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="M12 5l7 7-7 7"></path>
                </svg>
                Accept Invitation & Join
              </a>
            </div>
            
            <div class="link-section">
              <p>
                <svg style="width: 14px; height: 14px; margin-right: 6px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="#c9d900" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                Or copy and paste this link into your browser:
              </p>
              <div class="link-code">${invitationLink}</div>
            </div>
          </div>
          
          <div class="footer">
            <p>
              <svg style="width: 14px; height: 14px; margin-right: 6px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="#c9d900" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              This invitation was sent by <strong>${inviterName}</strong> via CitrusLab
            </p>
            <p style="margin-top: 8px; font-size: 12px;">
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendWelcomeEmail({ to, name }) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || process.env.SENDGRID_FROM_EMAIL || 'noreply@citruslab.dev',
        to: to,
        subject: 'Welcome to CitrusLab! 🍋',
        html: `
          <h2>Welcome ${name}!</h2>
          <p>Thank you for joining CitrusLab. Start collaborating with your team today!</p>
        `
      };

      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Welcome email error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendNotificationEmail({ to, subject, message }) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || process.env.SENDGRID_FROM_EMAIL || 'noreply@citruslab.dev',
        to: to,
        subject: subject,
        html: `<p>${message}</p>`
      };

      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Notification email error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new EmailService();
