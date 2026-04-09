CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories Table (Managed by Admin)
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name_en TEXT NOT NULL UNIQUE,
    name_ar TEXT NOT NULL UNIQUE,
    icon TEXT, -- CSS class or icon name
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial Categories
INSERT INTO categories (name_en, name_ar, icon) VALUES 
('Infrastructure', 'بنية تحتية', 'HammerIcon'),
('Waste Management', 'نفايات', 'TrashIcon'),
('Electricity', 'كهرباء', 'LightningBoltIcon'),
('Traffic', 'سير', 'ExclamationTriangleIcon'),
('Environment', 'بيئة', 'LeafIcon'),
('Health', 'صحة', 'PlusCircledIcon')
ON CONFLICT (name_en) DO NOTHING;

-- Issues Table
CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    -- User input location (e.g., "Beirut, Hamra") - ALWAYS REQUIRED
    location_text TEXT NOT NULL,
    -- Precise coordinates for the map - OPTIONAL
    -- Best practice: Use DOUBLE PRECISION for simple lat/lng storage
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    status TEXT DEFAULT 'pending',
    image_url TEXT,
    video_url TEXT,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments Table
CREATE TABLE IF NOT EXISTS issue_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upvotes Table (to track unique upvotes)
CREATE TABLE IF NOT EXISTS issue_upvotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(issue_id, user_id)
);

