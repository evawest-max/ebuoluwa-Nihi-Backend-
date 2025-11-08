import dotenv from 'dotenv';
dotenv.config();
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Store this in your .env file

export const sendEmail = async ({ to, cc, bcc, subject, html }) => {
  console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY);
  console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL);

  const msg = {
    to,
    from: process.env.ADMIN_EMAIL, // Must be a verified sender in SendGrid
    subject,
    html,
    ...(cc && { cc }),
    ...(bcc && { bcc }),
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Email sent to: ${to}${cc ? ` | CC: ${cc}` : ''}${bcc ? ` | BCC: ${bcc}` : ''}`);
  } catch (error) {
    console.error('❌ Error sending email:', {
      message: error.message,
      code: error.code,
      response: error.response?.body?.errors || 'No response body',
    });

    // Optional fallback alert to admin
    try {
      await sgMail.send({
        to: process.env.ADMIN_EMAIL,
        from: process.env.ADMIN_EMAIL,
        subject: '⚠️ Email Delivery Failure Alert',
        html: `
          <h3>Email Delivery Failure</h3>
          <p><strong>To:</strong> ${to}</p>
          ${cc ? `<p><strong>CC:</strong> ${cc}</p>` : ''}
          ${bcc ? `<p><strong>BCC:</strong> ${bcc}</p>` : ''}
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Error:</strong> ${error.message}</p>
          <p><strong>Details:</strong></p>
          <pre>${JSON.stringify(error.response?.body?.errors || {}, null, 2)}</pre>
        `,
      });
      console.log('📬 Admin notified of email failure.');
    } catch (fallbackErr) {
      console.error('❌ Failed to notify admin:', fallbackErr.message);
    }

    throw new Error('Email delivery failed');
  }
};


// import dotenv from 'dotenv';
// dotenv.config();
// import sgMail from '@sendgrid/mail';

// sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Store this in your .env file

// export const sendEmail = async ({ to, cc,  subject, html }) => {
//     console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY);
//   console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL);
//   const msg = {
//     to,
//     cc,
//     bcc,
//     from: process.env.ADMIN_EMAIL, // Must be a verified sender in SendGrid
//     subject,
//     html,
//   };

//   try {
//     await sgMail.send(msg);
//     console.log('✅ Email sent to', to);
//   } catch (error) {
//   console.error('❌ Error sending email:', {
//     message: error.message,
//     code: error.code,
//     response: error.response?.body,
//   });
//   throw new Error('Email delivery failed');
// }
// };
