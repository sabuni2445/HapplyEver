package com.elegantevents.repository;

import com.elegantevents.model.VendorPackageOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VendorPackageRepository extends JpaRepository<VendorPackageOrder, Long> {
    Optional<VendorPackageOrder> findByTxRef(String txRef);
    List<VendorPackageOrder> findByClerkId(String clerkId);
    List<VendorPackageOrder> findByStatus(VendorPackageOrder.OrderStatus status);
}
