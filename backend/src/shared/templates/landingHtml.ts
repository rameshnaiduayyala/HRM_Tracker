export const landingHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TaskTracky - Enterprise API Portal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-color: #0b0f19;
      --card-bg: #111827;
      --border-color: #1f2937;
      --text-primary: #f9fafb;
      --text-secondary: #9ca3af;
      --accent-primary: #6366f1;
      --accent-secondary: #a855f7;
      --success: #10b981;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Outfit', sans-serif;
      background-color: var(--bg-color);
      color: var(--text-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow-x: hidden;
    }

    /* Subtle background glow */
    .background-glow {
      position: absolute;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.05) 50%, rgba(0,0,0,0) 100%);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1;
      pointer-events: none;
    }

    .container {
      position: relative;
      z-index: 2;
      width: 100%;
      max-width: 650px;
      padding: 2rem;
      text-align: center;
    }

    .logo {
      font-size: 2.5rem;
      font-weight: 700;
      letter-spacing: -0.05em;
      background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      font-size: 1.1rem;
      color: var(--text-secondary);
      margin-bottom: 3rem;
      font-weight: 300;
    }

    .card-container {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    @media (min-width: 480px) {
      .card-container {
        grid-template-columns: 1fr 1fr;
      }
    }

    .card {
      background-color: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 2rem;
      text-decoration: none;
      color: inherit;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .card:hover {
      transform: translateY(-5px);
      border-color: rgba(99, 102, 241, 0.4);
      box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.1), 0 8px 10px -6px rgba(99, 102, 241, 0.1);
    }

    .card:hover::before {
      opacity: 1;
    }

    .card-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .card-description {
      font-size: 0.875rem;
      color: var(--text-secondary);
      line-height: 1.4;
    }

    .pulse-indicator {
      width: 10px;
      height: 10px;
      background-color: var(--success);
      border-radius: 50%;
      margin-top: 1rem;
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      animation: pulse 1.8s infinite;
    }

    @keyframes pulse {
      0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      }
      70% {
        transform: scale(1);
        box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
      }
      100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
      }
    }

    footer {
      margin-top: 4rem;
      font-size: 0.8rem;
      color: rgba(156, 163, 175, 0.4);
    }
  </style>
</head>
<body>
  <div class="background-glow"></div>
  <div class="container">
    <h1 class="logo">TaskTracky</h1>
    <p class="subtitle">Enterprise SaaS API Gateway Portal</p>
    
    <div class="card-container">
      <a href="/api-docs" class="card">
        <span class="card-title">API Documentation</span>
        <span class="card-description">Interactive OpenAPI Swagger interface. Test requests, models, & parameters.</span>
      </a>
      
      <a href="/health" class="card">
        <span class="card-title">Server Health</span>
        <span class="card-description">Retrieve the current service status and timestamp metrics.</span>
        <div class="pulse-indicator"></div>
      </a>
    </div>
    
    <footer>&copy; 2026 TaskTracky. All rights reserved.</footer>
  </div>
</body>
</html>
`;
