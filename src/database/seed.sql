-- ===================================================
-- EcoCycle E-Waste Management System - Seed Data
-- ===================================================

USE [mywebsite];
GO

-- 1. Insert Initial Categories
IF NOT EXISTS (SELECT * FROM Categories)
BEGIN
    INSERT INTO Categories (name, code, description, icon, hazardousLevel, co2SavedPerKg, treesSavedPerKg)
    VALUES 
    ('Computers & Laptops', 'COMP', 'Desktops, laptops, monitors, motherboards, RAM, GPUs', 'Laptop', 'High', 2.4, 0.05),
    ('Mobile Phones & Tablets', 'MOBILE', 'Smartphones, feature phones, tablets, e-readers', 'Smartphone', 'Medium', 1.8, 0.035),
    ('Large Appliances', 'LARGE_APP', 'Refrigerators, washing machines, air conditioners, microwaves', 'Refrigerator', 'High', 1.5, 0.03),
    ('Small Consumer Electronics', 'SMALL_ELEC', 'Toasters, coffee makers, blenders, hair dryers, irons', 'Coffee', 'Low', 1.2, 0.02),
    ('Audio & Entertainment', 'AUDIO_TV', 'Televisions, home theaters, soundbars, game consoles', 'Tv', 'Medium', 1.6, 0.032),
    ('Batteries & Power Supplies', 'BATTERY', 'Lithium-ion, lead-acid batteries, power banks, UPS', 'BatteryCharging', 'High', 3.2, 0.07),
    ('Cables, Chargers & Peripherals', 'ACCESSORIES', 'Power cords, USB cables, keyboards, mice, adapters', 'Cable', 'Low', 1.1, 0.018),
    ('Lighting Equipment', 'LIGHTING', 'Fluorescent tubes, CFL bulbs, LED panels, fixtures', 'Lightbulb', 'High', 2.0, 0.04);
    PRINT 'Inserted Categories';
END
GO

-- 2. Insert Users (Admin, Agents, Users)
-- Default password is 'password123' for all demo users
IF NOT EXISTS (SELECT * FROM Users WHERE email = 'admin@ecocycle.com')
BEGIN
    INSERT INTO Users (name, email, phone, password, role, address, city, pincode)
    VALUES 
    ('Admin Director', 'admin@ecocycle.com', '+91 98765 43210', '$2b$10$ofb1eMFZ0q9jmdOcN8jht.74tNq19.IejP4hfCX5HiJWuNfsN1rfW', 'admin', 'Green Tower, E-City Sector 4', 'Bengaluru', '560100'),
    ('Rahul Sharma', 'rahul.agent@ecocycle.com', '+91 98765 11111', '$2b$10$ofb1eMFZ0q9jmdOcN8jht.74tNq19.IejP4hfCX5HiJWuNfsN1rfW', 'agent', 'Logistics Hub 2, Koramangala', 'Bengaluru', '560034'),
    ('Priya Patel', 'priya.agent@ecocycle.com', '+91 98765 22222', '$2b$10$ofb1eMFZ0q9jmdOcN8jht.74tNq19.IejP4hfCX5HiJWuNfsN1rfW', 'agent', 'North Hub, Hebbal', 'Bengaluru', '560024'),
    ('EcoMetals Recycler', 'facility@ecometals.com', '+91 98765 33333', '$2b$10$ofb1eMFZ0q9jmdOcN8jht.74tNq19.IejP4hfCX5HiJWuNfsN1rfW', 'recycler', 'Plot 45, Peenya Industrial Area', 'Bengaluru', '560058'),
    ('Meghana K', 'meghana@example.com', '+91 98765 99999', '$2b$10$ofb1eMFZ0q9jmdOcN8jht.74tNq19.IejP4hfCX5HiJWuNfsN1rfW', 'user', 'Flat 402, Sunshine Heights, Indiranagar', 'Bengaluru', '560038'),
    ('John Doe', 'john.doe@example.com', '+91 98111 22334', '$2b$10$ofb1eMFZ0q9jmdOcN8jht.74tNq19.IejP4hfCX5HiJWuNfsN1rfW', 'user', '124, 5th Cross, HSR Layout Sector 2', 'Bengaluru', '560102');
    PRINT 'Inserted Users';
END
GO

-- 3. Insert Recycling Centers
IF NOT EXISTS (SELECT * FROM RecyclingCenters)
BEGIN
    INSERT INTO RecyclingCenters (name, licenseNumber, city, address, specialization, contactPhone, contactEmail, rating)
    VALUES
    ('EcoMetals Recovery Ltd', 'KSPCB-EW-2023-8812', 'Bengaluru', 'Plot 45, Peenya Phase 2', 'Metal Recovery', '+91 80 2839 1234', 'info@ecometals.com', 4.9),
    ('GreenTech Circuit Solutions', 'CPCB-REG-2022-4411', 'Bengaluru', 'Electronics City Phase 1', 'Refurbishing', '+91 80 4123 5678', 'contact@greentech.org', 4.8),
    ('HazSafe Neutralization Plant', 'HAZ-SAFE-2024-0092', 'Bengaluru', 'Bommasandra Industrial Area', 'Hazardous Neutralization', '+91 80 2783 9900', 'compliance@hazsafe.in', 4.7),
    ('Apex CleanCycle Hub', 'CPCB-APEX-2023-5510', 'Bengaluru', 'Whitefield EPIP Zone', 'Full Cycle Recycling', '+91 80 6712 3400', 'operations@cleancycle.com', 4.9);
    PRINT 'Inserted Recycling Centers';
END
GO

-- 4. Insert Sample Pickup Requests & Tracking History
IF NOT EXISTS (SELECT * FROM PickupRequests)
BEGIN
    DECLARE @UserId INT = (SELECT TOP 1 id FROM Users WHERE email = 'meghana@example.com');
    DECLARE @CatComp INT = (SELECT TOP 1 id FROM Categories WHERE code = 'COMP');
    DECLARE @CatMobile INT = (SELECT TOP 1 id FROM Categories WHERE code = 'MOBILE');
    DECLARE @CatAudio INT = (SELECT TOP 1 id FROM Categories WHERE code = 'AUDIO_TV');
    DECLARE @CatLarge INT = (SELECT TOP 1 id FROM Categories WHERE code = 'LARGE_APP');

    -- Request 1: Completed
    INSERT INTO PickupRequests 
    (trackingNumber, userId, itemName, categoryId, categoryName, quantity, condition, estimatedWeight, actualWeight, pickupAddress, city, pincode, preferredPickupDate, preferredTimeSlot, contactPhone, status, scheduledDate, assignedAgentName, createdAt)
    VALUES
    ('EW-2026-1001', @UserId, 'Dell Latitude Laptop & HP Monitor', @CatComp, 'Computers & Laptops', 2, 'Partially Working / Repairable', 6.5, 6.2, 'Flat 402, Sunshine Heights, Indiranagar', 'Bengaluru', '560038', '2026-10-10', 'Morning (9 AM - 12 PM)', '+91 98765 99999', 'Recycling Completed', '2026-10-12 10:30:00', 'Rahul Sharma', DATEADD(DAY, -9, GETDATE()));

    DECLARE @Req1 INT = SCOPE_IDENTITY();
    INSERT INTO RequestTrackingHistory (requestId, status, description, updatedBy, timestamp)
    VALUES
    (@Req1, 'Pending', 'E-waste pickup request submitted by user', 'System', DATEADD(DAY, -9, GETDATE())),
    (@Req1, 'Approved', 'Request verified and approved by operations team', 'Admin Director', DATEADD(DAY, -8, GETDATE())),
    (@Req1, 'Pickup Scheduled', 'Pickup scheduled for Oct 12 with Rahul Sharma', 'Admin Director', DATEADD(DAY, -7, GETDATE())),
    (@Req1, 'Collected', 'Items collected and weighed at pickup address (6.2 kg)', 'Rahul Sharma', DATEADD(DAY, -6, GETDATE())),
    (@Req1, 'Sent for Recycling', 'Dispatched to GreenTech Circuit Solutions for segregation', 'System', DATEADD(DAY, -5, GETDATE())),
    (@Req1, 'Recycling Completed', 'Components successfully separated: 88% materials recovered', 'GreenTech Circuit Solutions', DATEADD(DAY, -2, GETDATE()));

    -- Request 2: Sent for Recycling
    INSERT INTO PickupRequests 
    (trackingNumber, userId, itemName, categoryId, categoryName, quantity, condition, estimatedWeight, actualWeight, pickupAddress, city, pincode, preferredPickupDate, preferredTimeSlot, contactPhone, status, scheduledDate, assignedAgentName, createdAt)
    VALUES
    ('EW-2026-1002', @UserId, 'Samsung LED Smart TV 43-inch', @CatAudio, 'Audio & Entertainment', 1, 'Non-functional / Scrap', 11.0, 11.4, 'Flat 402, Sunshine Heights, Indiranagar', 'Bengaluru', '560038', '2026-10-14', 'Afternoon (1 PM - 4 PM)', '+91 98765 99999', 'Sent for Recycling', '2026-10-15 14:00:00', 'Priya Patel', DATEADD(DAY, -5, GETDATE()));

    DECLARE @Req2 INT = SCOPE_IDENTITY();
    INSERT INTO RequestTrackingHistory (requestId, status, description, updatedBy, timestamp)
    VALUES
    (@Req2, 'Pending', 'E-waste pickup request submitted by user', 'System', DATEADD(DAY, -5, GETDATE())),
    (@Req2, 'Approved', 'Verified screen damage, approved for safe handling', 'Admin Director', DATEADD(DAY, -4, GETDATE())),
    (@Req2, 'Pickup Scheduled', 'Pickup scheduled with Priya Patel', 'Admin Director', DATEADD(DAY, -4, GETDATE())),
    (@Req2, 'Collected', 'Collected from doorstep and transported to central depot', 'Priya Patel', DATEADD(DAY, -3, GETDATE())),
    (@Req2, 'Sent for Recycling', 'Forwarded to EcoMetals Recovery Ltd for rare metal extraction', 'Operations Team', DATEADD(DAY, -1, GETDATE()));

    -- Request 3: Pickup Scheduled
    INSERT INTO PickupRequests 
    (trackingNumber, userId, itemName, categoryId, categoryName, quantity, condition, estimatedWeight, pickupAddress, city, pincode, preferredPickupDate, preferredTimeSlot, contactPhone, status, scheduledDate, assignedAgentName, createdAt)
    VALUES
    ('EW-2026-1003', @UserId, 'iPhone 11 & iPad Air 2', @CatMobile, 'Mobile Phones & Tablets', 2, 'Working', 0.9, 'Flat 402, Sunshine Heights, Indiranagar', 'Bengaluru', '560038', '2026-10-20', 'Morning (9 AM - 12 PM)', '+91 98765 99999', 'Pickup Scheduled', DATEADD(DAY, 1, GETDATE()), 'Rahul Sharma', DATEADD(DAY, -2, GETDATE()));

    DECLARE @Req3 INT = SCOPE_IDENTITY();
    INSERT INTO RequestTrackingHistory (requestId, status, description, updatedBy, timestamp)
    VALUES
    (@Req3, 'Pending', 'E-waste pickup request submitted by user', 'System', DATEADD(DAY, -2, GETDATE())),
    (@Req3, 'Approved', 'Eligible for certified refurbishing & reuse program', 'Admin Director', DATEADD(DAY, -1, GETDATE())),
    (@Req3, 'Pickup Scheduled', 'Agent Rahul Sharma assigned for tomorrow morning pickup', 'Admin Director', GETDATE());

    -- Request 4: Pending
    INSERT INTO PickupRequests 
    (trackingNumber, userId, itemName, categoryId, categoryName, quantity, condition, estimatedWeight, pickupAddress, city, pincode, preferredPickupDate, preferredTimeSlot, contactPhone, status, createdAt)
    VALUES
    ('EW-2026-1004', @UserId, 'Whirlpool Microwave Oven (Faulty Magnetron)', @CatLarge, 'Large Appliances', 1, 'Non-functional / Scrap', 14.5, 'Flat 402, Sunshine Heights, Indiranagar', 'Bengaluru', '560038', '2026-10-22', 'Evening (4 PM - 7 PM)', '+91 98765 99999', 'Pending', GETDATE());

    DECLARE @Req4 INT = SCOPE_IDENTITY();
    INSERT INTO RequestTrackingHistory (requestId, status, description, updatedBy, timestamp)
    VALUES
    (@Req4, 'Pending', 'Request submitted, pending administrator review and dispatch', 'System', GETDATE());

    PRINT 'Inserted Sample Pickup Requests & Tracking';
END
GO

-- 5. Insert Recycling Batches
IF NOT EXISTS (SELECT * FROM RecyclingBatches)
BEGIN
    INSERT INTO RecyclingBatches 
    (batchNumber, itemType, itemName, categoryName, weight, recyclerFacility, recyclerContact, status, recoveryRate, hazardousComponents, disposalMethod, notes)
    VALUES
    ('BATCH-REUSE-001', 'Reusable', 'Refurbished Dell Latitude Motherboards & Displays', 'Computers & Laptops', 3.8, 'GreenTech Circuit Solutions', 'contact@greentech.org', 'Refurbished', 92.5, 'None - Tested safe', 'Tested and donated/re-sold to education NGOs', 'High grade reusable components preserved'),
    ('BATCH-RECYCLE-002', 'Recyclable', 'Shredded Copper & Gold-plated Pins', 'Computers & Laptops', 2.4, 'EcoMetals Recovery Ltd', 'info@ecometals.com', 'Materials Recovered', 84.0, 'Traces of lead solder', 'Hydrometallurgical extraction and smelting', 'Yielded 18g refined copper and 0.4g gold'),
    ('BATCH-HAZARD-003', 'Hazardous', 'Mercury Backlight Tubes & CRT Phosphor Powder', 'Audio & Entertainment', 1.8, 'HazSafe Neutralization Plant', 'compliance@hazsafe.in', 'Safely Disposed', 100.0, 'Mercury vapor, Cadmium, Lead', 'Thermal desorption and secure vitrification stabilization', 'Certified zero-leach disposal complying with CPCB standards'),
    ('BATCH-RECYCLE-004', 'Recyclable', 'Aluminum & Plastic Housings', 'Audio & Entertainment', 9.6, 'Apex CleanCycle Hub', 'operations@cleancycle.com', 'In Processing', 75.0, 'Brominated flame retardants', 'Density separation and closed-loop pelletizing', 'Clean polymer flakes generated for new casing manufacturing'),
    ('BATCH-REUSE-005', 'Reusable', 'Smartphone Battery Health 89% & Screen Digitizer', 'Mobile Phones & Tablets', 0.5, 'GreenTech Circuit Solutions', 'contact@greentech.org', 'Under Inspection', 0.0, 'Lithium pouch', 'Safety diagnostics ongoing', 'Diagnostic screening for repair bench');

    PRINT 'Inserted Recycling Batches';
END
GO

-- 6. Insert Notifications
IF NOT EXISTS (SELECT * FROM Notifications)
BEGIN
    DECLARE @TargetUser INT = (SELECT TOP 1 id FROM Users WHERE email = 'meghana@example.com');
    DECLARE @ReqTrack1 INT = (SELECT TOP 1 id FROM PickupRequests WHERE trackingNumber = 'EW-2026-1001');
    DECLARE @ReqTrack2 INT = (SELECT TOP 1 id FROM PickupRequests WHERE trackingNumber = 'EW-2026-1002');
    DECLARE @ReqTrack3 INT = (SELECT TOP 1 id FROM PickupRequests WHERE trackingNumber = 'EW-2026-1003');

    INSERT INTO Notifications (userId, title, message, type, relatedRequestId, isRead, createdAt)
    VALUES
    (@TargetUser, 'Recycling Completed!', 'Your request EW-2026-1001 has been 100% processed. 88% materials were successfully recovered.', 'success', @ReqTrack1, 1, DATEADD(DAY, -2, GETDATE())),
    (@TargetUser, 'Item Dispatched to Certified Recycler', 'Request EW-2026-1002 reached EcoMetals Recovery Ltd for rare metal extraction.', 'info', @ReqTrack2, 0, DATEADD(DAY, -1, GETDATE())),
    (@TargetUser, 'Pickup Scheduled for Tomorrow', 'Agent Rahul Sharma will arrive tomorrow between 9 AM - 12 PM for request EW-2026-1003.', 'status_update', @ReqTrack3, 0, GETDATE()),
    (@TargetUser, 'Request Submitted Successfully', 'We received your pickup request for Whirlpool Microwave Oven (EW-2026-1004).', 'info', NULL, 0, GETDATE());

    PRINT 'Inserted Notifications';
END
GO
