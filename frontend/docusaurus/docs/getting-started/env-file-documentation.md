---
title: Configuration Guide for .env File
description: A guide to understanding and configuring the .env file for Matcha Real-Time API projects.
---

# Introduction

The `.env` file is a configuration file used to define environment variables that are crucial for the setup and operation of the Matcha Real-Time API. These variables are loaded at runtime and help manage sensitive data, such as API keys and database credentials, securely.

# Example .env File

Below is an example of the `.env` file structure:

```
# development@v2

## Host
PROTOCOL=<mock_value>
HOST=<mock_value>
PORT=<mock_value>
BASE_URL=<mock_value>

## Database
DB_HOST=<mock_value>
DB_PORT=<mock_value>
DB_NAME=<mock_value>
DB_USER=<mock_value>
DB_PASSWORD=<mock_value>
DB_MAX=<mock_value>

## Mail
BREVO_API_KEY=<mock_value>
BREVO_SENDER_EMAIL=<mock_value>
BREVO_SENDER_NAME=<mock_value>

EMAIL_VERIFICATION=<mock_value>

DEFAULT_FILTER=<mock_value>
DEFAULT_SORT=<mock_value>


#JWT
JWT_SECRET=<mock_value>
JWT_EXPIRES_IN=<mock_value>
JWT_ISSUER=<mock_value>
JWT_AUDIENCE=<mock_value>
JWT_EXPIRES_IN=<mock_value>

#Cookie Parser
COOKIE_SECRET=<mock_value>

#Google OAuth
GOOGLE_CLIENT_ID=<mock_value>
GOOGLE_CLIENT_SECRET=<mock_value>

#Facebook OAuth
FACEBOOK_CLIENT_ID=<mock_value>
FACEBOOK_CLIENT_SECRET=<mock_value>


#
# Hi 👋, this is a real .env file.
#
# 1. Connect to it locally (one-time setup):
#
# $ cd ../path/to/express-server
# $ npx dotenv-vault@latest new vlt_c7b337d56fcdf670eee37378d8cb33178a0dd27a62cc080a4f7eace824ac26aa
#
# 2. Pull it down:
#
# $ npx dotenv-vault@latest pull
#
# 3. Or push yours up:
#
# $ npx dotenv-vault@latest push
#
# 
# Enjoy. 🌴
```

# Explanation of Variables

Each variable in the `.env` file is explained below:

- **`<VARIABLE_NAME>`**: [Explanation of the variable and its usage]
- **`<ANOTHER_VARIABLE>`**: [Explanation of the variable and its usage]

Replace placeholders with actual variable names and provide clear explanations based on the specific `.env` file uploaded.

# Usage Instructions

1. **Create the `.env` File**  
   Ensure the `.env` file is placed in the root directory of your project.

2. **Add Required Variables**  
   Populate the `.env` file with the necessary variables as shown in the example above.

3. **Secure the `.env` File**  
   Prevent unauthorized access by adding `.env` to your `.gitignore` file.

4. **Load the Variables**  
   Use a library like `dotenv` to load the variables into your application. For example, in Node.js:

   ```javascript
   require('dotenv').config();

   console.log(process.env.VARIABLE_NAME);
   ```

# Best Practices

- **Do not expose the `.env` file**: Avoid including the `.env` file in version control.
- **Use environment-specific files**: For example, `.env.development` for development and `.env.production` for production.
- **Regularly update secrets**: Periodically rotate API keys, tokens, and other sensitive information.
