# Registration System Documentation

## Overview

A complete user registration and authentication system using a dedicated `Registration` schema for storing and validating user registration data before creating user accounts.

## Schema Structure

### Registration Model (`Registration.model.js`)

The Registration schema stores all user registration information with comprehensive validation:

```javascript
{
  // User Information
  fullName: String (required, 3-50 chars)
  email: String (required, unique, valid email format)
  phone: String (required, unique, Pakistani format)
  cnic: String (optional, unique, format: XXXXX-XXXXXXX-X)
  password: String (required, min 6 chars, hashed)
  
  // Registration Status
  status: Enum ['pending', 'verified', 'approved', 'rejected']
  role: Enum ['member', 'trainer', 'nutritionist'] (default: member)
  
  // Verification
  isEmailVerified: Boolean (default: false)
  isPhoneVerified: Boolean (default: false)
  emailVerificationToken: String
  emailVerificationExpiry: Date
  phoneVerificationToken: String
  phoneVerificationExpiry: Date
  
  // Account Security
  isActive: Boolean (default: true)
  accountLocked: Boolean (default: false)
  loginAttempts: Number (default: 0)
  lockUntil: Date
  
  // Metadata
  registrationIP: String
  registrationUserAgent: String
  createdAt: Date
  updatedAt: Date
  approvedAt: Date
  approvedBy: ObjectId (ref: User)
  rejectionReason: String
  rejectedAt: Date
  rejectedBy: ObjectId (ref: User)
}
```

## Key Features

### 1. **Password Security**
- Automatic hashing using bcrypt before saving
- Password comparison method for login validation
- Never stored or returned in plain text

### 2. **Account Locking**
- Automatic lock after 5 failed login attempts
- 30-minute lock duration
- Automatic unlock when duration expires

### 3. **Validation**
- Built-in `validateUser()` method
- Comprehensive error messages
- Custom validation rules for all fields

### 4. **Email/Phone Format Validation**
```
Email: Standard email format
Phone: Pakistani format (+923001234567 or 03001234567)
CNIC: Format XXXXX-XXXXXXX-X (optional)
```

## Validation Middleware

### `registration.validation.js`

Two validation functions:

#### `validateRegistration(req, res, next)`
Validates registration form data:
- Full name (3-50 characters)
- Email (valid format, unique)
- Phone (Pakistani format, unique)
- CNIC (optional, valid format)
- Password (min 6 chars)
- Confirm password (must match)

#### `validateLogin(req, res, next)`
Validates login form data:
- Email (valid format)
- Password (provided)

## API Endpoints

### Authentication Endpoints

#### 1. **Register User**
```
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+923001234567",
  "cnic": "12345-1234567-1" (optional),
  "password": "password123",
  "confirmPassword": "password123"
}

Response (201 Created):
{
  "success": true,
  "message": "Registration successful. You can now login.",
  "registration": {
    "_id": "...",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+923001234567",
    "status": "approved"
  },
  "nextStep": "login"
}
```

#### 2. **Login User**
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123",
  "adminCode": null (optional, for admin login)
}

Response (200 OK):
{
  "success": true,
  "_id": "...",
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+923001234567",
  "role": "member",
  "hasMembership": true,
  "token": "jwt_token_here",
  "message": "Login successful"
}
```

#### 3. **Get User Profile**
```
GET /api/auth/profile
Authorization: Bearer {token}

Response:
{
  "success": true,
  "user": {
    "_id": "...",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+923001234567",
    "role": "member"
  },
  "memberProfile": { ... } (if applicable)
}
```

### Registration Management Endpoints (Admin Only)

#### 1. **Get Pending Registrations**
```
GET /api/registrations/pending
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "count": 5,
  "registrations": [...]
}
```

#### 2. **Get All Registrations with Filters**
```
GET /api/registrations?status=pending&role=member&search=john&page=1&limit=10
Authorization: Bearer {admin_token}

Query Parameters:
- status: pending|verified|approved|rejected
- role: member|trainer|nutritionist
- search: search by name, email, or phone
- page: page number (default: 1)
- limit: records per page (default: 10)

Response:
{
  "success": true,
  "total": 25,
  "page": 1,
  "pages": 3,
  "registrations": [...]
}
```

#### 3. **Approve Registration**
```
POST /api/registrations/{registrationId}/approve
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "message": "Registration approved successfully",
  "registration": { ... },
  "user": { ... }
}
```

#### 4. **Reject Registration**
```
POST /api/registrations/{registrationId}/reject
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "rejectionReason": "Invalid phone number"
}

Response:
{
  "success": true,
  "message": "Registration rejected successfully",
  "registration": {
    "_id": "...",
    "fullName": "John Doe",
    "email": "john@example.com",
    "status": "rejected",
    "rejectionReason": "Invalid phone number"
  }
}
```

#### 5. **Get Registration Statistics**
```
GET /api/registrations/stats
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "stats": {
    "total": 100,
    "pending": 10,
    "verified": 20,
    "approved": 60,
    "rejected": 10,
    "byRole": {
      "member": 50,
      "trainer": 35,
      "nutritionist": 15
    }
  }
}
```

#### 6. **Delete Registration**
```
DELETE /api/registrations/{registrationId}
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "message": "Registration deleted successfully"
}
```

## Error Handling

### Error Codes

| Code | Status | Message |
|------|--------|---------|
| VALIDATION_ERROR | 400 | Validation failed with detailed errors |
| DUPLICATE_REGISTRATION | 400 | User already registered |
| DUPLICATE_FIELD | 400 | Specific field already exists |
| USER_EXISTS | 400 | User account already exists |
| ACCOUNT_LOCKED | 401 | Account temporarily locked |
| INVALID_CREDENTIALS | 401 | Invalid email or password |
| NOT_FOUND | 404 | Registration/User not found |
| SERVER_ERROR | 500 | Internal server error |

## Field Validation Rules

### Full Name
- Required: Yes
- Min Length: 3 characters
- Max Length: 50 characters
- Pattern: Any characters allowed

### Email
- Required: Yes
- Unique: Yes
- Pattern: Valid email format
- Case: Converted to lowercase

### Phone
- Required: Yes
- Unique: Yes
- Pattern: Pakistani format (+923001234567 or 03001234567)
- Length: 10-13 characters

### CNIC
- Required: No
- Unique: Yes (if provided)
- Pattern: XXXXX-XXXXXXX-X (e.g., 12345-1234567-1)

### Password
- Required: Yes
- Min Length: 6 characters
- Hashed: bcrypt (10 rounds)
- Confirmation: Must match in registration

## Database Indices

For optimal performance, the following indices are created:

```javascript
- { email: 1, status: 1 }
- { phone: 1, status: 1 }
- { createdAt: -1 }
- { status: 1 }
```

## Security Features

1. **Password Hashing**: Automatic bcrypt hashing with 10 rounds
2. **Account Locking**: Auto-lock after 5 failed attempts for 30 minutes
3. **Input Validation**: Comprehensive validation on all inputs
4. **Unique Constraints**: Email and phone are unique per user
5. **Status Workflow**: Only approved registrations can login
6. **Admin Approval**: Optional admin review before account activation
7. **JWT Tokens**: Secure token-based authentication
8. **CORS Protection**: Configured CORS headers
9. **Helmet Security**: Security headers via Helmet.js

## Registration Flow

```
1. User submits registration form
   ↓
2. Validation middleware checks all fields
   ↓
3. Check for duplicates (email, phone, CNIC)
   ↓
4. Create Registration record
   ↓
5. Auto-approve registration (can be changed to require admin approval)
   ↓
6. User can login with registered credentials
   ↓
7. On successful login, create corresponding User record if needed
   ↓
8. Return JWT token
```

## Login Flow

```
1. User submits login credentials
   ↓
2. Validation middleware checks email and password
   ↓
3. Find approved Registration record
   ↓
4. Check if account is locked
   ↓
5. Compare password using bcrypt
   ↓
6. If invalid: Increment login attempts
   ↓
7. If valid: Reset login attempts, get/create User record
   ↓
8. Return JWT token
```

## Files Created/Modified

### New Files
- `models/Registration.model.js` - Registration schema with validation
- `middleware/registration.validation.js` - Registration/login validation
- `controllers/registration.controller.js` - Registration management endpoints
- `routes/registration.routes.js` - Registration management routes

### Modified Files
- `controllers/auth.controller.js` - Updated to use Registration schema
- `routes/auth.routes.js` - Added validation middleware
- `server.js` - Added registration routes

## Usage Example

### Frontend Integration

```javascript
// Register
const response = await fetch('http://localhost:5002/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '+923001234567',
    password: 'password123',
    confirmPassword: 'password123'
  })
});

// Login
const loginResponse = await fetch('http://localhost:5002/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'password123'
  })
});

const data = await loginResponse.json();
// Store token: localStorage.setItem('token', data.token);
```

## Testing

### Postman Collection

Can be imported to test all endpoints:
- Registration with valid/invalid data
- Login with correct/incorrect credentials
- Account locking after 5 attempts
- Admin registration management
- Profile retrieval

## Troubleshooting

### Issue: "User already exists"
- **Cause**: Email, phone, or CNIC already registered
- **Solution**: Use different values or contact admin

### Issue: "Account is temporarily locked"
- **Cause**: 5+ failed login attempts
- **Solution**: Wait 30 minutes for automatic unlock

### Issue: "Validation failed"
- **Cause**: Invalid field format or missing required fields
- **Solution**: Check error details and correct the input

### Issue: "Invalid admin code"
- **Cause**: Wrong admin code provided
- **Solution**: Use correct admin code (ELGYM2024 or GYM123)

## Future Enhancements

1. Email verification before account activation
2. Phone number OTP verification
3. Password reset functionality
4. User profile completion workflow
5. Admin approval requirement before activation
6. Bulk registration import
7. Registration analytics dashboard
