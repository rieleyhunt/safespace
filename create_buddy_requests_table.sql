-- Create buddy_requests table for managing connection requests between users and buddies
CREATE TABLE IF NOT EXISTS buddy_requests (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  buddy_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  user_lat DECIMAL(10, 8) NOT NULL,
  user_lon DECIMAL(11, 8) NOT NULL,
  destination TEXT,
  destination_lat DECIMAL(10, 8),
  destination_lon DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable real-time for this table
ALTER PUBLICATION supabase_realtime ADD TABLE buddy_requests;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_buddy_requests_buddy_id ON buddy_requests(buddy_id);
CREATE INDEX IF NOT EXISTS idx_buddy_requests_status ON buddy_requests(status);
CREATE INDEX IF NOT EXISTS idx_buddy_requests_user_id ON buddy_requests(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE buddy_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for Supabase Realtime
CREATE POLICY "Buddies can view their requests" ON buddy_requests
  FOR SELECT USING (auth.uid() = buddy_id);

CREATE POLICY "Users can view their requests" ON buddy_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create requests" ON buddy_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Buddies can update their requests" ON buddy_requests
  FOR UPDATE USING (auth.uid() = buddy_id);
