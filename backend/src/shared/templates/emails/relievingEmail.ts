import { generateEnterpriseEmailLayout } from './baseLayout';
import { RelievingLetterParams } from '../../utils/documentTemplates';

export function generateRelievingLetterEmailHTML(params: RelievingLetterParams): string {
  const joinDate = new Date(params.joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const exitDate = new Date(params.lastWorkingDay).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return generateEnterpriseEmailLayout({
    companyName: params.companyName,
    companyLogo: params.companyLogo,
    headerTitle: 'Relieving & Service Experience Letter',
    bodyHtml: `
      <p>Dear <strong>${params.employeeName}</strong>,</p>
      <p>This is to confirm that your service with <strong>${params.companyName}</strong> as <strong>${params.designation}</strong> (${params.employeeNum}) has concluded effective <strong>${exitDate}</strong>.</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Date of Joining:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${joinDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Last Working Date:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${exitDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Clearance Status:</td>
            <td style="padding: 6px 0; color: #10b981; font-weight: 800;">Fully Cleared (IT / Finance / HR)</td>
          </tr>
        </table>
      </div>

      <p>We appreciate your contributions during your tenure with ${params.companyName} and wish you every success in your future professional endeavors.</p>
    `,
    footerNote: 'This is an official computer-generated relieving document issued by HR Operations.',
  });
}
