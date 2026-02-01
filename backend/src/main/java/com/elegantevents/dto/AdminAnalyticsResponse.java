package com.elegantevents.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminAnalyticsResponse {
    private double totalRevenue;
    private long totalWeddings;
    private long activeWeddings;
    private long totalVendors;
    private long totalUsers;
    private List<MonthlyDataDTO> monthlyRevenue;
    private List<PackageStatDTO> packageDistribution;
    private List<VendorStatDTO> topVendors;
}
