  CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE, 
    email TEXT UNIQUE,
    password_hash TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT UNIQUE, 
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tokens (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    token_type TEXT,
    expiry_date TIMESTAMP,
    used BOOLEAN DEFAULT FALSE,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS federated_credentials (
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    provider TEXT,
    subject TEXT,
    PRIMARY KEY (provider, subject)
  );


-- Profiles Table: Handles public user profile data (visible to other users)
CREATE TABLE profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- UUID as primary key using gen_random_uuid()
    user_id UUID UNIQUE REFERENCES users(user_id) ON DELETE CASCADE, -- Link to the user, unique to ensure 1-to-1 relationship
    gender TEXT, -- Options could be 'male', 'female', 'other', etc.
    age INT,
    sexual_preference TEXT, -- Options could be 'male', 'female', 'both'
    biography TEXT,
    fame_rating INT DEFAULT 0, -- Fame rating of the user
    profile_picture TEXT, -- Path or URL of the profile picture
    gps_latitude FLOAT, -- GPS position latitude
    gps_longitude FLOAT, -- GPS position longitude
    last_online TIMESTAMP, -- Last online timestamp for the user
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Interests Table: Stores user interests using tags (part of the public profile)
CREATE TABLE user_interests (
    interest_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(profile_id) ON DELETE CASCADE,
    interest_tag TEXT
);

-- User Pictures Table: Handles additional pictures uploaded by the user (part of the public profile)
CREATE TABLE user_pictures (
    picture_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(profile_id) ON DELETE CASCADE,
    picture_url TEXT
);

-- Visits Table: Stores profile visit history (who visited whom)
CREATE TABLE visits (
    visit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_profile_id UUID REFERENCES profiles(profile_id) ON DELETE CASCADE,
    visited_profile_id UUID REFERENCES profiles(profile_id) ON DELETE CASCADE,
    visit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Matches Table: Handles matches between users (previously called 'likes')
CREATE TABLE matches (
    match_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matcher_profile_id UUID REFERENCES profiles(profile_id) ON DELETE CASCADE,
    matched_profile_id UUID REFERENCES profiles(profile_id) ON DELETE CASCADE,
    is_connected BOOLEAN DEFAULT FALSE, -- Becomes true if both users match
    match_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blocked Users Table: Handles blocked users
CREATE TABLE blocked_users (
    block_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_profile_id UUID REFERENCES profiles(profile_id) ON DELETE CASCADE,
    blocked_profile_id UUID REFERENCES profiles(profile_id) ON DELETE CASCADE,
    block_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat Table: Handles chat messages between matched users
CREATE TABLE chats (
    chat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_profile_id UUID REFERENCES profiles(profile_id) ON DELETE CASCADE,
    receiver_profile_id UUID REFERENCES profiles(profile_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table: Stores notifications for various user activities
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE, -- Notifications linked to user (not public)
    notification_type TEXT, -- E.g., 'match', 'message', 'visit'
    from_profile_id UUID REFERENCES profiles(profile_id),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Advanced Search Table: This could store user preferences for searches (only visible to the user)
CREATE TABLE search_preferences (
    search_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    age_min INT,
    age_max INT,
    fame_rating_min INT,
    fame_rating_max INT,
    location_radius FLOAT, -- e.g., 50 km radius
    interests_filter TEXT -- Store tags as a string or use a more normalized design
);

-- User Reports Table: Handles user reports for inappropriate behavior
CREATE TABLE user_reports (
    report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_profile_id UUID REFERENCES profiles(profile_id) ON DELETE CASCADE,
    reported_profile_id UUID REFERENCES profiles(profile_id) ON DELETE CASCADE,
    report_reason TEXT,
    report_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

