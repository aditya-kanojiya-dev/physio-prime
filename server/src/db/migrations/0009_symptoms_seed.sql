-- Seed: Categories (10)
-- Run after base schema migration

-- A. Categories
INSERT INTO categories (title, slug, description, image, color, conditions, sort_order, active)
VALUES
  ('Musculoskeletal / Orthopedic', 'musculoskeletal-orthopedic', 'Expert treatment for bone, joint, and muscle conditions including back pain, arthritis, and postural disorders.', '/images/categories/musculoskeletal-orthopedic.jpg', '#2563EB', '["Back Pain (Upper, Lower/Lumbar, Chronic)", "Neck Pain / Cervical Spondylosis", "Slip Disc / Herniated Disc (Cervical & Lumbar)", "Sciatica", "Frozen Shoulder (Adhesive Capsulitis)", "Shoulder Pain / Rotator Cuff Injury", "Tennis Elbow (Lateral Epicondylitis)", "Golfer''s Elbow (Medial Epicondylitis)", "Wrist Pain / Carpal Tunnel Syndrome", "Knee Pain", "Osteoarthritis (Knee, Hip, Hand)", "Rheumatoid Arthritis", "Hip Pain / Hip Impingement", "Ankle Sprain", "Plantar Fasciitis / Heel Pain", "Foot Pain / Flat Feet", "Scoliosis / Postural Deformities", "Spondylolisthesis", "Ankylosing Spondylitis", "Osteoporosis Management", "Fibromyalgia", "Myofascial Pain Syndrome", "Muscle Strain / Ligament Tear", "Tendinitis / Tendinopathy", "Joint Stiffness", "Postural Pain (Tech Neck, Forward Head Posture)"]'::jsonb, 1, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (title, slug, description, image, color, conditions, sort_order, active)
VALUES
  ('Post-Surgical Rehabilitation', 'post-surgical-rehabilitation', 'Structured recovery programs after surgery, fractures, and injuries to restore strength and movement.', '/images/categories/post-surgical-rehabilitation.jpg', '#7C3AED', '["Post-Fracture Rehabilitation", "Post Knee Replacement (TKR) Rehab", "Post Hip Replacement (THR) Rehab", "ACL/PCL Reconstruction Rehab", "Post Spinal Surgery Rehab", "Post Shoulder Surgery Rehab", "Ligament/Tendon Repair Rehab", "Amputee/Prosthetic Rehabilitation", "Road Traffic Accident (RTA) Injury Recovery"]'::jsonb, 2, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (title, slug, description, image, color, conditions, sort_order, active)
VALUES
  ('Sports Injuries', 'sports-injuries', 'Specialized rehabilitation for athletes and sports enthusiasts to return to peak performance.', '/images/categories/sports-injuries.jpg', '#DC2626', '["Muscle Pulls & Strains", "Ligament Sprains (ACL, MCL, Ankle)", "Meniscus Tear", "Shin Splints", "Runner''s Knee", "Rotator Cuff Strain", "Stress Fractures", "Sports-Specific Return-to-Play Rehabilitation"]'::jsonb, 3, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (title, slug, description, image, color, conditions, sort_order, active)
VALUES
  ('Neurological Conditions', 'neurological-conditions', 'Comprehensive care for stroke, paralysis, Parkinson''s, vertigo, and other neurological conditions.', '/images/categories/neurological-conditions.jpg', '#0891B2', '["Stroke (CVA) Rehabilitation", "Paralysis (Hemiplegia/Paraplegia)", "Parkinson''s Disease", "Multiple Sclerosis", "Bell''s Palsy (Facial Palsy)", "Cerebral Palsy", "Spinal Cord Injury", "Peripheral Neuropathy", "Guillain-Barré Syndrome", "Vertigo / BPPV (Vestibular Rehabilitation)", "Balance & Coordination Disorders", "Nerve Compression / Radiculopathy"]'::jsonb, 4, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (title, slug, description, image, color, conditions, sort_order, active)
VALUES
  ('Pediatric Conditions', 'pediatric-conditions', 'Gentle, play-based therapy for children with developmental delays, cerebral palsy, and motor disorders.', '/images/categories/pediatric-conditions.jpg', '#EA580C', '["Developmental Delay", "Cerebral Palsy (Children)", "Torticollis", "Clubfoot Post-Correction Therapy", "Down Syndrome — Motor Development Therapy", "Muscular Dystrophy"]'::jsonb, 5, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (title, slug, description, image, color, conditions, sort_order, active)
VALUES
  ('Women''s Health', 'womens-health', 'Specialized physiotherapy for pregnancy, postpartum recovery, pelvic floor dysfunction, and women''s health.', '/images/categories/womens-health.jpg', '#DB2777', '["Pre- and Post-Natal (Pregnancy) Back Pain", "Postpartum Recovery / Diastasis Recti", "Pelvic Floor Dysfunction", "Urinary Incontinence", "Pelvic Pain"]'::jsonb, 6, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (title, slug, description, image, color, conditions, sort_order, active)
VALUES
  ('Geriatric Care', 'geriatric-care', 'Mobility and strength programs designed for age-related conditions, fall prevention, and post-hospitalization recovery.', '/images/categories/geriatric-care.jpg', '#65A30D', '["Age-Related Mobility Decline", "Fall-Risk & Balance Training", "Osteoporosis-Related Fragility", "General Deconditioning / Weakness", "Post-Hospitalization Recovery"]'::jsonb, 7, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (title, slug, description, image, color, conditions, sort_order, active)
VALUES
  ('Cardio-Respiratory', 'cardio-respiratory', 'Breathing exercises, cardiac rehab, and pulmonary therapy for heart and lung conditions.', '/images/categories/cardio-respiratory.jpg', '#E11D48', '["Post-Cardiac Surgery Rehabilitation (Cardiac Rehab)", "COPD (Chronic Obstructive Pulmonary Disease)", "Asthma — Breathing Exercises", "Post-COVID Pulmonary Rehabilitation", "Chest Physiotherapy (Secretion Clearance)"]'::jsonb, 8, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (title, slug, description, image, color, conditions, sort_order, active)
VALUES
  ('Chronic Pain & Lifestyle', 'chronic-pain-lifestyle', 'Long-term pain management for chronic conditions, migraines, and lifestyle-related musculoskeletal issues.', '/images/categories/chronic-pain-lifestyle.jpg', '#9333EA', '["Chronic Lower Back Pain", "Migraine/Tension Headache (Posture-Related)", "Sedentary Lifestyle-Related Stiffness", "Obesity-Related Joint Pain", "Diabetic Neuropathy-Related Mobility Issues", "Repetitive Strain Injury (RSI) from Desk Work"]'::jsonb, 9, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (title, slug, description, image, color, conditions, sort_order, active)
VALUES
  ('Therapy Techniques', 'therapy-techniques', 'Advanced therapeutic techniques including dry needling, cupping, shockwave therapy, and vestibular rehabilitation.', '/images/categories/therapy-techniques.jpg', '#0D9488', '["Manual Therapy / Manipulation", "Dry Needling", "Cupping Therapy", "Electrotherapy (IFT, TENS, Ultrasound Therapy)", "Kinesiology Taping", "Traction Therapy (Cervical/Lumbar)", "Shockwave Therapy", "Laser Therapy (LASER/LLLT)", "Exercise Therapy / Strengthening Programs", "Postural Correction Therapy", "Vestibular Rehabilitation", "Sports Taping", "Cryotherapy / Heat Therapy"]'::jsonb, 10, true)
ON CONFLICT (slug) DO NOTHING;


-- Seed: Symptoms (95)
-- Run after categories seed

-- A. Musculoskeletal / Orthopedic

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Back Pain (Upper, Lower/Lumbar, Chronic)', 'back-pain', 'Pain along the spine caused by muscle strain, poor posture, disc issues, or prolonged sitting/standing.',
'Dull or sharp pain in upper/lower back; Stiffness on waking; Pain worsening with bending or sitting long hours; Muscle spasm',
'Postural correction, core-strengthening exercises, manual therapy, heat/electrotherapy, ergonomic advice, stretching program.', '["Musculoskeletal / Orthopedic"]'::jsonb, '4-8 weeks', '/images/symptoms/back-pain.jpg', 1, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Neck Pain / Cervical Spondylosis', 'neck-pain-cervical-spondylosis', 'Wear-and-tear or strain affecting the cervical (neck) spine, common with age or desk-bound work.',
'Neck stiffness; Pain radiating to shoulders/arms; Headaches; Reduced neck rotation; Tingling in hands',
'Cervical traction, manual mobilization, neck-strengthening exercises, posture retraining, heat therapy.', '["Musculoskeletal / Orthopedic"]'::jsonb, '4-6 weeks', '/images/symptoms/neck-pain-cervical-spondylosis.jpg', 2, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Slip Disc / Herniated Disc (Cervical & Lumbar)', 'slip-disc-herniated-disc', 'The soft cushion between spinal vertebrae bulges or ruptures, pressing on nearby nerves.',
'Sharp localized pain; Radiating pain (arm or leg); Numbness; Tingling; Muscle weakness',
'McKenzie exercises, traction therapy, core stabilization, nerve-gliding exercises, pain-relief electrotherapy; surgical referral if red flags present.', '["Musculoskeletal / Orthopedic"]'::jsonb, '6-12 weeks', '/images/symptoms/slip-disc-herniated-disc.jpg', 3, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Sciatica', 'sciatica', 'Irritation or compression of the sciatic nerve, usually from a disc issue or piriformis tightness.',
'Shooting pain from lower back through hip and down the leg; Numbness; Tingling; Worse on sitting',
'Nerve mobilization, stretching (piriformis, hamstrings), core strengthening, postural correction, heat/cold therapy.', '["Musculoskeletal / Orthopedic"]'::jsonb, '4-8 weeks', '/images/symptoms/sciatica.jpg', 4, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Frozen Shoulder (Adhesive Capsulitis)', 'frozen-shoulder', 'Progressive stiffening and thickening of the shoulder joint capsule, restricting movement.',
'Gradual shoulder pain; Severe stiffness; Difficulty raising arm; Night pain',
'Capsular stretching, mobilization techniques, pendulum exercises, ultrasound therapy, progressive range-of-motion program.', '["Musculoskeletal / Orthopedic"]'::jsonb, '8-16 weeks', '/images/symptoms/frozen-shoulder.jpg', 5, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Shoulder Pain / Rotator Cuff Injury', 'shoulder-pain-rotator-cuff', 'Damage or inflammation of the muscles/tendons stabilizing the shoulder joint.',
'Pain with overhead activity; Weakness lifting arm; Clicking sound; Night pain',
'Rotator cuff strengthening, scapular stabilization exercises, manual therapy, activity modification.', '["Musculoskeletal / Orthopedic"]'::jsonb, '4-8 weeks', '/images/symptoms/shoulder-pain-rotator-cuff.jpg', 6, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Tennis Elbow (Lateral Epicondylitis)', 'tennis-elbow', 'Inflammation of tendons on the outer elbow from repetitive wrist/arm strain.',
'Pain on outer elbow; Weak grip; Pain gripping or lifting objects',
'Eccentric strengthening exercises, forearm stretching, bracing, ultrasound/laser therapy.', '["Musculoskeletal / Orthopedic"]'::jsonb, '4-8 weeks', '/images/symptoms/tennis-elbow.jpg', 7, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Golfer''s Elbow (Medial Epicondylitis)', 'golfers-elbow', 'Inflammation of tendons on the inner elbow, similar mechanism to tennis elbow but on the opposite side.',
'Inner elbow pain; Weak grip strength; Pain with wrist flexion',
'Stretching and strengthening of forearm flexors, activity modification, taping, manual therapy.', '["Musculoskeletal / Orthopedic"]'::jsonb, '4-8 weeks', '/images/symptoms/golfers-elbow.jpg', 8, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Wrist Pain / Carpal Tunnel Syndrome', 'wrist-pain-carpal-tunnel', 'Compression of the median nerve at the wrist, often from repetitive strain.',
'Numbness/tingling in thumb-index-middle fingers; Weak grip; Night-time symptoms',
'Nerve gliding exercises, wrist splinting, ergonomic correction, ultrasound therapy.', '["Musculoskeletal / Orthopedic"]'::jsonb, '4-6 weeks', '/images/symptoms/wrist-pain-carpal-tunnel.jpg', 9, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Knee Pain', 'knee-pain', 'Pain due to ligament strain, cartilage wear, or overuse around the knee joint.',
'Pain on walking/climbing stairs; Swelling; Stiffness; Instability',
'Quadriceps/hamstring strengthening, taping, gait training, manual therapy.', '["Musculoskeletal / Orthopedic"]'::jsonb, '4-8 weeks', '/images/symptoms/knee-pain.jpg', 10, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Osteoarthritis (Knee, Hip, Hand)', 'osteoarthritis', 'Degeneration of joint cartilage leading to bone-on-bone friction, common with aging.',
'Joint pain; Stiffness (especially morning); Swelling; Reduced range of motion; Crepitus',
'Low-impact strengthening, range-of-motion exercises, joint protection education, weight-management guidance, pain-relief modalities.', '["Musculoskeletal / Orthopedic"]'::jsonb, 'Ongoing management', '/images/symptoms/osteoarthritis.jpg', 11, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Rheumatoid Arthritis', 'rheumatoid-arthritis', 'An autoimmune condition causing chronic joint inflammation.',
'Symmetrical joint pain and swelling; Morning stiffness lasting over an hour; Fatigue',
'Gentle range-of-motion exercises, joint protection techniques, splinting, pain management (in coordination with rheumatologist).', '["Musculoskeletal / Orthopedic"]'::jsonb, 'Ongoing management', '/images/symptoms/rheumatoid-arthritis.jpg', 12, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Hip Pain / Hip Impingement', 'hip-pain-hip-impingement', 'Abnormal contact between hip bones causing pain and restricted movement.',
'Groin pain; Stiffness; Pain with prolonged sitting or deep hip flexion',
'Hip mobility exercises, glute strengthening, movement pattern correction, manual therapy.', '["Musculoskeletal / Orthopedic"]'::jsonb, '4-8 weeks', '/images/symptoms/hip-pain-hip-impingement.jpg', 13, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Ankle Sprain', 'ankle-sprain', 'Stretching or tearing of ligaments around the ankle, usually from a twisting injury.',
'Swelling; Bruising; Pain on weight-bearing; Instability',
'RICE protocol initially, balance/proprioception training, progressive strengthening, taping.', '["Musculoskeletal / Orthopedic"]'::jsonb, '2-6 weeks', '/images/symptoms/ankle-sprain.jpg', 14, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Plantar Fasciitis / Heel Pain', 'plantar-fasciitis-heel-pain', 'Inflammation of the plantar fascia (tissue band along the sole of the foot).',
'Sharp heel pain; Worst with first steps in the morning; Pain after prolonged standing',
'Calf and plantar fascia stretching, foot strengthening, taping, footwear advice, night splints.', '["Musculoskeletal / Orthopedic"]'::jsonb, '4-8 weeks', '/images/symptoms/plantar-fasciitis-heel-pain.jpg', 15, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Foot Pain / Flat Feet', 'foot-pain-flat-feet', 'Pain related to arch collapse or abnormal foot mechanics.',
'Foot fatigue; Arch pain; Pain radiating to ankle/knee; Uneven shoe wear',
'Arch-strengthening exercises, orthotic advice, gait correction, stretching program.', '["Musculoskeletal / Orthopedic"]'::jsonb, '4-6 weeks', '/images/symptoms/foot-pain-flat-feet.jpg', 16, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Scoliosis / Postural Deformities', 'scoliosis-postural-deformities', 'Abnormal curvature or alignment of the spine.',
'Visible spinal curve; Uneven shoulders/hips; Back pain; Fatigue with prolonged standing',
'Scoliosis-specific exercises (e.g., Schroth method), postural correction, core strengthening, bracing guidance where needed.', '["Musculoskeletal / Orthopedic"]'::jsonb, 'Ongoing management', '/images/symptoms/scoliosis-postural-deformities.jpg', 17, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Spondylolisthesis', 'spondylolisthesis', 'Forward slippage of one vertebra over another.',
'Lower back pain; Tight hamstrings; Pain radiating to legs; Worsened by standing/walking',
'Core stabilization, flexion-based exercises, activity modification, bracing when indicated.', '["Musculoskeletal / Orthopedic"]'::jsonb, '6-12 weeks', '/images/symptoms/spondylolisthesis.jpg', 18, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Ankylosing Spondylitis', 'ankylosing-spondylitis', 'A chronic inflammatory condition affecting the spine and sacroiliac joints.',
'Progressive stiffness; Lower back/hip pain worse at night and in the morning; Reduced spinal flexibility',
'Spinal mobility exercises, deep breathing exercises, postural training, regular stretching routine.', '["Musculoskeletal / Orthopedic"]'::jsonb, 'Ongoing management', '/images/symptoms/ankylosing-spondylitis.jpg', 19, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Osteoporosis Management', 'osteoporosis-management', 'Reduced bone density making bones fragile and prone to fracture.',
'Often asymptomatic until a fracture occurs; May include back pain or loss of height',
'Weight-bearing exercises, balance training to prevent falls, posture correction, safe strengthening program.', '["Musculoskeletal / Orthopedic"]'::jsonb, 'Ongoing management', '/images/symptoms/osteoporosis-management.jpg', 20, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Fibromyalgia', 'fibromyalgia', 'A chronic condition causing widespread musculoskeletal pain and tenderness.',
'Widespread pain; Fatigue; Sleep disturbance; Tender points; Brain fog',
'Graded aerobic exercise, gentle stretching, relaxation techniques, pain education, hydrotherapy.', '["Musculoskeletal / Orthopedic"]'::jsonb, 'Ongoing management', '/images/symptoms/fibromyalgia.jpg', 21, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Myofascial Pain Syndrome', 'myofascial-pain-syndrome', 'Chronic pain from trigger points within tight muscle bands.',
'Localized deep muscle pain; Referred pain patterns; Palpable knots',
'Trigger-point release, dry needling, stretching, myofascial release techniques.', '["Musculoskeletal / Orthopedic"]'::jsonb, '4-8 weeks', '/images/symptoms/myofascial-pain-syndrome.jpg', 22, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Muscle Strain / Ligament Tear', 'muscle-strain-ligament-tear', 'Overstretching or tearing of muscle fibers or ligaments.',
'Sudden pain; Swelling; Bruising; Reduced strength/movement',
'RICE protocol, progressive loading exercises, manual therapy, return-to-activity program.', '["Musculoskeletal / Orthopedic"]'::jsonb, '2-6 weeks', '/images/symptoms/muscle-strain-ligament-tear.jpg', 23, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Tendinitis / Tendinopathy', 'tendinitis-tendinopathy', 'Inflammation or degeneration of a tendon from overuse.',
'Localized pain with movement; Tenderness; Swelling; Stiffness',
'Eccentric loading exercises, activity modification, ultrasound/shockwave therapy.', '["Musculoskeletal / Orthopedic"]'::jsonb, '4-8 weeks', '/images/symptoms/tendinitis-tendinopathy.jpg', 24, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Joint Stiffness', 'joint-stiffness', 'Reduced range of motion in a joint from disuse, injury, or arthritis.',
'Difficulty moving the joint fully; Tightness; Discomfort with movement',
'Range-of-motion exercises, joint mobilization, stretching program.', '["Musculoskeletal / Orthopedic"]'::jsonb, '2-6 weeks', '/images/symptoms/joint-stiffness.jpg', 25, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Postural Pain (Tech Neck, Forward Head Posture)', 'postural-pain-tech-neck', 'Musculoskeletal strain from prolonged poor posture, especially from screen use.',
'Neck/upper back pain; Headaches; Rounded shoulders; Fatigue',
'Postural correction exercises, ergonomic workstation advice, strengthening of neck/upper back muscles.', '["Musculoskeletal / Orthopedic"]'::jsonb, '4-6 weeks', '/images/symptoms/postural-pain-tech-neck.jpg', 26, true)
ON CONFLICT (slug) DO NOTHING;


-- B. Post-Surgical Rehabilitation

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Post-Fracture Rehabilitation', 'post-fracture-rehabilitation', 'Recovery program after a bone fracture heals, to restore strength and movement.',
'Joint stiffness; Muscle wasting; Reduced mobility after cast/immobilization removal',
'Gradual range-of-motion exercises, strengthening, functional training, scar mobilization if surgical.', '["Post-Surgical Rehabilitation"]'::jsonb, '6-12 weeks', '/images/symptoms/post-fracture-rehabilitation.jpg', 27, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Post Knee Replacement (TKR) Rehab', 'post-knee-replacement-rehab', 'Structured recovery program following total knee replacement surgery.',
'Swelling; Stiffness; Reduced knee bend; Weak quadriceps',
'Early mobilization, range-of-motion exercises, quadriceps strengthening, gait training, swelling management.', '["Post-Surgical Rehabilitation"]'::jsonb, '8-12 weeks', '/images/symptoms/post-knee-replacement-rehab.jpg', 28, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Post Hip Replacement (THR) Rehab', 'post-hip-replacement-rehab', 'Recovery program following total hip replacement surgery.',
'Weakness; Limited hip movement; Altered gait; Precautions on certain movements',
'Hip precautions education, progressive strengthening, gait retraining, balance exercises.', '["Post-Surgical Rehabilitation"]'::jsonb, '8-12 weeks', '/images/symptoms/post-hip-replacement-rehab.jpg', 29, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('ACL/PCL Reconstruction Rehab', 'acl-pcl-reconstruction-rehab', 'Structured rehabilitation following knee ligament reconstruction surgery.',
'Swelling; Instability; Muscle weakness; Reduced confidence in knee',
'Phase-wise strengthening, proprioception training, sport-specific drills, return-to-sport testing.', '["Post-Surgical Rehabilitation"]'::jsonb, '9-12 months', '/images/symptoms/acl-pcl-reconstruction-rehab.jpg', 30, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Post Spinal Surgery Rehab', 'post-spinal-surgery-rehab', 'Recovery therapy after spinal procedures (discectomy, fusion, laminectomy, etc.).',
'Weakness; Stiffness; Movement fear; Residual nerve symptoms',
'Gentle core activation, gradual mobility exercises, posture and body-mechanics education.', '["Post-Surgical Rehabilitation"]'::jsonb, '8-16 weeks', '/images/symptoms/post-spinal-surgery-rehab.jpg', 31, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Post Shoulder Surgery Rehab', 'post-shoulder-surgery-rehab', 'Recovery therapy following shoulder surgery (rotator cuff repair, labral repair, etc.).',
'Stiffness; Weakness; Limited range of motion during recovery phases',
'Passive-to-active range-of-motion progression, strengthening phases, scapular control exercises.', '["Post-Surgical Rehabilitation"]'::jsonb, '8-16 weeks', '/images/symptoms/post-shoulder-surgery-rehab.jpg', 32, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Ligament/Tendon Repair Rehab', 'ligament-tendon-repair-rehab', 'Rehabilitation after surgical repair of a torn ligament or tendon.',
'Stiffness; Weakness; Swelling during healing phases',
'Protected mobilization, progressive loading, functional strengthening.', '["Post-Surgical Rehabilitation"]'::jsonb, '6-12 weeks', '/images/symptoms/ligament-tendon-repair-rehab.jpg', 33, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Amputee/Prosthetic Rehabilitation', 'amputee-prosthetic-rehabilitation', 'Therapy to help patients adapt to life and mobility with a prosthetic limb.',
'Balance difficulty; Phantom limb sensation; Gait abnormalities; Muscle weakness',
'Prosthetic training, gait re-education, balance and strength training, desensitization techniques.', '["Post-Surgical Rehabilitation"]'::jsonb, '3-6 months', '/images/symptoms/amputee-prosthetic-rehabilitation.jpg', 34, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Road Traffic Accident (RTA) Injury Recovery', 'rta-injury-recovery', 'Rehabilitation following trauma sustained in vehicular accidents.',
'Multiple injuries; Pain; Stiffness; Reduced function; Sometimes whiplash',
'Individualized multi-injury rehab plan, pain management, progressive mobility and strength restoration.', '["Post-Surgical Rehabilitation"]'::jsonb, '8-16 weeks', '/images/symptoms/rta-injury-recovery.jpg', 35, true)
ON CONFLICT (slug) DO NOTHING;


-- C. Sports Injuries

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Muscle Pulls & Strains', 'muscle-pulls-strains', 'Overstretching of muscle fibers during physical activity.',
'Sudden pain; Tightness; Swelling; Reduced strength',
'RICE, progressive stretching and strengthening, return-to-play protocol.', '["Sports Injuries"]'::jsonb, '2-6 weeks', '/images/symptoms/muscle-pulls-strains.jpg', 36, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Ligament Sprains (ACL, MCL, Ankle)', 'ligament-sprains', 'Stretching or tearing of ligaments stabilizing a joint.',
'Swelling; Instability; Pain with movement; Bruising',
'Bracing, proprioception training, progressive strengthening, sport-specific rehab.', '["Sports Injuries"]'::jsonb, '4-12 weeks', '/images/symptoms/ligament-sprains.jpg', 37, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Meniscus Tear', 'meniscus-tear', 'Tear in the knee''s cartilage cushion, often from twisting movements.',
'Knee pain; Swelling; Locking or catching sensation; Limited range of motion',
'Strengthening exercises, range-of-motion work, activity modification; surgical referral if severe.', '["Sports Injuries"]'::jsonb, '6-12 weeks', '/images/symptoms/meniscus-tear.jpg', 38, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Shin Splints', 'shin-splints', 'Inflammation of muscles/tendons around the shinbone from repetitive stress.',
'Pain along the inner shin during/after activity; Tenderness; Mild swelling',
'Rest and load management, calf/shin stretching, strengthening, footwear/gait assessment.', '["Sports Injuries"]'::jsonb, '2-6 weeks', '/images/symptoms/shin-splints.jpg', 39, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Runner''''s Knee', 'runners-knee', 'Pain around the kneecap from overuse or poor tracking of the patella.',
'Dull ache around/behind kneecap; Worse with running, squatting, or stairs',
'Quadriceps and hip strengthening, patellar taping, gait analysis, stretching.', '["Sports Injuries"]'::jsonb, '4-6 weeks', '/images/symptoms/runners-knee.jpg', 40, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Rotator Cuff Strain', 'rotator-cuff-strain', 'Overstretching or minor tearing of shoulder rotator cuff muscles.',
'Shoulder pain with overhead movement; Weakness; Discomfort at rest',
'Rotator cuff and scapular strengthening, activity modification, manual therapy.', '["Sports Injuries"]'::jsonb, '4-8 weeks', '/images/symptoms/rotator-cuff-strain.jpg', 41, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Stress Fractures', 'stress-fractures', 'Small cracks in bone from repetitive impact or overuse.',
'Localized pain that worsens with activity; Tenderness; Mild swelling',
'Load management, gradual return-to-activity program, strengthening, footwear/biomechanics review.', '["Sports Injuries"]'::jsonb, '6-8 weeks', '/images/symptoms/stress-fractures.jpg', 42, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Sports-Specific Return-to-Play Rehabilitation', 'sports-return-to-play', 'A structured program to safely return an athlete to their sport after injury.',
'Residual weakness; Reduced confidence; Incomplete functional recovery',
'Sport-specific drills, agility and strength testing, gradual loading progression, performance testing before clearance.', '["Sports Injuries"]'::jsonb, '4-12 weeks', '/images/symptoms/sports-return-to-play.jpg', 43, true)
ON CONFLICT (slug) DO NOTHING;


-- D. Neurological Conditions

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Stroke (CVA) Rehabilitation', 'stroke-rehabilitation', 'Recovery therapy after a stroke affecting brain blood supply, causing motor/sensory deficits.',
'Weakness on one side; Speech difficulty; Balance problems; Coordination loss',
'Task-specific motor retraining, balance training, gait re-education, functional exercises.', '["Neurological Conditions"]'::jsonb, '3-12 months', '/images/symptoms/stroke-rehabilitation.jpg', 44, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Paralysis (Hemiplegia/Paraplegia)', 'paralysis-hemiplegia-paraplegia', 'Loss of muscle function/movement in part of the body due to neurological damage.',
'Weakness or complete loss of movement; Muscle stiffness/spasticity; Sensory changes',
'Neuro-facilitation techniques, strengthening of unaffected/affected muscles, mobility and transfer training.', '["Neurological Conditions"]'::jsonb, 'Ongoing management', '/images/symptoms/paralysis-hemiplegia-paraplegia.jpg', 45, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Parkinson''''s Disease', 'parkinsons-disease', 'A progressive neurological disorder affecting movement control.',
'Tremors; Muscle rigidity; Slow movement; Balance problems; Shuffling gait',
'Gait training, balance exercises, flexibility work, functional mobility training.', '["Neurological Conditions"]'::jsonb, 'Ongoing management', '/images/symptoms/parkinsons-disease.jpg', 46, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Multiple Sclerosis', 'multiple-sclerosis', 'An autoimmune condition affecting the central nervous system.',
'Fatigue; Muscle weakness; Balance issues; Numbness; Coordination difficulty',
'Energy conservation strategies, balance and strengthening exercises, stretching, fatigue-managed activity plans.', '["Neurological Conditions"]'::jsonb, 'Ongoing management', '/images/symptoms/multiple-sclerosis.jpg', 47, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Bell''''s Palsy (Facial Palsy)', 'bells-palsy-facial-palsy', 'Sudden weakness or paralysis of facial muscles, usually one-sided.',
'Drooping of one side of face; Difficulty closing eye; Altered facial expression',
'Facial exercises, neuromuscular re-education, massage, electrical stimulation.', '["Neurological Conditions"]'::jsonb, '4-8 weeks', '/images/symptoms/bells-palsy-facial-palsy.jpg', 48, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Cerebral Palsy', 'cerebral-palsy', 'A group of disorders affecting movement and posture due to early brain development issues.',
'Muscle stiffness or floppiness; Poor coordination; Delayed motor milestones',
'Developmental therapy, stretching, strengthening, gait training, assistive device training.', '["Neurological Conditions"]'::jsonb, 'Ongoing management', '/images/symptoms/cerebral-palsy.jpg', 49, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Spinal Cord Injury', 'spinal-cord-injury', 'Damage to the spinal cord causing loss of function below the injury level.',
'Weakness or paralysis; Sensory loss; Muscle spasticity; Bladder/bowel changes',
'Mobility and transfer training, strengthening of functional muscles, wheelchair skills training, spasticity management.', '["Neurological Conditions"]'::jsonb, 'Ongoing management', '/images/symptoms/spinal-cord-injury.jpg', 50, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Peripheral Neuropathy', 'peripheral-neuropathy', 'Damage to peripheral nerves causing weakness and sensory changes, often in hands/feet.',
'Numbness; Tingling; Burning pain; Muscle weakness',
'Sensory re-education, balance training, strengthening exercises, gait aids as needed.', '["Neurological Conditions"]'::jsonb, 'Ongoing management', '/images/symptoms/peripheral-neuropathy.jpg', 51, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Guillain-Barré Syndrome', 'guillain-barre-syndrome', 'An autoimmune condition causing rapid-onset muscle weakness.',
'Progressive weakness; Tingling; Reduced reflexes; Fatigue',
'Gradual strengthening, respiratory exercises if needed, functional mobility retraining.', '["Neurological Conditions"]'::jsonb, '3-12 months', '/images/symptoms/guillain-barre-syndrome.jpg', 52, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Vertigo / BPPV (Vestibular Rehabilitation)', 'vertigo-bppv-vestibular-rehabilitation', 'Disorders of the inner ear causing dizziness and balance disturbance.',
'Spinning sensation; Imbalance; Nausea; Unsteady gait',
'Canalith repositioning maneuvers (e.g., Epley), vestibular adaptation exercises, balance training.', '["Neurological Conditions"]'::jsonb, '2-8 weeks', '/images/symptoms/vertigo-bppv-vestibular-rehabilitation.jpg', 53, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Balance & Coordination Disorders', 'balance-coordination-disorders', 'Impaired ability to maintain stability and coordinate movement, from various causes.',
'Frequent falls; Unsteadiness; Difficulty with coordinated movements',
'Balance training, proprioceptive exercises, strength and gait training.', '["Neurological Conditions"]'::jsonb, '4-12 weeks', '/images/symptoms/balance-coordination-disorders.jpg', 54, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Nerve Compression / Radiculopathy', 'nerve-compression-radiculopathy', 'Compression of a spinal nerve root causing pain along its distribution.',
'Radiating pain; Numbness; Tingling; Weakness in the affected limb',
'Nerve gliding exercises, traction, postural correction, strengthening.', '["Neurological Conditions"]'::jsonb, '4-8 weeks', '/images/symptoms/nerve-compression-radiculopathy.jpg', 55, true)
ON CONFLICT (slug) DO NOTHING;


-- E. Pediatric Conditions

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Developmental Delay', 'developmental-delay', 'Slower-than-typical achievement of motor milestones in children.',
'Delayed sitting/crawling/walking; Poor coordination for age',
'Play-based motor development therapy, strengthening, milestone-focused activities.', '["Pediatric Conditions"]'::jsonb, '3-12 months', '/images/symptoms/developmental-delay.jpg', 56, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Cerebral Palsy (Children)', 'cerebral-palsy-children', 'A movement and posture disorder from early brain development issues, managed early in childhood.',
'Abnormal muscle tone; Delayed milestones; Coordination difficulties',
'Early intervention therapy, stretching, functional movement training, family education.', '["Pediatric Conditions"]'::jsonb, 'Ongoing management', '/images/symptoms/cerebral-palsy-children.jpg', 57, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Torticollis', 'torticollis', 'Tightness of neck muscles causing the head to tilt to one side, common in infants.',
'Head tilt; Limited neck rotation; Asymmetrical head shape in infants',
'Stretching exercises, positioning techniques, strengthening of opposite-side muscles.', '["Pediatric Conditions"]'::jsonb, '3-6 months', '/images/symptoms/torticollis.jpg', 58, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Clubfoot Post-Correction Therapy', 'clubfoot-post-correction-therapy', 'Therapy following correction of a congenital foot deformity.',
'Residual stiffness; Weakness; Gait abnormality',
'Stretching, strengthening, gait training, bracing compliance support.', '["Pediatric Conditions"]'::jsonb, '6-12 months', '/images/symptoms/clubfoot-post-correction-therapy.jpg', 59, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Down Syndrome — Motor Development Therapy', 'down-syndrome-motor-development', 'Supportive therapy addressing low muscle tone and delayed motor development in children with Down syndrome.',
'Low muscle tone (hypotonia); Delayed milestones; Joint hypermobility',
'Strengthening exercises, balance and coordination training, milestone-focused developmental activities.', '["Pediatric Conditions"]'::jsonb, 'Ongoing management', '/images/symptoms/down-syndrome-motor-development.jpg', 60, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Muscular Dystrophy', 'muscular-dystrophy', 'A genetic disorder causing progressive muscle weakness.',
'Progressive weakness; Difficulty walking/climbing stairs; Frequent falls',
'Gentle strengthening, stretching to prevent contractures, mobility aids training, breathing exercises.', '["Pediatric Conditions"]'::jsonb, 'Ongoing management', '/images/symptoms/muscular-dystrophy.jpg', 61, true)
ON CONFLICT (slug) DO NOTHING;


-- F. Women''s Health

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Pre- and Post-Natal (Pregnancy) Back Pain', 'prenatal-postnatal-back-pain', 'Back pain arising from postural and hormonal changes during/after pregnancy.',
'Lower back/pelvic pain; Discomfort with prolonged standing or walking',
'Pregnancy-safe stretching and strengthening, postural correction, pelvic tilt exercises.', '["Women''s Health"]'::jsonb, '4-8 weeks', '/images/symptoms/prenatal-postnatal-back-pain.jpg', 62, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Postpartum Recovery / Diastasis Recti', 'postpartum-recovery-diastasis-recti', 'Separation of abdominal muscles after pregnancy/childbirth.',
'Abdominal bulge; Core weakness; Back pain',
'Core-rehabilitation exercises, safe abdominal strengthening progression, posture correction.', '["Women''s Health"]'::jsonb, '6-12 weeks', '/images/symptoms/postpartum-recovery-diastasis-recti.jpg', 63, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Pelvic Floor Dysfunction', 'pelvic-floor-dysfunction', 'Weakness or dysfunction of the pelvic floor muscles.',
'Pelvic heaviness; Discomfort; Urinary leakage; Pain during intercourse',
'Pelvic floor muscle training, biofeedback, relaxation techniques.', '["Women''s Health"]'::jsonb, '6-12 weeks', '/images/symptoms/pelvic-floor-dysfunction.jpg', 64, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Urinary Incontinence', 'urinary-incontinence', 'Involuntary leakage of urine, often linked to pelvic floor weakness.',
'Leakage with coughing/sneezing/exercise; Urgency',
'Pelvic floor strengthening (Kegel exercises), bladder training, biofeedback.', '["Women''s Health"]'::jsonb, '6-12 weeks', '/images/symptoms/urinary-incontinence.jpg', 65, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Pelvic Pain', 'pelvic-pain', 'Pain in the pelvic region from muscular, joint, or nerve-related causes.',
'Persistent or intermittent pelvic discomfort; Pain with movement or sitting',
'Manual therapy, pelvic floor relaxation/strengthening as indicated, postural correction.', '["Women''s Health"]'::jsonb, '4-8 weeks', '/images/symptoms/pelvic-pain.jpg', 66, true)
ON CONFLICT (slug) DO NOTHING;


-- G. Geriatric Care

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Age-Related Mobility Decline', 'age-related-mobility-decline', 'Gradual reduction in strength, flexibility, and mobility with aging.',
'Slower walking; Difficulty rising from chairs; Reduced endurance',
'Functional strengthening, flexibility exercises, endurance training.', '["Geriatric Care"]'::jsonb, 'Ongoing management', '/images/symptoms/age-related-mobility-decline.jpg', 67, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Fall-Risk & Balance Training', 'fall-risk-balance-training', 'Assessment and training to reduce the risk of falls in older adults.',
'Unsteady gait; History of falls; Reduced confidence in mobility',
'Balance exercises, strength training, gait aids assessment, home-safety education.', '["Geriatric Care"]'::jsonb, '4-8 weeks', '/images/symptoms/fall-risk-balance-training.jpg', 68, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Osteoporosis-Related Fragility', 'osteoporosis-related-fragility', 'Increased fracture risk due to reduced bone density.',
'Often silent; May include back pain or stooped posture',
'Weight-bearing and resistance exercises, balance training, posture education, fall-prevention strategies.', '["Geriatric Care"]'::jsonb, 'Ongoing management', '/images/symptoms/osteoporosis-related-fragility.jpg', 69, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('General Deconditioning / Weakness', 'general-deconditioning-weakness', 'Loss of strength and stamina from inactivity or prolonged illness.',
'Fatigue; Weakness; Reduced tolerance for daily activities',
'Graded exercise program, functional training, endurance building.', '["Geriatric Care"]'::jsonb, '4-8 weeks', '/images/symptoms/general-deconditioning-weakness.jpg', 70, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Post-Hospitalization Recovery', 'post-hospitalization-recovery', 'Rehabilitation to regain strength and independence after a hospital stay.',
'Weakness; Reduced mobility; Deconditioning',
'Progressive mobility and strengthening program, functional activity training.', '["Geriatric Care"]'::jsonb, '4-8 weeks', '/images/symptoms/post-hospitalization-recovery.jpg', 71, true)
ON CONFLICT (slug) DO NOTHING;


-- H. Cardio-Respiratory

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Post-Cardiac Surgery Rehabilitation (Cardiac Rehab)', 'cardiac-rehabilitation', 'Structured exercise and education program after heart surgery or a cardiac event.',
'Reduced stamina; Weakness; Anxiety about exertion',
'Graded aerobic exercise, breathing exercises, monitored strength training, lifestyle education.', '["Cardio-Respiratory"]'::jsonb, '8-12 weeks', '/images/symptoms/cardiac-rehabilitation.jpg', 72, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('COPD (Chronic Obstructive Pulmonary Disease)', 'copd', 'A progressive lung disease causing airflow limitation.',
'Breathlessness; Chronic cough; Fatigue; Reduced exercise tolerance',
'Pulmonary rehabilitation, breathing exercises, airway clearance techniques, graded exercise training.', '["Cardio-Respiratory"]'::jsonb, 'Ongoing management', '/images/symptoms/copd.jpg', 73, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Asthma — Breathing Exercises', 'asthma-breathing-exercises', 'A chronic condition causing airway inflammation and breathing difficulty.',
'Wheezing; Breathlessness; Chest tightness; Coughing',
'Breathing retraining, diaphragmatic breathing exercises, posture correction, graded activity.', '["Cardio-Respiratory"]'::jsonb, 'Ongoing management', '/images/symptoms/asthma-breathing-exercises.jpg', 74, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Post-COVID Pulmonary Rehabilitation', 'post-covid-pulmonary-rehabilitation', 'Recovery therapy for lingering respiratory and functional effects after COVID-19.',
'Breathlessness; Fatigue; Reduced stamina; Muscle weakness',
'Breathing exercises, graded aerobic reconditioning, strength training, fatigue management.', '["Cardio-Respiratory"]'::jsonb, '4-12 weeks', '/images/symptoms/post-covid-pulmonary-rehabilitation.jpg', 75, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Chest Physiotherapy (Secretion Clearance)', 'chest-physiotherapy', 'Techniques to help clear mucus/secretions from the lungs.',
'Chest congestion; Difficulty clearing secretions; Breathlessness',
'Postural drainage, percussion/vibration techniques, breathing exercises, coughing techniques.', '["Cardio-Respiratory"]'::jsonb, '2-4 weeks', '/images/symptoms/chest-physiotherapy.jpg', 76, true)
ON CONFLICT (slug) DO NOTHING;


-- I. Chronic Pain & Lifestyle

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Chronic Lower Back Pain', 'chronic-lower-back-pain', 'Persistent back pain lasting more than 3 months, often multifactorial.',
'Ongoing dull or sharp pain; Stiffness; Activity limitation',
'Graded exercise therapy, pain education, core strengthening, lifestyle modification.', '["Chronic Pain & Lifestyle"]'::jsonb, 'Ongoing management', '/images/symptoms/chronic-lower-back-pain.jpg', 77, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Migraine/Tension Headache (Posture-Related)', 'migraine-tension-headache', 'Recurring headaches linked to muscular tension or postural strain.',
'Head pain; Neck/shoulder tightness; Sometimes light sensitivity',
'Postural correction, neck and shoulder relaxation exercises, manual therapy, ergonomic advice.', '["Chronic Pain & Lifestyle"]'::jsonb, '4-8 weeks', '/images/symptoms/migraine-tension-headache.jpg', 78, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Sedentary Lifestyle-Related Stiffness', 'sedentary-lifestyle-stiffness', 'Muscular tightness and reduced mobility from prolonged inactivity.',
'General stiffness; Fatigue; Reduced flexibility',
'Mobility exercises, stretching routines, activity-level guidance.', '["Chronic Pain & Lifestyle"]'::jsonb, '2-4 weeks', '/images/symptoms/sedentary-lifestyle-stiffness.jpg', 79, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Obesity-Related Joint Pain', 'obesity-related-joint-pain', 'Joint stress and pain linked to excess body weight.',
'Knee/hip/back pain; Reduced mobility; Fatigue with activity',
'Low-impact strengthening, weight-management guided exercise, joint-protection education.', '["Chronic Pain & Lifestyle"]'::jsonb, 'Ongoing management', '/images/symptoms/obesity-related-joint-pain.jpg', 80, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Diabetic Neuropathy-Related Mobility Issues', 'diabetic-neuropathy-mobility', 'Nerve damage from diabetes affecting sensation and movement, usually in the feet.',
'Numbness; Tingling; Balance difficulty; Foot weakness',
'Balance training, foot-care education, sensory re-education, gait training.', '["Chronic Pain & Lifestyle"]'::jsonb, 'Ongoing management', '/images/symptoms/diabetic-neuropathy-mobility.jpg', 81, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Repetitive Strain Injury (RSI) from Desk Work', 'repetitive-strain-injury-desk-work', 'Overuse injury of muscles/tendons from repetitive movements or poor ergonomics.',
'Pain, tingling, or weakness in wrists, hands, neck, or shoulders',
'Ergonomic correction, stretching and strengthening, activity modification, manual therapy.', '["Chronic Pain & Lifestyle"]'::jsonb, '4-6 weeks', '/images/symptoms/repetitive-strain-injury-desk-work.jpg', 82, true)
ON CONFLICT (slug) DO NOTHING;


-- J. Therapy Techniques

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Manual Therapy / Manipulation', 'manual-therapy', 'Hands-on technique using mobilization or manipulation of joints and soft tissue to relieve pain and restore movement.',
'Joint stiffness; Muscle tightness; Restricted movement; Pain with motion',
'Joint mobilization, soft tissue manipulation, thrust techniques, muscle energy techniques.', '["Therapy Techniques"]'::jsonb, 'Varies by condition', '/images/symptoms/manual-therapy.jpg', 83, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Dry Needling', 'dry-needling', 'Fine needles inserted into trigger points to release muscle tightness and reduce pain.',
'Muscle knots; Trigger points; Referred pain patterns; Localized tightness',
'Intramuscular stimulation, trigger point release, dry needling of active trigger points.', '["Therapy Techniques"]'::jsonb, '2-4 sessions', '/images/symptoms/dry-needling.jpg', 84, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Cupping Therapy', 'cupping-therapy', 'Suction cups applied to the skin to improve blood flow and relieve muscle tension.',
'Muscle tension; Poor circulation; Myofascial tightness; Stiffness',
'Static cupping, dynamic cupping, flash cupping, combination with other modalities.', '["Therapy Techniques"]'::jsonb, '1-3 sessions', '/images/symptoms/cupping-therapy.jpg', 85, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Electrotherapy (IFT, TENS, Ultrasound Therapy)', 'electrotherapy', 'Electrical/sound wave-based modalities used for pain relief, inflammation reduction, and tissue healing.',
'Acute or chronic pain; Inflammation; Muscle spasm; Delayed tissue healing',
'Interferential therapy (IFT), transcutaneous electrical nerve stimulation (TENS), therapeutic ultrasound.', '["Therapy Techniques"]'::jsonb, 'Varies by condition', '/images/symptoms/electrotherapy.jpg', 86, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Kinesiology Taping', 'kinesiology-taping', 'Elastic tape applied to support muscles/joints, reduce pain, and improve movement awareness.',
'Muscle fatigue; Joint instability; Swelling; Movement pain',
'Fascial correction, muscle facilitation/inhibition, ligament support, lymphatic drainage taping.', '["Therapy Techniques"]'::jsonb, 'Immediate support', '/images/symptoms/kinesiology-taping.jpg', 87, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Traction Therapy (Cervical/Lumbar)', 'traction-therapy', 'Mechanical or manual stretching of the spine to relieve nerve compression and disc pressure.',
'Nerve compression; Disc herniation; Radiculopathy; Spinal stenosis symptoms',
'Mechanical traction, manual traction, intermittent traction, sustained traction.', '["Therapy Techniques"]'::jsonb, '4-8 weeks', '/images/symptoms/traction-therapy.jpg', 88, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Shockwave Therapy', 'shockwave-therapy', 'High-energy sound waves used to treat chronic tendon injuries and stimulate healing.',
'Chronic tendinopathy; Heel pain; Calcific shoulder; Tennis elbow',
'Focused shockwave therapy, radial shockwave therapy, combined with exercise prescription.', '["Therapy Techniques"]'::jsonb, '3-6 sessions', '/images/symptoms/shockwave-therapy.jpg', 89, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Laser Therapy (LASER/LLLT)', 'laser-therapy', 'Low-level laser used to reduce inflammation, relieve pain, and accelerate tissue repair.',
'Soft tissue inflammation; Joint pain; Wound healing delay; Muscle strain',
'Low-level laser therapy (LLLT), photobiomodulation, class 3B/4 laser applications.', '["Therapy Techniques"]'::jsonb, 'Varies by condition', '/images/symptoms/laser-therapy.jpg', 90, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Exercise Therapy / Strengthening Programs', 'exercise-therapy', 'Customized exercise regimens to build strength, flexibility, and endurance for recovery.',
'Muscle weakness; Deconditioning; Reduced endurance; Post-injury weakness',
'Progressive resistance training, flexibility programs, cardiovascular conditioning, functional exercise.', '["Therapy Techniques"]'::jsonb, '4-12 weeks', '/images/symptoms/exercise-therapy.jpg', 91, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Postural Correction Therapy', 'postural-correction-therapy', 'Targeted exercises and education to correct poor posture and prevent related pain.',
'Postural imbalance; Forward head; Rounded shoulders; Lower crossed syndrome',
'Postural assessment, corrective exercises, ergonomic education, strengthening of weak muscle groups.', '["Therapy Techniques"]'::jsonb, '4-8 weeks', '/images/symptoms/postural-correction-therapy.jpg', 92, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Vestibular Rehabilitation', 'vestibular-rehabilitation', 'Specialized exercises to treat dizziness, imbalance, and inner-ear related disorders.',
'Dizziness; Vertigo; Balance problems; Motion sensitivity',
'Canalith repositioning, vestibular adaptation exercises, gaze stabilization, balance retraining.', '["Therapy Techniques"]'::jsonb, '4-8 weeks', '/images/symptoms/vestibular-rehabilitation.jpg', 93, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Sports Taping', 'sports-taping', 'Taping techniques used to support muscles/joints during sports activity and prevent injury.',
'Joint instability; Muscle weakness; Preventive support needs',
'Rigid taping, elastic taping, preventive strapping, proprioceptive taping.', '["Therapy Techniques"]'::jsonb, 'Immediate support', '/images/symptoms/sports-taping.jpg', 94, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO symptoms (title, slug, description, symptoms_list, treatment, popular_for, recovery_estimate, image, sort_order, active)
VALUES ('Cryotherapy / Heat Therapy', 'cryotherapy-heat-therapy', 'Cold or heat application to reduce inflammation, relieve pain, and relax muscles.',
'Acute injury swelling; Chronic muscle stiffness; Pain; Spasm',
'Ice packs, cold compression, hot packs, contrast therapy, warm-up/cool-down protocols.', '["Therapy Techniques"]'::jsonb, 'Immediate relief', '/images/symptoms/cryotherapy-heat-therapy.jpg', 95, true)
ON CONFLICT (slug) DO NOTHING;