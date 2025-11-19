import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ path: process.env.SERVER_ENV ?? process.env.ENV_FILE });

const secret = process.env.JWT_SECRET || 'local-dev-secret';
const roleArg = process.argv[2];
const role = roleArg === 'moderator' ? 'moderator' : 'partner';
const subject = process.argv[3] || `${role}-${Date.now()}`;

const token = jwt.sign(
  {
    sub: subject,
    role
  },
  secret,
  { expiresIn: '30d' }
);

console.log(token);
