import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

// Ensure environment variables are loaded
dotenv.config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.currentProvider = null;
    this.initializeSync();
  }

  initializeSync() {
    try {
      const emailProvider = process.env.EMAIL_PROVIDER || 'auto';
      
      console.log('🔧 Email Provider Setting:', emailProvider);
      console.log('📧 Available Configurations:');
      console.log('   SendGrid:', process.env.SENDGRID_API_KEY ? 'Available ✓' : 'Not configured');
      console.log('   Gmail:', (process.env.EMAIL_SERVICE === 'gmail' && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) ? 'Available ✓' : 'Not configured');
      
      // Gmail configuration (priority when EMAIL_PROVIDER=gmail or EMAIL_SERVICE=gmail)
      if ((emailProvider === 'gmail' || process.env.EMAIL_SERVICE === 'gmail') && 
          process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        this.transporter = nodemailer.createTransporter({
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
      // SendGrid configuration
      else if ((emailProvider === 'sendgrid' || emailProvider === 'auto') && process.env.SENDGRID_API_KEY) {
        this.transporter = nodemailer.createTransporter({
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
      // Fallback: Gmail if available
      else if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        this.transporter = nodemailer.createTransporter({
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
      // Development mode
      else {
        console.warn('⚠️  Email service not configured. Emails will be logged to console.');
        this.transporter = nodemailer.createTransporter({
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
      
      console.log('🚀 SENDING NEW TEMPLATE EMAIL:');
      console.log('   Provider:', this.currentProvider);
      console.log('   From:', fromEmail);
      console.log('   To:', to);
      console.log('   Logo Path:', logoPath);
      console.log('   Logo Exists:', fs.existsSync(logoPath));
      console.log('   Template Version: NEW FIXED VERSION');
      
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
        html: this.getNewInvitationTemplate({ inviterName, chatTitle, invitationLink, role }),
        text: `${inviterName} invited you to collaborate on "${chatTitle}". Click here to join: ${invitationLink}`,
        attachments: [{
          filename: 'citrus-logo.png',
          path: logoPath,
          cid: 'citruslab-logo'
        }]
      };

      console.log(`📤 Attempting to send NEW TEMPLATE email via ${this.currentProvider}...`);
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ NEW TEMPLATE email sent successfully!');
      console.log('   Message ID:', info.messageId);
      
      return { 
        success: true, 
        messageId: info.messageId, 
        response: info.response,
        templateVersion: 'NEW_FIXED'
      };
    } catch (error) {
      console.error('❌ NEW TEMPLATE email sending failed:', error.message);
      return { 
        success: false, 
        error: error.message,
        templateVersion: 'NEW_FIXED'
      };
    }
  }

  getNewInvitationTemplate({ inviterName, chatTitle, invitationLink, role }) {
    console.log('🎨 Generating NEW TEMPLATE (no lemon emoji, with SVG icons)');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CitrusLab Invitation</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #f8f9fa;
          }
          .email-container {
            background: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            border: 1px solid #e9ecef;
          }
          .logo-header {
            text-align: center;
            margin-bottom: 32px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f1f3f4;
          }
          .logo-header img {
            height: 50px;
            width: auto;
            display: block;
            margin: 0 auto 16px auto;
          }
          .main-title {
            color: #1a202c;
            font-size: 26px;
            font-weight: 700;
            margin-bottom: 24px;
            text-align: center;
          }
          .invitation-box {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border: 2px solid #dee2e6;
            border-radius: 12px;
            padding: 28px;
            margin: 28px 0;
            text-align: center;
          }
          .invitation-box p {
            margin: 8px 0;
            font-size: 17px;
            color: #495057;
          }
          .project-name {
            font-size: 20px;
            font-weight: 800;
            color: #1a202c;
            margin: 16px 0;
            padding: 8px 16px;
            background: #ffffff;
            border-radius: 8px;
            border: 1px solid #c9d900;
          }
          .cta-button {
            display: inline-block;
            padding: 16px 40px;
            background: linear-gradient(135deg, #c9d900 0%, #b8c700 100%);
            color: #1a202c;
            text-decoration: none;
            border-radius: 10px;
            font-weight: 700;
            font-size: 18px;
            margin: 28px 0;
            text-align: center;
            box-shadow: 0 4px 15px rgba(201, 217, 0, 0.3);
            transition: all 0.3s ease;
          }
          .cta-button:hover {
            background: linear-gradient(135deg, #b8c700 0%, #a6b500 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(201, 217, 0, 0.4);
          }
          .features-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 32px 0;
          }
          .feature-card {
            background: #ffffff;
            border: 1px solid #e9ecef;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            transition: all 0.2s ease;
          }
          .feature-card:hover {
            border-color: #c9d900;
            box-shadow: 0 2px 8px rgba(201, 217, 0, 0.1);
          }
          .feature-icon {
            width: 24px;
            height: 24px;
            margin: 0 auto 12px auto;
            display: block;
          }
          .feature-text {
            font-size: 14px;
            color: #495057;
            font-weight: 600;
          }
          .role-tag {
            display: inline-block;
            padding: 6px 16px;
            background: linear-gradient(135deg, #c9d900 0%, #b8c700 100%);
            color: #1a202c;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            border: 2px solid #a6b500;
          }
          .link-box {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 28px 0;
            border-left: 4px solid #c9d900;
          }
          .link-box p {
            margin: 0 0 12px 0;
            color: #6c757d;
            font-size: 14px;
            font-weight: 500;
          }
          .link-url {
            background: #ffffff;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            padding: 12px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 12px;
            word-break: break-all;
            color: #495057;
          }
          .email-footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 24px;
            border-top: 2px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
          }
          .divider-line {
            height: 2px;
            background: linear-gradient(90deg, transparent 0%, #c9d900 50%, transparent 100%);
            margin: 32px 0;
            border-radius: 1px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="logo-header">
            <img src="cid:citruslab-logo" alt="CitrusLab" />
          </div>
          
          <h1 class="main-title">🎉 You're Invited to Collaborate!</h1>
          
          <div class="invitation-box">
            <p><strong>${inviterName}</strong> has invited you to join</p>
            <div class="project-name">"${chatTitle}"</div>
            <p>as a <span class="role-tag">${role}</span></p>
          </div>
          
          <div class="features-grid">
            <div class="feature-card">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="#c9d900" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                ${role === 'editor' ? 
                  '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>' :
                  '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>'
                }
              </svg>
              <div class="feature-text">${role === 'editor' ? 'Edit & Contribute' : 'View & Comment'}</div>
            </div>
            
            <div class="feature-card">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="#c9d900" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <div class="feature-text">Real-time Collaboration</div>
            </div>
            
            <div class="feature-card">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="#c9d900" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="3" fill="#c9d900"></circle>
              </svg>
              <div class="feature-text">Live Presence</div>
            </div>
            
            <div class="feature-card">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="#c9d900" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
              </svg>
              <div class="feature-text">Instant Updates</div>
            </div>
          </div>
          
          <div class="divider-line"></div>
          
          <div style="text-align: center;">
            <a href="${invitationLink}" class="cta-button">
              <svg style="width: 18px; height: 18px; margin-right: 10px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14"></path>
                <path d="M12 5l7 7-7 7"></path>
              </svg>
              Accept Invitation & Join
            </a>
          </div>
          
          <div class="link-box">
            <p>
              <svg style="width: 16px; height: 16px; margin-right: 8px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="#c9d900" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              Or copy and paste this link:
            </p>
            <div class="link-url">${invitationLink}</div>
          </div>
          
          <div class="email-footer">
            <p>
              <svg style="width: 16px; height: 16px; margin-right: 8px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="#c9d900" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              Sent by <strong>${inviterName}</strong> via CitrusLab
            </p>
            <p style="margin-top: 12px; font-size: 12px; color: #868e96;">
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export default new EmailService();
