-- Dentist-specific RPC function to get filtered quotations for a specific clinic
-- This function combines the logic from get_filtered_quotations with the specific
-- filtering logic used by dentists to see only relevant quotations



  -- The logic now:
  -- 1. ✅ Shows quotations relevant to the dentist
  -- 2. ✅ Only shows bids from the dentist's clinic (via the main JOIN)
  -- 3. ✅ Excludes entire quotations if ANY bid from ANY clinic references deleted data
CREATE OR REPLACE FUNCTION get_dentist_quotations(
  p_clinic_id UUID,
  p_clinic_treatments UUID[],
  page_offset INTEGER DEFAULT 0,
  page_limit INTEGER DEFAULT 10,
  sort_field TEXT DEFAULT 'created_at',
  sort_direction TEXT DEFAULT 'desc'
)
RETURNS TABLE (
  -- Quotation fields
  id UUID,
  region TEXT,
  name TEXT,
  gender TEXT,
  birthdate TEXT,
  residence TEXT,
  concern TEXT,
  patient_id UUID,
  clinic_id UUID,
  treatment_id UUID,
  image_url TEXT[],
  status TEXT,
  created_at TIMESTAMPTZ,
  
  -- Treatment fields (prefixed with treatment_)
  treatment_name TEXT,
  treatment_image_url TEXT,
  treatment_status TEXT,
  
  -- Clinic fields (prefixed with clinic_)
  clinic_name TEXT,
  clinic_status TEXT,
  
  -- Bid count
  bid_count BIGINT,
  
  -- Bid fields
  bid_id UUID,
  bid_expected_price_min DOUBLE PRECISION,
  bid_expected_price_max DOUBLE PRECISION,
  bid_additional_explanation TEXT,
  bid_recommend_quick_visit BOOLEAN,
  bid_status TEXT,
  bid_created_at TIMESTAMPTZ,
  bid_clinic_treatment_id UUID,
  
  -- Total count for pagination
  total_count BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Quotation fields
    q.id,
    q.region,
    q.name,
    q.gender,
    q.birthdate::text,
    q.residence,
    q.concern,
    q.patient_id,
    q.clinic_id,
    q.treatment_id,
    q.image_url,
    q.status::text,
    q.created_at,
    
    -- Treatment fields
    t.treatment_name::text,
    t.image_url::text as treatment_image_url,
    t.status::text as treatment_status,
    
    -- Clinic fields
    c.clinic_name::text,
    c.status::text as clinic_status,
    
    -- Bid count
    COALESCE(bid_counts.bid_count, 0) as bid_count,
    
    -- Bid fields
    b.id as bid_id,
    b.expected_price_min as bid_expected_price_min,
    b.expected_price_max as bid_expected_price_max,
    b.additional_explanation as bid_additional_explanation,
    b.recommend_quick_visit as bid_recommend_quick_visit,
    b.status::text as bid_status,
    b.created_at as bid_created_at,
    b.clinic_treatment_id as bid_clinic_treatment_id,
    
    -- Total count for pagination
    COUNT(*) OVER() as total_count
    
  FROM quotation q
  LEFT JOIN treatment t ON q.treatment_id = t.id
  LEFT JOIN clinic c ON q.clinic_id = c.id
  LEFT JOIN clinic_treatment ct ON (
    q.clinic_id = ct.clinic_id AND 
    q.treatment_id = ct.treatment_id
  )
  LEFT JOIN bid b ON q.id = b.quotation_id 
    AND EXISTS (
      SELECT 1 FROM clinic_treatment ct 
      WHERE ct.id = b.clinic_treatment_id 
      AND ct.clinic_id = p_clinic_id
    )
  LEFT JOIN clinic_treatment bid_ct ON b.clinic_treatment_id = bid_ct.id
  LEFT JOIN (
    -- Subquery to get bid counts for each quotation (only for this clinic)
    SELECT b.quotation_id, COUNT(*) as bid_count
    FROM bid b
    LEFT JOIN clinic_treatment ct ON b.clinic_treatment_id = ct.id
    WHERE ct.clinic_id = p_clinic_id
    GROUP BY b.quotation_id
  ) bid_counts ON q.id = bid_counts.quotation_id
  
  WHERE 
    -- Base business logic filters
    
    -- 1. Only active quotations
    q.status::text = 'active'
    
    -- 2. Filter out quotations with deleted/inactive treatments
    AND (q.treatment_id IS NULL OR (t.id IS NOT NULL AND t.status::text = 'active'))
    
    -- 3. Filter out quotations with inactive clinics
    AND (q.clinic_id IS NULL OR (c.id IS NOT NULL AND c.status::text = 'active'))
    
    -- 4. For quotations with both clinic and treatment, verify clinic still offers that treatment
    AND (
      q.clinic_id IS NULL OR 
      q.treatment_id IS NULL OR 
      (ct.treatment_id IS NOT NULL AND ct.status::text = 'active')
    )
    
    -- Dentist-specific filters (from fetchQuotations logic)
    
    
    -- 6. Clinic-specific quotation visibility logic
    -- Include quotations that are either:
    --   Private to this clinic, OR
    --   Public with no treatment, OR  
    --   Public with treatment matching clinic's treatments
    AND (
      q.clinic_id = p_clinic_id OR
      (q.clinic_id IS NULL AND q.treatment_id IS NULL) OR
      (q.clinic_id IS NULL AND 
       p_clinic_treatments IS NOT NULL AND 
       array_length(p_clinic_treatments, 1) > 0 AND 
       q.treatment_id = ANY(p_clinic_treatments))
    )
    
    -- 7. Exclude quotations that have ANY bid with deleted clinic_treatments or treatments
    -- Check ALL bids from ALL clinics, not just this clinic
    AND NOT EXISTS (
      SELECT 1 FROM bid bid_check
      LEFT JOIN clinic_treatment ct_check ON bid_check.clinic_treatment_id = ct_check.id
      LEFT JOIN treatment t_check ON ct_check.treatment_id = t_check.id
      WHERE bid_check.quotation_id = q.id
      AND (ct_check.status != 'active' OR t_check.status != 'active')
    )
    
  ORDER BY 
    -- Dynamic sorting based on parameters
    CASE 
      WHEN sort_field = 'created_at' AND sort_direction = 'desc' THEN q.created_at 
    END DESC,
    CASE 
      WHEN sort_field = 'created_at' AND sort_direction = 'asc' THEN q.created_at 
    END ASC,
    CASE 
      WHEN sort_field = 'name' AND sort_direction = 'desc' THEN q.name 
    END DESC,
    CASE 
      WHEN sort_field = 'name' AND sort_direction = 'asc' THEN q.name 
    END ASC,
    CASE 
      WHEN sort_field = 'status' AND sort_direction = 'desc' THEN q.status 
    END DESC,
    CASE 
      WHEN sort_field = 'status' AND sort_direction = 'asc' THEN q.status 
    END ASC
    
  OFFSET page_offset
  LIMIT page_limit;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_dentist_quotations TO authenticated;

-- Example usage:
-- SELECT * FROM get_dentist_quotations(
--   'clinic-uuid'::uuid, 
--   'Seoul, South Korea', 
--   ARRAY['treatment1-uuid'::uuid, 'treatment2-uuid'::uuid], 
--   0, 10, 'created_at', 'desc'
-- );