export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Enterprise Employee Productivity SaaS API',
    version: '1.0.0',
    description: 'API documentation for the workforce management, session monitoring, and productivity SaaS platform.',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      TenantHeader: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Tenant-ID',
        description: 'Subdomain or ID of the tenant context',
      },
    },
    schemas: {
      Tenant: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          subdomain: { type: 'string' },
          status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED', 'PENDING'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Company: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          tenantId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Employee: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          employeeNum: { type: 'string' },
          userId: { type: 'string', format: 'uuid' },
          companyId: { type: 'string', format: 'uuid' },
          departmentId: { type: 'string', format: 'uuid', nullable: true },
          teamId: { type: 'string', format: 'uuid', nullable: true },
          status: { type: 'string' },
          designation: { type: 'string', nullable: true },
          joiningDate: { type: 'string', format: 'date-time' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          tenantId: { type: 'string', format: 'uuid' },
          role: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
      },
      Attendance: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          employeeId: { type: 'string', format: 'uuid' },
          clockIn: { type: 'string', format: 'date-time' },
          clockOut: { type: 'string', format: 'date-time', nullable: true },
          overtime: { type: 'integer' },
        },
      },
      WorkSession: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          employeeId: { type: 'string', format: 'uuid' },
          start: { type: 'string', format: 'date-time' },
          end: { type: 'string', format: 'date-time', nullable: true },
          status: { type: 'string', enum: ['RUNNING', 'PAUSED', 'COMPLETED'] },
        },
      },
      Activity: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          workSessionId: { type: 'string', format: 'uuid' },
          app: { type: 'string' },
          windowTitle: { type: 'string', nullable: true },
          idleDuration: { type: 'integer' },
          activeDuration: { type: 'integer' },
          percentage: { type: 'number' },
        },
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          companyId: { type: 'string', format: 'uuid' },
          status: { type: 'string' },
        },
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          projectId: { type: 'string', format: 'uuid' },
          employeeId: { type: 'string', format: 'uuid', nullable: true },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
          status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'] },
        },
      },
      Error: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          message: { type: 'string' },
          errors: { type: 'object' },
        },
      },
    },
  },
  security: [
    {
      TenantHeader: [],
      BearerAuth: [],
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Server Health Check',
        security: [],
        responses: {
          200: {
            description: 'Server is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    database: { type: 'string', example: 'connected' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/tenants': {
      post: {
        summary: 'Create a new Tenant, Company Division, and Admin User',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'subdomain', 'adminEmail'],
                properties: {
                  name: { type: 'string', minLength: 2, example: 'Acme Corp' },
                  subdomain: { type: 'string', minLength: 2, example: 'acme' },
                  adminEmail: { type: 'string', format: 'email', example: 'admin@acme.com' },
                  adminPassword: { type: 'string', minLength: 8, example: 'admin123' },
                  adminFirstName: { type: 'string', example: 'System' },
                  adminLastName: { type: 'string', example: 'Admin' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Tenant onboarding completed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: {
                      type: 'object',
                      properties: {
                        tenant: { $ref: '#/components/schemas/Tenant' },
                        company: { $ref: '#/components/schemas/Company' },
                        user: { $ref: '#/components/schemas/User' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/register': {
      post: {
        summary: 'Register User under Tenant context',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'firstName', 'lastName'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'admin@acme.com' },
                  password: { type: 'string', minLength: 8, example: 'password123' },
                  firstName: { type: 'string', example: 'John' },
                  lastName: { type: 'string', example: 'Doe' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        summary: 'Authenticate User and get Access & Refresh Tokens',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'admin@acme.com' },
                  password: { type: 'string', example: 'password123' },
                  deviceFingerprint: { type: 'string', example: 'unique-device-hash' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Authenticated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: {
                      type: 'object',
                      properties: {
                        accessToken: { type: 'string' },
                        refreshToken: { type: 'string' },
                        user: { $ref: '#/components/schemas/User' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/companies': {
      get: {
        summary: 'List Companies under Tenant',
        responses: {
          200: {
            description: 'List of companies retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: {
                      type: 'object',
                      properties: {
                        companies: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Company' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create a Company under Tenant',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Sales Department Corp' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Company created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: {
                      type: 'object',
                      properties: {
                        company: { $ref: '#/components/schemas/Company' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/employees': {
      get: {
        summary: 'List Employees for a Company',
        parameters: [
          {
            name: 'companyId',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'UUID of the company context',
          },
        ],
        responses: {
          200: {
            description: 'List of employees retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: {
                      type: 'object',
                      properties: {
                        employees: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Employee' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create/Hire an Employee',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['employeeNum', 'userId', 'companyId'],
                properties: {
                  employeeNum: { type: 'string', example: 'EMP-00102' },
                  userId: { type: 'string', format: 'uuid' },
                  companyId: { type: 'string', format: 'uuid' },
                  departmentId: { type: 'string', format: 'uuid' },
                  teamId: { type: 'string', format: 'uuid' },
                  designation: { type: 'string', example: 'Senior Engineer' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Employee created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: {
                      type: 'object',
                      properties: {
                        employee: { $ref: '#/components/schemas/Employee' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/attendance/status': {
      get: {
        summary: 'Check Current Attendance Status',
        responses: {
          200: {
            description: 'Attendance status object',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: {
                      type: 'object',
                      properties: {
                        clockedIn: { type: 'boolean' },
                        attendance: { $ref: '#/components/schemas/Attendance' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/attendance/clock-in': {
      post: {
        summary: 'Clock In for Attendance',
        responses: {
          200: {
            description: 'Clocked in successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: {
                      type: 'object',
                      properties: {
                        record: { $ref: '#/components/schemas/Attendance' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/attendance/clock-out': {
      post: {
        summary: 'Clock Out for Attendance',
        responses: {
          200: {
            description: 'Clocked out successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: {
                      type: 'object',
                      properties: {
                        record: { $ref: '#/components/schemas/Attendance' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/work-sessions/start': {
      post: {
        summary: 'Start an Active Work Session',
        responses: {
          201: {
            description: 'Work session started',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: {
                      type: 'object',
                      properties: {
                        session: { $ref: '#/components/schemas/WorkSession' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/work-sessions/stop': {
      post: {
        summary: 'Stop the Active Work Session',
        responses: {
          200: {
            description: 'Work session completed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: {
                      type: 'object',
                      properties: {
                        session: { $ref: '#/components/schemas/WorkSession' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/work-sessions/heartbeat': {
      post: {
        summary: 'Submit active application heartbeat metrics',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['app', 'idleDuration', 'activeDuration'],
                properties: {
                  app: { type: 'string', example: 'VS Code' },
                  windowTitle: { type: 'string', example: 'index.ts' },
                  idleDuration: { type: 'integer', description: 'Duration in seconds spent idle' },
                  activeDuration: { type: 'integer', description: 'Duration in seconds spent active' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Heartbeat logged',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: {
                      type: 'object',
                      properties: {
                        activity: { $ref: '#/components/schemas/Activity' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/tasks/projects': {
      get: {
        summary: 'List Projects for a Company',
        parameters: [
          {
            name: 'companyId',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Projects list retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: {
                      type: 'object',
                      properties: {
                        projects: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Project' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create a Project',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'companyId'],
                properties: {
                  name: { type: 'string', example: 'API Redevelopment' },
                  companyId: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Project created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: {
                      type: 'object',
                      properties: {
                        project: { $ref: '#/components/schemas/Project' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/tasks': {
      get: {
        summary: 'List Tasks for a Project',
        parameters: [
          {
            name: 'projectId',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Tasks list retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: {
                      type: 'object',
                      properties: {
                        tasks: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Task' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create a Task',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'projectId'],
                properties: {
                  title: { type: 'string', example: 'Fix compilation warnings' },
                  description: { type: 'string', example: 'Update Express return statements' },
                  projectId: { type: 'string', format: 'uuid' },
                  employeeId: { type: 'string', format: 'uuid' },
                  priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
                  status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'] },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Task created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: {
                      type: 'object',
                      properties: {
                        task: { $ref: '#/components/schemas/Task' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
