export interface EnterpriseEmailLayoutProps {
  companyName: string;
  companyLogo?: string;
  headerTitle: string;
  bodyHtml: string;
  actionButton?: {
    text: string;
    url: string;
  };
  footerNote?: string;
}

/**
 * Master Enterprise Email Layout Wrapper
 */
export function generateEnterpriseEmailLayout(props: EnterpriseEmailLayoutProps): string {
  const backendUrl = process.env.APP_BACKEND_URL || 'http://localhost:5000';
  const logoSrc = props.companyLogo
    ? props.companyLogo.startsWith('http') || props.companyLogo.startsWith('data:')
      ? props.companyLogo
      : `${backendUrl}${props.companyLogo}`
    : null;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f1f5f9;
      margin: 0;
      padding: 40px 16px;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
      border: 1px solid #e2e8f0;
    }
    .email-header {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
      padding: 32px 36px;
      color: #ffffff;
    }
    .company-logo-container {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .company-logo-img {
      max-height: 38px;
      max-width: 160px;
      object-fit: contain;
    }
    .company-badge {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #a5b4fc;
    }
    .header-title {
      font-size: 22px;
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.5px;
      line-height: 1.2;
      color: #ffffff;
    }
    .email-body {
      padding: 36px;
      font-size: 14px;
      line-height: 1.6;
      color: #334155;
    }
    .action-btn-container {
      margin: 32px 0 24px 0;
      text-align: center;
    }
    .action-btn {
      display: inline-block;
      background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
      color: #ffffff !important;
      font-weight: 700;
      font-size: 13px;
      padding: 14px 32px;
      border-radius: 12px;
      text-decoration: none;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
    }
    .email-footer {
      background-color: #f8fafc;
      padding: 24px 36px;
      border-top: 1px solid #f1f5f9;
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
      line-height: 1.5;
    }
    .footer-brand {
      font-weight: 700;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <div class="company-logo-container">
        ${logoSrc ? `<img src="${logoSrc}" alt="${props.companyName}" class="company-logo-img" />` : ''}
        <span class="company-badge">${props.companyName}</span>
      </div>
      <h1 class="header-title">${props.headerTitle}</h1>
    </div>

    <div class="email-body">
      ${props.bodyHtml}

      ${props.actionButton ? `
        <div class="action-btn-container">
          <a href="${props.actionButton.url}" class="action-btn" target="_blank">${props.actionButton.text}</a>
        </div>
      ` : ''}
    </div>

    <div class="email-footer">
      <p class="footer-brand">© ${new Date().getFullYear()} ${props.companyName}. All rights reserved.</p>
      <p>${props.footerNote || 'This is an automated operational email sent from FocusTrack Enterprise Workspace.'}</p>
    </div>
  </div>
</body>
</html>
  `;
}
