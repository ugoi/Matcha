  CREATE TABLE IF NOT EXISTS accounts (
    user_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE,
    phone TEXT UNIQUE, 
    username TEXT UNIQUE, 
    hashed_password TEXT,
    salt TEXT,
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL, 
    last_login TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tokens (
    token_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    token_type TEXT,
    expiry_date TIMESTAMP,
    used BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES accounts(user_id)
  );
