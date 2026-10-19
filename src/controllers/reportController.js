const { query } = require('../config/db');

/**
 * Get comprehensive reports and analytics summary
 * GET /api/reports/summary
 */
async function getSummary(req, res, next) {
  try {
    // 1. Overall Requests Counts by Status
    const statusCountsRes = await query(`
      SELECT 
        status, 
        COUNT(*) as count,
        ISNULL(SUM(ISNULL(actualWeight, estimatedWeight)), 0) as totalWeight
      FROM PickupRequests
      GROUP BY status
    `);

    // 2. Recycling Batches breakdown by ItemType (Reusable, Recyclable, Hazardous)
    const recyclingBreakdownRes = await query(`
      SELECT 
        itemType, 
        COUNT(*) as batchCount,
        ISNULL(SUM(weight), 0) as totalWeight,
        ISNULL(AVG(recoveryRate), 0) as avgRecoveryRate
      FROM RecyclingBatches
      GROUP BY itemType
    `);

    // 3. Totals
    const totalsRes = await query(`
      SELECT 
        COUNT(*) as totalRequests,
        ISNULL(SUM(quantity), 0) as totalItems,
        ISNULL(SUM(ISNULL(actualWeight, estimatedWeight)), 0) as totalWeightCollected,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pendingCount,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approvedCount,
        SUM(CASE WHEN status = 'Pickup Scheduled' THEN 1 ELSE 0 END) as scheduledCount,
        SUM(CASE WHEN status = 'Collected' THEN 1 ELSE 0 END) as collectedCount,
        SUM(CASE WHEN status = 'Sent for Recycling' THEN 1 ELSE 0 END) as inRecyclingCount,
        SUM(CASE WHEN status = 'Recycling Completed' THEN 1 ELSE 0 END) as completedCount
      FROM PickupRequests
    `);

    // 4. Calculate Environmental Savings
    // Standard benchmarks:
    // ~1.85 kg CO2 avoided per kg e-waste recycled
    // ~0.04 trees equivalent saved per kg
    // ~14.2 kWh energy saved per kg recycled metal & plastics
    // ~0.008 kg toxic lead/mercury prevented from groundwater per kg
    const totalWeight = totalsRes.recordset[0]?.totalWeightCollected || 0;
    const co2Saved = Number((totalWeight * 1.85).toFixed(1));
    const treesSaved = Number((totalWeight * 0.04).toFixed(1));
    const energySavedKwh = Number((totalWeight * 14.2).toFixed(1));
    const toxicDivertedKg = Number((totalWeight * 0.012).toFixed(2));

    // Reusable, Recyclable, Hazardous weights
    let reusableWeight = 0;
    let recyclableWeight = 0;
    let hazardousWeight = 0;

    recyclingBreakdownRes.recordset.forEach(row => {
      if (row.itemType === 'Reusable') reusableWeight = row.totalWeight;
      else if (row.itemType === 'Recyclable') recyclableWeight = row.totalWeight;
      else if (row.itemType === 'Hazardous') hazardousWeight = row.totalWeight;
    });

    res.status(200).json({
      success: true,
      summary: {
        ...totalsRes.recordset[0],
        reusableWeight,
        recyclableWeight,
        hazardousWeight,
        environmentalImpact: {
          co2SavedKg: co2Saved,
          treesSaved: treesSaved,
          energySavedKwh: energySavedKwh,
          toxicDivertedKg: toxicDivertedKg
        },
        statusDistribution: statusCountsRes.recordset,
        recyclingSegregation: recyclingBreakdownRes.recordset
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get monthly statistics for reporting charts
 * GET /api/reports/monthly
 */
async function getMonthlyStats(req, res, next) {
  try {
    const result = await query(`
      SELECT 
        FORMAT(createdAt, 'yyyy-MM') as month,
        DATENAME(month, createdAt) as monthName,
        YEAR(createdAt) as year,
        COUNT(*) as totalRequests,
        ISNULL(SUM(quantity), 0) as itemsCollected,
        ISNULL(SUM(ISNULL(actualWeight, estimatedWeight)), 0) as weightKg,
        SUM(CASE WHEN status = 'Recycling Completed' THEN 1 ELSE 0 END) as completedCount
      FROM PickupRequests
      WHERE createdAt >= DATEADD(MONTH, -12, GETDATE())
      GROUP BY FORMAT(createdAt, 'yyyy-MM'), DATENAME(month, createdAt), YEAR(createdAt)
      ORDER BY month ASC
    `);

    res.status(200).json({
      success: true,
      monthlyData: result.recordset
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get category distribution
 * GET /api/reports/categories
 */
async function getCategoryDistribution(req, res, next) {
  try {
    const result = await query(`
      SELECT 
        r.categoryName,
        c.icon,
        c.hazardousLevel,
        COUNT(r.id) as requestCount,
        ISNULL(SUM(r.quantity), 0) as totalItems,
        ISNULL(SUM(ISNULL(r.actualWeight, r.estimatedWeight)), 0) as totalWeightKg
      FROM PickupRequests r
      LEFT JOIN Categories c ON r.categoryId = c.id
      GROUP BY r.categoryName, c.icon, c.hazardousLevel
      ORDER BY totalWeightKg DESC
    `);

    res.status(200).json({
      success: true,
      categories: result.recordset
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get user-specific dashboard metrics
 * GET /api/reports/user-dashboard
 */
async function getUserDashboard(req, res, next) {
  try {
    const userId = req.user.id;

    // User metrics
    const statsResult = await query(`
      SELECT 
        COUNT(*) as totalRequests,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pendingRequests,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approvedRequests,
        SUM(CASE WHEN status = 'Pickup Scheduled' THEN 1 ELSE 0 END) as scheduledPickups,
        SUM(CASE WHEN status = 'Collected' THEN 1 ELSE 0 END) as collectedRequests,
        SUM(CASE WHEN status = 'Recycling Completed' THEN 1 ELSE 0 END) as completedCollections,
        ISNULL(SUM(ISNULL(actualWeight, estimatedWeight)), 0) as totalWeightContributed
      FROM PickupRequests
      WHERE userId = @userId
    `, { userId });

    // Recent requests
    const recentRequests = await query(`
      SELECT TOP 5 r.*, c.icon as categoryIcon
      FROM PickupRequests r
      LEFT JOIN Categories c ON r.categoryId = c.id
      WHERE r.userId = @userId
      ORDER BY r.createdAt DESC
    `, { userId });

    // Unread notifications
    const unreadNotifs = await query(`
      SELECT COUNT(*) as unreadCount
      FROM Notifications
      WHERE userId = @userId AND isRead = 0
    `, { userId });

    const stats = statsResult.recordset[0] || {};
    const totalWeight = stats.totalWeightContributed || 0;

    res.status(200).json({
      success: true,
      dashboard: {
        totalRequests: stats.totalRequests || 0,
        pendingRequests: stats.pendingRequests || 0,
        approvedRequests: stats.approvedRequests || 0,
        scheduledPickups: stats.scheduledPickups || 0,
        collectedRequests: stats.collectedRequests || 0,
        completedCollections: stats.completedCollections || 0,
        totalWeightContributed: Number(totalWeight.toFixed(1)),
        co2SavedKg: Number((totalWeight * 1.85).toFixed(1)),
        treesPreserved: Number((totalWeight * 0.04).toFixed(1)),
        unreadNotifications: unreadNotifs.recordset[0]?.unreadCount || 0,
        recentRequests: recentRequests.recordset
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSummary,
  getMonthlyStats,
  getCategoryDistribution,
  getUserDashboard
};
