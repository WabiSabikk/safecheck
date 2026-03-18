-- System checklist templates
INSERT INTO checklist_templates (name, checklist_type, is_system, scheduled_time, overdue_after_minutes, items) VALUES
(
  'Opening Checklist — Full Service',
  'opening',
  TRUE,
  '06:00',
  180,
  '[
    {"id": "op-1", "category": "Temperature", "description": "Check all refrigerator temperatures (must be 41°F or below)", "is_required": true, "position": 0},
    {"id": "op-2", "category": "Temperature", "description": "Check all freezer temperatures (must be 0°F or below)", "is_required": true, "position": 1},
    {"id": "op-3", "category": "Temperature", "description": "Check hot holding equipment temperatures (must be 135°F or above)", "is_required": false, "position": 2},
    {"id": "op-4", "category": "Sanitation", "description": "Verify sanitizer solution concentration (chlorine 50-100 ppm)", "is_required": true, "position": 3},
    {"id": "op-5", "category": "Sanitation", "description": "Check handwashing stations — soap, paper towels, warm water", "is_required": true, "position": 4},
    {"id": "op-6", "category": "Sanitation", "description": "Inspect prep surfaces — clean and sanitized", "is_required": true, "position": 5},
    {"id": "op-7", "category": "Food Storage", "description": "Check date labels on all prepped food items", "is_required": true, "position": 6},
    {"id": "op-8", "category": "Food Storage", "description": "Verify FIFO rotation in walk-in and reach-ins", "is_required": true, "position": 7},
    {"id": "op-9", "category": "Food Storage", "description": "Check for expired items — discard if found", "is_required": true, "position": 8},
    {"id": "op-10", "category": "Staff", "description": "Verify all staff have clean uniforms and hair restraints", "is_required": false, "position": 9},
    {"id": "op-11", "category": "Staff", "description": "Ask staff about illness symptoms (vomiting, diarrhea, jaundice)", "is_required": true, "position": 10},
    {"id": "op-12", "category": "Facility", "description": "Check pest traps — no signs of infestation", "is_required": false, "position": 11},
    {"id": "op-13", "category": "Facility", "description": "Verify trash cans are empty and lined", "is_required": false, "position": 12},
    {"id": "op-14", "category": "Equipment", "description": "Verify thermometer calibration (ice water = 32°F ± 2°F)", "is_required": false, "position": 13}
  ]'::jsonb
),
(
  'Closing Checklist — Full Service',
  'closing',
  TRUE,
  '22:00',
  120,
  '[
    {"id": "cl-1", "category": "Temperature", "description": "Final temperature check — all refrigerators and freezers", "is_required": true, "position": 0},
    {"id": "cl-2", "category": "Cleaning", "description": "Clean and sanitize all prep surfaces and cutting boards", "is_required": true, "position": 1},
    {"id": "cl-3", "category": "Cleaning", "description": "Clean and sanitize all cooking equipment (grills, fryers, ovens)", "is_required": true, "position": 2},
    {"id": "cl-4", "category": "Cleaning", "description": "Sweep and mop all kitchen floors", "is_required": true, "position": 3},
    {"id": "cl-5", "category": "Cleaning", "description": "Clean grease traps and floor drains", "is_required": false, "position": 4},
    {"id": "cl-6", "category": "Food Storage", "description": "Label and date all prepped food", "is_required": true, "position": 5},
    {"id": "cl-7", "category": "Food Storage", "description": "Properly store or discard all leftover food", "is_required": true, "position": 6},
    {"id": "cl-8", "category": "Food Storage", "description": "Verify cooling procedures for hot food (135°F to 70°F in 2 hrs)", "is_required": true, "position": 7},
    {"id": "cl-9", "category": "Waste", "description": "Empty all trash and recycling bins", "is_required": true, "position": 8},
    {"id": "cl-10", "category": "Waste", "description": "Clean dumpster area", "is_required": false, "position": 9},
    {"id": "cl-11", "category": "Security", "description": "Turn off all cooking equipment", "is_required": true, "position": 10},
    {"id": "cl-12", "category": "Security", "description": "Lock all doors and set alarm", "is_required": true, "position": 11}
  ]'::jsonb
);
