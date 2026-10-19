-- ===================================================
-- EcoCycle E-Waste Management System - Database Schema
-- SQL Server 2016+ / 2019 / 2022
-- Database: mywebsite
-- ===================================================

USE [mywebsite];
GO

-- 1. Users Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        email NVARCHAR(150) NOT NULL UNIQUE,
        phone NVARCHAR(20) NULL,
        password NVARCHAR(255) NOT NULL,
        role NVARCHAR(20) NOT NULL DEFAULT 'user', -- 'user', 'admin', 'agent', 'recycler'
        address NVARCHAR(255) NULL,
        city NVARCHAR(100) NULL,
        pincode NVARCHAR(20) NULL,
        createdAt DATETIME NOT NULL DEFAULT GETDATE(),
        updatedAt DATETIME NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX IX_Users_Email ON Users(email);
    CREATE INDEX IX_Users_Role ON Users(role);
    PRINT 'Created Users table';
END
GO

-- 2. Categories Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Categories')
BEGIN
    CREATE TABLE Categories (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        code NVARCHAR(50) NOT NULL UNIQUE,
        description NVARCHAR(255) NULL,
        icon NVARCHAR(50) NULL,
        hazardousLevel NVARCHAR(20) NOT NULL DEFAULT 'Low', -- 'Low', 'Medium', 'High'
        co2SavedPerKg FLOAT NOT NULL DEFAULT 1.8,
        treesSavedPerKg FLOAT NOT NULL DEFAULT 0.04,
        isActive BIT NOT NULL DEFAULT 1,
        createdAt DATETIME NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Created Categories table';
END
GO

-- 3. RecyclingCenters Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RecyclingCenters')
BEGIN
    CREATE TABLE RecyclingCenters (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(150) NOT NULL,
        licenseNumber NVARCHAR(100) NULL,
        city NVARCHAR(100) NOT NULL,
        address NVARCHAR(255) NULL,
        specialization NVARCHAR(100) NOT NULL, -- 'Full Cycle Recycling', 'Metal Recovery', 'Hazardous Neutralization', 'Refurbishing'
        contactPhone NVARCHAR(20) NULL,
        contactEmail NVARCHAR(100) NULL,
        rating FLOAT NOT NULL DEFAULT 4.8,
        isActive BIT NOT NULL DEFAULT 1,
        createdAt DATETIME NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Created RecyclingCenters table';
END
GO

-- 4. PickupRequests Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PickupRequests')
BEGIN
    CREATE TABLE PickupRequests (
        id INT IDENTITY(1,1) PRIMARY KEY,
        trackingNumber NVARCHAR(50) NOT NULL UNIQUE,
        userId INT NOT NULL FOREIGN KEY REFERENCES Users(id) ON DELETE CASCADE,
        itemName NVARCHAR(150) NOT NULL,
        categoryId INT NOT NULL FOREIGN KEY REFERENCES Categories(id),
        categoryName NVARCHAR(100) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        condition NVARCHAR(50) NOT NULL, -- 'Working', 'Partially Working / Repairable', 'Non-functional / Scrap'
        estimatedWeight FLOAT NOT NULL,
        actualWeight FLOAT NULL,
        pickupAddress NVARCHAR(300) NOT NULL,
        city NVARCHAR(100) NOT NULL,
        pincode NVARCHAR(20) NOT NULL,
        preferredPickupDate DATE NOT NULL,
        preferredTimeSlot NVARCHAR(50) NULL,
        contactPhone NVARCHAR(20) NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'Pending', 
        -- 'Pending', 'Approved', 'Rejected', 'Pickup Scheduled', 'Collected', 'Sent for Recycling', 'Recycling Completed'
        scheduledDate DATETIME NULL,
        assignedAgentId INT NULL FOREIGN KEY REFERENCES Users(id),
        assignedAgentName NVARCHAR(100) NULL,
        rejectionReason NVARCHAR(255) NULL,
        userNotes NVARCHAR(500) NULL,
        adminNotes NVARCHAR(500) NULL,
        createdAt DATETIME NOT NULL DEFAULT GETDATE(),
        updatedAt DATETIME NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX IX_PickupRequests_UserId ON PickupRequests(userId);
    CREATE INDEX IX_PickupRequests_Status ON PickupRequests(status);
    CREATE INDEX IX_PickupRequests_TrackingNumber ON PickupRequests(trackingNumber);
    PRINT 'Created PickupRequests table';
END
GO

-- 5. RequestTrackingHistory Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RequestTrackingHistory')
BEGIN
    CREATE TABLE RequestTrackingHistory (
        id INT IDENTITY(1,1) PRIMARY KEY,
        requestId INT NOT NULL FOREIGN KEY REFERENCES PickupRequests(id) ON DELETE CASCADE,
        status NVARCHAR(50) NOT NULL,
        description NVARCHAR(255) NOT NULL,
        updatedBy NVARCHAR(100) NOT NULL DEFAULT 'System',
        timestamp DATETIME NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX IX_RequestTrackingHistory_RequestId ON RequestTrackingHistory(requestId);
    PRINT 'Created RequestTrackingHistory table';
END
GO

-- 6. RecyclingBatches Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RecyclingBatches')
BEGIN
    CREATE TABLE RecyclingBatches (
        id INT IDENTITY(1,1) PRIMARY KEY,
        batchNumber NVARCHAR(50) NOT NULL UNIQUE,
        requestId INT NULL FOREIGN KEY REFERENCES PickupRequests(id) ON DELETE SET NULL,
        itemType NVARCHAR(50) NOT NULL, -- 'Reusable', 'Recyclable', 'Hazardous'
        itemName NVARCHAR(150) NOT NULL,
        categoryName NVARCHAR(100) NULL,
        weight FLOAT NOT NULL,
        recyclerFacility NVARCHAR(150) NOT NULL,
        recyclerContact NVARCHAR(100) NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'In Inspection',
        -- 'Pending Segregation', 'In Inspection', 'In Processing', 'Materials Recovered', 'Refurbished', 'Safely Disposed', 'Completed'
        recoveryRate FLOAT NOT NULL DEFAULT 0.0,
        hazardousComponents NVARCHAR(255) NULL,
        disposalMethod NVARCHAR(255) NULL,
        notes NVARCHAR(500) NULL,
        completedAt DATETIME NULL,
        createdAt DATETIME NOT NULL DEFAULT GETDATE(),
        updatedAt DATETIME NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX IX_RecyclingBatches_ItemType ON RecyclingBatches(itemType);
    CREATE INDEX IX_RecyclingBatches_Status ON RecyclingBatches(status);
    PRINT 'Created RecyclingBatches table';
END
GO

-- 7. Notifications Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
BEGIN
    CREATE TABLE Notifications (
        id INT IDENTITY(1,1) PRIMARY KEY,
        userId INT NOT NULL FOREIGN KEY REFERENCES Users(id) ON DELETE CASCADE,
        title NVARCHAR(150) NOT NULL,
        message NVARCHAR(500) NOT NULL,
        type NVARCHAR(50) NOT NULL DEFAULT 'info', -- 'info', 'success', 'warning', 'status_update'
        relatedRequestId INT NULL FOREIGN KEY REFERENCES PickupRequests(id),
        isRead BIT NOT NULL DEFAULT 0,
        createdAt DATETIME NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX IX_Notifications_UserId ON Notifications(userId);
    CREATE INDEX IX_Notifications_IsRead ON Notifications(isRead);
    PRINT 'Created Notifications table';
END
GO
