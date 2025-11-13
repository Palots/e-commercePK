import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Commerce API Documentation',
      version: '1.0.0',
      description: `
        API REST completa para E-Commerce con:
        - Autenticación JWT
        - Autenticación de doble factor (2FA)
        - Gestión de usuarios
        - Catálogo de productos
        - Carrito de compras
        - Sistema de pedidos
        - Manejo de inventario
      `,
      contact: {
        name: 'API Support',
        email: 'support@ecommerce.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingresa el token JWT obtenido del login'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Mensaje de error'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            mensaje: {
              type: 'string',
              example: 'Operación exitosa'
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js']
}

const swaggerSpec = swaggerJsdoc(options)

// Configuración personalizada de Swagger UI
const swaggerOptions = {
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    tryItOutEnabled: true
  },
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "E-Commerce API Docs"
}

export { swaggerUi, swaggerSpec, swaggerOptions }