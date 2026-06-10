// Columns of `profiles` that can be selected by authenticated/anon clients.
// Email and phone are intentionally excluded — they are restricted at the DB
// level (column-level GRANT) and must be fetched via the
// `get_user_contact` / `admin_list_contacts` RPCs by authorized users.
export const PROFILE_SAFE_COLUMNS =
  "id, user_id, role, full_name, location, bio, avatar_url, cv_url, cv_published, cv_education, cv_experience, cv_languages, skills, experience_years, company_name, company_website, company_description, created_at, updated_at";
