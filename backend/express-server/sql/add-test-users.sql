-- add-test-data.sql

-- Insert test users
INSERT INTO users (username, email, password_hash, first_name, last_name, phone, is_email_verified, is_phone_verified)
VALUES
('user1', 'user1@example.com', 'pwdhash1', 'John', 'Doe', '555-0001', TRUE, TRUE),
('user2', 'user2@example.com', 'pwdhash2', 'Jane', 'Smith', '555-0002', TRUE, TRUE),
('user3', 'user3@example.com', 'pwdhash3', 'Bob', 'Johnson', '555-0003', FALSE, FALSE),
('user4', 'user4@example.com', 'pwdhash4', 'Alice', 'Williams', '555-0004', TRUE, FALSE),
('user5', 'user5@example.com', 'pwdhash5', 'Michael', 'Brown', '555-0005', FALSE, TRUE),
('user6', 'user6@example.com', 'pwdhash6', 'Emily', 'Jones', '555-0006', TRUE, TRUE),
('user7', 'user7@example.com', 'pwdhash7', 'David', 'Garcia', '555-0007', FALSE, FALSE),
('user8', 'user8@example.com', 'pwdhash8', 'Sarah', 'Martinez', '555-0008', TRUE, TRUE),
('user9', 'user9@example.com', 'pwdhash9', 'Chris', 'Rodriguez', '555-0009', TRUE, FALSE),
('user10', 'user10@example.com', 'pwdhash10', 'Laura', 'Hernandez', '555-0010', FALSE, TRUE),
('user11', 'user11@example.com', 'pwdhash11', 'James', 'Lopez', '555-0011', TRUE, TRUE),
('user12', 'user12@example.com', 'pwdhash12', 'Linda', 'Gonzalez', '555-0012', TRUE, FALSE),
('user13', 'user13@example.com', 'pwdhash13', 'Robert', 'Wilson', '555-0013', FALSE, TRUE),
('user14', 'user14@example.com', 'pwdhash14', 'Patricia', 'Anderson', '555-0014', TRUE, TRUE),
('user15', 'user15@example.com', 'pwdhash15', 'Daniel', 'Thomas', '555-0015', FALSE, FALSE),
('user16', 'user16@example.com', 'pwdhash16', 'Barbara', 'Taylor', '555-0016', TRUE, TRUE),
('user17', 'user17@example.com', 'pwdhash17', 'Matthew', 'Moore', '555-0017', TRUE, FALSE),
('user18', 'user18@example.com', 'pwdhash18', 'Elizabeth', 'Jackson', '555-0018', FALSE, TRUE),
('user19', 'user19@example.com', 'pwdhash19', 'Joseph', 'Martin', '555-0019', TRUE, TRUE),
('user20', 'user20@example.com', 'pwdhash20', 'Jennifer', 'Lee', '555-0020', TRUE, FALSE);

-- Insert profiles
INSERT INTO profiles (user_id, gender, age, sexual_preference, biography, fame_rating, profile_picture, location)
VALUES
((SELECT user_id FROM users WHERE username='user1'),'male',25,'female','Bio user1',0,'pic_u1.jpg', ST_SetSRID(ST_MakePoint(-73.935242,40.730610),4326)::geography),
((SELECT user_id FROM users WHERE username='user2'),'female',28,'male','Bio user2',0,'pic_u2.jpg', ST_SetSRID(ST_MakePoint(-118.243683,34.052235),4326)::geography),
((SELECT user_id FROM users WHERE username='user3'),'male',30,'female','Bio user3',0,'pic_u3.jpg', ST_SetSRID(ST_MakePoint(-87.623177,41.881832),4326)::geography),
((SELECT user_id FROM users WHERE username='user4'),'female',22,'male','Bio user4',0,'pic_u4.jpg', ST_SetSRID(ST_MakePoint(-95.358421,29.749907),4326)::geography),
((SELECT user_id FROM users WHERE username='user5'),'male',27,'both','Bio user5',0,'pic_u5.jpg', ST_SetSRID(ST_MakePoint(-112.074036,33.448376),4326)::geography),
((SELECT user_id FROM users WHERE username='user6'),'female',24,'female','Bio user6',0,'pic_u6.jpg', ST_SetSRID(ST_MakePoint(-122.419418,37.774929),4326)::geography),
((SELECT user_id FROM users WHERE username='user7'),'male',26,'male','Bio user7',0,'pic_u7.jpg', ST_SetSRID(ST_MakePoint(-71.058884,42.360081),4326)::geography),
((SELECT user_id FROM users WHERE username='user8'),'female',29,'both','Bio user8',0,'pic_u8.jpg', ST_SetSRID(ST_MakePoint(-80.191788,25.761681),4326)::geography),
((SELECT user_id FROM users WHERE username='user9'),'male',31,'female','Bio user9',0,'pic_u9.jpg', ST_SetSRID(ST_MakePoint(-77.036873,38.907192),4326)::geography),
((SELECT user_id FROM users WHERE username='user10'),'female',23,'male','Bio user10',0,'pic_u10.jpg', ST_SetSRID(ST_MakePoint(-104.990250,39.739235),4326)::geography),
((SELECT user_id FROM users WHERE username='user11'),'male',28,'both','Bio user11',0,'pic_u11.jpg', ST_SetSRID(ST_MakePoint(-93.265015,44.977753),4326)::geography),
((SELECT user_id FROM users WHERE username='user12'),'female',26,'female','Bio user12',0,'pic_u12.jpg', ST_SetSRID(ST_MakePoint(-95.992775,41.256538),4326)::geography),
((SELECT user_id FROM users WHERE username='user13'),'male',27,'male','Bio user13',0,'pic_u13.jpg', ST_SetSRID(ST_MakePoint(-90.199402,38.627003),4326)::geography),
((SELECT user_id FROM users WHERE username='user14'),'female',25,'both','Bio user14',0,'pic_u14.jpg', ST_SetSRID(ST_MakePoint(-86.781601,36.162663),4326)::geography),
((SELECT user_id FROM users WHERE username='user15'),'male',29,'female','Bio user15',0,'pic_u15.jpg', ST_SetSRID(ST_MakePoint(-84.387985,33.748997),4326)::geography),
((SELECT user_id FROM users WHERE username='user16'),'female',24,'male','Bio user16',0,'pic_u16.jpg', ST_SetSRID(ST_MakePoint(-81.379234,28.538336),4326)::geography),
((SELECT user_id FROM users WHERE username='user17'),'male',26,'both','Bio user17',0,'pic_u17.jpg', ST_SetSRID(ST_MakePoint(-97.743057,30.267153),4326)::geography),
((SELECT user_id FROM users WHERE username='user18'),'female',30,'female','Bio user18',0,'pic_u18.jpg', ST_SetSRID(ST_MakePoint(-96.796856,32.776665),4326)::geography),
((SELECT user_id FROM users WHERE username='user19'),'male',31,'male','Bio user19',0,'pic_u19.jpg', ST_SetSRID(ST_MakePoint(-117.161087,32.715736),4326)::geography),
((SELECT user_id FROM users WHERE username='user20'),'female',27,'both','Bio user20',0,'pic_u20.jpg', ST_SetSRID(ST_MakePoint(-115.139832,36.169941),4326)::geography);

-- Federated credentials (just a couple)
INSERT INTO federated_credentials (user_id, provider, subject)
VALUES
((SELECT user_id FROM users WHERE username='user1'), 'google', 'google-uid-1'),
((SELECT user_id FROM users WHERE username='user2'), 'facebook', 'fb-uid-2');

-- Tokens (just a few)
INSERT INTO tokens (user_id, token_type, expiry_date, used, value)
VALUES
((SELECT user_id FROM users WHERE username='user1'), 'access', CURRENT_TIMESTAMP + INTERVAL '1 day', FALSE, 'token_user1'),
((SELECT user_id FROM users WHERE username='user2'), 'refresh', CURRENT_TIMESTAMP + INTERVAL '2 days', FALSE, 'token_user2');

-- Interests (2 per user)
INSERT INTO user_interests (user_id, interest_tag) VALUES
((SELECT user_id FROM users WHERE username='user1'), 'hiking'),
((SELECT user_id FROM users WHERE username='user1'), 'reading'),
((SELECT user_id FROM users WHERE username='user2'), 'music'),
((SELECT user_id FROM users WHERE username='user2'), 'yoga'),
((SELECT user_id FROM users WHERE username='user3'), 'gaming'),
((SELECT user_id FROM users WHERE username='user3'), 'cooking'),
((SELECT user_id FROM users WHERE username='user4'), 'travel'),
((SELECT user_id FROM users WHERE username='user4'), 'art'),
((SELECT user_id FROM users WHERE username='user5'), 'movies'),
((SELECT user_id FROM users WHERE username='user5'), 'running'),
((SELECT user_id FROM users WHERE username='user6'), 'coding'),
((SELECT user_id FROM users WHERE username='user6'), 'dancing'),
((SELECT user_id FROM users WHERE username='user7'), 'photography'),
((SELECT user_id FROM users WHERE username='user7'), 'boardgames'),
((SELECT user_id FROM users WHERE username='user8'), 'cycling'),
((SELECT user_id FROM users WHERE username='user8'), 'karaoke'),
((SELECT user_id FROM users WHERE username='user9'), 'swimming'),
((SELECT user_id FROM users WHERE username='user9'), 'comics'),
((SELECT user_id FROM users WHERE username='user10'), 'wine'),
((SELECT user_id FROM users WHERE username='user10'), 'chess'),
((SELECT user_id FROM users WHERE username='user11'), 'fishing'),
((SELECT user_id FROM users WHERE username='user11'), 'piano'),
((SELECT user_id FROM users WHERE username='user12'), 'gardening'),
((SELECT user_id FROM users WHERE username='user12'), 'soccer'),
((SELECT user_id FROM users WHERE username='user13'), 'baking'),
((SELECT user_id FROM users WHERE username='user13'), 'martial arts'),
((SELECT user_id FROM users WHERE username='user14'), 'singing'),
((SELECT user_id FROM users WHERE username='user14'), 'reading'),
((SELECT user_id FROM users WHERE username='user15'), 'podcasts'),
((SELECT user_id FROM users WHERE username='user15'), 'tennis'),
((SELECT user_id FROM users WHERE username='user16'), 'surfing'),
((SELECT user_id FROM users WHERE username='user16'), 'tattoos'),
((SELECT user_id FROM users WHERE username='user17'), 'jogging'),
((SELECT user_id FROM users WHERE username='user17'), 'theatre'),
((SELECT user_id FROM users WHERE username='user18'), 'basketball'),
((SELECT user_id FROM users WHERE username='user18'), 'camping'),
((SELECT user_id FROM users WHERE username='user19'), 'poetry'),
((SELECT user_id FROM users WHERE username='user19'), 'chocolate'),
((SELECT user_id FROM users WHERE username='user20'), 'soccer'),
((SELECT user_id FROM users WHERE username='user20'), 'technology');

-- User Pictures (2 per user)
INSERT INTO user_pictures (user_id, picture_url) VALUES
((SELECT user_id FROM users WHERE username='user1'), 'user1_pic2.jpg'),
((SELECT user_id FROM users WHERE username='user1'), 'user1_pic3.jpg'),
((SELECT user_id FROM users WHERE username='user2'), 'user2_pic2.jpg'),
((SELECT user_id FROM users WHERE username='user2'), 'user2_pic3.jpg'),
((SELECT user_id FROM users WHERE username='user3'), 'user3_pic2.jpg'),
((SELECT user_id FROM users WHERE username='user3'), 'user3_pic3.jpg'),
((SELECT user_id FROM users WHERE username='user4'), 'user4_pic2.jpg'),
((SELECT user_id FROM users WHERE username='user4'), 'user4_pic3.jpg'),
((SELECT user_id FROM users WHERE username='user5'), 'user5_pic2.jpg'),
((SELECT user_id FROM users WHERE username='user5'), 'user5_pic3.jpg'),
((SELECT user_id FROM users WHERE username='user6'), 'user6_pic2.jpg'),
((SELECT user_id FROM users WHERE username='user6'), 'user6_pic3.jpg'),
((SELECT user_id FROM users WHERE username='user7'), 'user7_pic2.jpg'),
((SELECT user_id FROM users WHERE username='user7'), 'user7_pic3.jpg'),
((SELECT user_id FROM users WHERE username='user8'), 'user8_pic2.jpg'),
((SELECT user_id FROM users WHERE username='user8'), 'user8_pic3.jpg'),
((SELECT user_id FROM users WHERE username='user9'), 'user9_pic2.jpg'),
((SELECT user_id FROM users WHERE username='user9'), 'user9_pic3.jpg'),
((SELECT user_id FROM users WHERE username='user10'), 'user10_pic2.jpg'),
((SELECT user_id FROM users WHERE username='user10'), 'user10_pic3.jpg'),
((SELECT user_id FROM users WHERE username='user11'), 'user11_pic2.jpg'),
((SELECT user_id FROM users WHERE username='user11'), 'user11_pic3.jpg'),
((SELECT user_id FROM users WHERE username='user12'), 'user12_pic2.jpg'),
((SELECT user_id FROM users WHERE username='user12'), 'user12_pic3.jpg'),
((SELECT user_id FROM users WHERE username='user13'), 'user13_pic2.jpg'),
((SELECT user_id FROM users WHERE username='user13'), 'user13_pic3.jpg'),
((SELECT user_id FROM users WHERE username='user14'), 'user14_pic2.jpg'),
((SELECT user_id FROM users WHERE username='user14'), 'user14_pic3.jpg'),
((SELECT user_id FROM users WHERE username='user15'), 'user15_pic2.jpg'),
((SELECT user_id FROM users WHERE username='user15'), 'user15_pic3.jpg'),
((SELECT user_id FROM users WHERE username='user16'), 'user16_pic2.jpg'),
((SELECT user_id FROM users WHERE username='user16'), 'user16_pic3.jpg'),
((SELECT user_id FROM users WHERE username='user17'), 'user17_pic2.jpg'),
((SELECT user_id FROM users WHERE username='user17'), 'user17_pic3.jpg'),
((SELECT user_id FROM users WHERE username='user18'), 'user18_pic2.jpg'),
((SELECT user_id FROM users WHERE username='user18'), 'user18_pic3.jpg'),
((SELECT user_id FROM users WHERE username='user19'), 'user19_pic2.jpg'),
((SELECT user_id FROM users WHERE username='user19'), 'user19_pic3.jpg'),
((SELECT user_id FROM users WHERE username='user20'), 'user20_pic2.jpg'),
((SELECT user_id FROM users WHERE username='user20'), 'user20_pic3.jpg');

-- Visits
INSERT INTO visits (visitor_user_id, visited_user_id)
VALUES
((SELECT user_id FROM users WHERE username='user1'), (SELECT user_id FROM users WHERE username='user2')),
((SELECT user_id FROM users WHERE username='user1'), (SELECT user_id FROM users WHERE username='user3')),
((SELECT user_id FROM users WHERE username='user2'), (SELECT user_id FROM users WHERE username='user1')),
((SELECT user_id FROM users WHERE username='user3'), (SELECT user_id FROM users WHERE username='user4'));

-- Likes
INSERT INTO likes (liker_user_id, likee_user_id, is_like, like_type)
VALUES
((SELECT user_id FROM users WHERE username='user1'), (SELECT user_id FROM users WHERE username='user2'), TRUE, 'like'),
((SELECT user_id FROM users WHERE username='user2'), (SELECT user_id FROM users WHERE username='user1'), TRUE, 'like'),
((SELECT user_id FROM users WHERE username='user3'), (SELECT user_id FROM users WHERE username='user5'), TRUE, 'like');

-- Blocked Users
INSERT INTO blocked_users (blocker_user_id, blocked_user_id)
VALUES
((SELECT user_id FROM users WHERE username='user10'), (SELECT user_id FROM users WHERE username='user3'));

-- Chats
INSERT INTO chats (sender_user_id, receiver_user_id, message)
VALUES
((SELECT user_id FROM users WHERE username='user1'), (SELECT user_id FROM users WHERE username='user2'), 'Hey there!'),
((SELECT user_id FROM users WHERE username='user2'), (SELECT user_id FROM users WHERE username='user1'), 'Hi! How are you?');

-- Notification Object
INSERT INTO notification_object (entity_type, entity_id, status)
VALUES
(1, (SELECT user_id FROM users WHERE username='user1'), 1);

-- Notification
INSERT INTO notification (notification_object_id, notifier_id, status)
VALUES
((SELECT id FROM notification_object LIMIT 1), (SELECT user_id FROM users WHERE username='user1'), 0);

-- Notification Change
INSERT INTO notification_change (notification_object_id, actor_id)
VALUES
((SELECT id FROM notification_object LIMIT 1), (SELECT user_id FROM users WHERE username='user1'));

-- Search Preferences
INSERT INTO search_preferences (user_id, age_min, age_max, fame_rating_min, fame_rating_max, location_radius, interests_filter)
VALUES
((SELECT user_id FROM users WHERE username='user1'), 20, 35, 0, 100, 50, 'reading,music'),
((SELECT user_id FROM users WHERE username='user5'), 25, 40, 0, 100, 100, 'movies,running');

-- User Reports
INSERT INTO user_reports (reporter_user_id, reported_user_id, report_reason)
VALUES
((SELECT user_id FROM users WHERE username='user4'), (SELECT user_id FROM users WHERE username='user3'), 'Spamming messages');
