import { generateEnterpriseEmailLayout } from './baseLayout';

export function generateWelcomeEmailHTML(params: {
  employeeName: string;
  employeeNum: string;
  designation: string;
  email: string;
  companyName: string;
  companyLogo?: string;
}): string {
  return generateEnterpriseEmailLayout({
    companyName: params.companyName,
    companyLogo: params.companyLogo,
    headerTitle: `Welcome to ${params.companyName}!`,
    bodyHtml: `
      <p>Hi <strong>${params.employeeName}</strong>,</p>
      <p>Your official employee profile and access account have been created successfully. Welcome to the team!</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <h3 style="margin-top: 0; color: #4338ca; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Employee Credentials Summary</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Employee ID:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 800; font-family: monospace;">${params.employeeNum}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Designation:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${params.designation}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Portal Account Email:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${params.email}</td>
          </tr>
        </table>
      </div>

      <p>Please use your credentials to sign in and set up your staff workspace portal.</p>
    `,
    actionButton: {
      text: 'Sign In To Workspace',
      url: 'http://localhost:5173/login',
    },
    footerNote: 'Welcome aboard! If you have any questions, please reach out to your HR specialist or manager.',
  });
}
