// -- Visits Table: Stores profile visit history (who visited whom)
// CREATE TABLE IF NOT EXISTS visits (
//     visit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//     visitor_user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
//     visited_user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
//     visit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );

export interface CreateVisit {
  visitor_user_id: string;
  visited_user_id: string;
}

export interface Visit {
    visitor_user_id: string;
    visited_user_id: string;
    visit_time: string;
}

export interface FindUserVisits {
    visited_user_id: string;
}
