  CREATE TABLE IF NOT EXISTS accounts (
    user_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE,
    phone TEXT UNIQUE, 
    username TEXT UNIQUE, 
    hashed_password TEXT,
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    last_login TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tokens (
    token_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    token_type TEXT,
    expiry_date TIMESTAMP,
    used BOOLEAN DEFAULT FALSE,
    value TEXT,
    FOREIGN KEY (user_id) REFERENCES accounts(user_id)
  );

  CREATE TABLE IF NOT EXISTS federated_credentials (
    user_id UUID,
    provider TEXT,
    subject TEXT,
    PRIMARY KEY (provider, subject),
    FOREIGN KEY (user_id) REFERENCES accounts(user_id)
  );
