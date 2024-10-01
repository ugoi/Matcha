  CREATE TABLE IF NOT EXISTS accounts (
    user_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE, 
    hashed_password TEXT,
    salt TEXT,
    email TEXT UNIQUE,
    phone TEXT UNIQUE, 
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL, 
    last_login TIMESTAMP
  );
