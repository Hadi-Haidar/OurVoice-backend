// hon 3am nload el .env variables
// ya3ne SUPABASE_URL w SERVICE_ROLE_KEY bysiro available
require('dotenv').config();

// nimport supabase sdk
const { createClient } = require('@supabase/supabase-js');


// hon safety check
// iza nsina nhot values bel .env
// app bywa2ef direct instead of random crash ba3den
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
        "Missing Supabase configuration. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
}


// hon 3am n3mel admin supabase client
// mnst3mel SERVICE_ROLE_KEY la2eno backend server
// fa fina netkhata RLS iza badna
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            // ma badna auto token refresh
            // hay useful bel frontend bas mesh bel backend
            autoRefreshToken: false,

            // ma badna sessions yentakhzano bel server memory
            // kel request bykoon independent
            persistSession: false
        }
    }
);


// hon mnfreeze el object
// la ma hada ghalatan yghayer el client mn file tene
module.exports = Object.freeze({
    supabaseAdmin,
});
