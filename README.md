# Authentication API

A secure Node.js authentication API built with Express.js, PostgreSQL, Sequelize ORM, and Swagger documentation.

## Features

- User registration and login with email/password
- Two-factor authentication using email OTP
- Role-based authorization (User and Super Admin roles)
- Input validation using Joi
- API documentation using Swagger
- PostgreSQL database with Sequelize ORM
- SSL enabled database connection
- Secure password hashing with bcrypt

## Tech Stack

- Node.js & Express.js
- PostgreSQL with Sequelize ORM
- JWT for authentication
- Joi for validation
- Swagger for API documentation
- Nodemailer for email notifications

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database (local or remote)
- SMTP server credentials for email notifications

## Project Structure

```
.
├── src/
│   ├── app.js              # Application entry point
│   ├── models/             # Database models
│   │   ├── index.js       # Database connection and model associations
│   │   ├── user.model.js  # User model definition
│   │   └── role.model.js  # Role model definition
│   ├── controllers/        # Request handlers
│   │   └── auth.controller.js
│   ├── middleware/         # Custom middleware
│   │   └── auth.middleware.js
│   ├── routes/            # Route definitions
│   │   └── auth.routes.js
│   └── validations/       # Validation schemas
│       └── auth.validation.js
├── .env                    # Environment variables
├── .gitignore             # Git ignore rules
├── package.json           # Project dependencies
└── README.md              # Project documentation
```

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
- Copy `.env.example` to `.env`
- Update the following variables in `.env`:
  ```
  DB_HOST=your-database-host
  DB_PORT=5432
  DB_NAME=your-database-name
  DB_USER=your-database-user
  DB_PASSWORD=your-database-password
  JWT_SECRET=your-jwt-secret
  SMTP_HOST=your-smtp-host
  SMTP_PORT=587
  SMTP_USER=your-smtp-user
  SMTP_PASS=your-smtp-password
  ```

4. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000` and Swagger documentation at `http://localhost:3000/api-docs`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
  - Required fields: firstName, lastName, email, password, gender
  - Optional fields: roleId (requires super admin privileges)

- `POST /api/auth/login` - Login with email and password
  - Required fields: email, password
  - Returns: OTP sent to email

- `POST /api/auth/verify-otp` - Verify OTP and get access token
  - Required fields: email, otp
  - Returns: JWT token and user information

## Security Features

- Password hashing using bcrypt
- JWT-based authentication
- Two-factor authentication with email OTP
- Role-based access control
- Input validation and sanitization
- SSL enabled database connection
- Environment variable protection

## Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `firstName` (String)
- `lastName` (String)
- `email` (String, Unique)
- `password` (String, Hashed)
- `gender` (Enum: male, female, other)
- `otpExpiry` (DateTime)
- `status` (Integer)
- `roleId` (UUID, Foreign Key)
- `createdBy` (UUID)
- `updatedBy` (UUID)
- `created_at` (DateTime)
- `updated_at` (DateTime)

### Roles Table
- `id` (UUID, Primary Key)
- `name` (Enum: user, super_admin)
- `status` (Integer)
- `createdBy` (UUID)
- `updatedBy` (UUID)
- `created_at` (DateTime)
- `updated_at` (DateTime)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
