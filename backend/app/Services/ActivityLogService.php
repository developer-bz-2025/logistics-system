<?php

namespace App\Services;

use App\Models\Action;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

class ActivityLogService
{
    /**
     * Log an activity
     */
    public static function log(
        string $actionName,
        ?int $userId = null,
        ?array $context = null
    ): ActivityLog {
        // Use authenticated user if no user ID provided
        if ($userId === null && Auth::check()) {
            $userId = Auth::id();
        }

        if ($userId === null) {
            throw new \Exception("User ID is required for activity logging");
        }

        // Ensure action exists
        $action = Action::firstOrCreate(
            ['action' => $actionName],
            ['action' => $actionName]
        );

        return ActivityLog::create([
            'user_id' => $userId,
            'action_id' => $action->id,
            'context' => $context ? json_encode($context) : null,
            'created_at' => now(),
        ]);
    }

    // ==================== Authentication & User Management ====================

    public static function logUserLogin(int $userId, ?string $ipAddress = null): void
    {
        self::log('User Login', $userId, ['ip_address' => $ipAddress]);
    }

    public static function logUserLogout(int $userId): void
    {
        self::log('User Logout', $userId);
    }

    public static function logPasswordChanged(int $userId): void
    {
        self::log('Password Changed', $userId);
    }

    // ==================== Items/Assets ====================

    public static function logAssetCreated(int $userId, int $itemId, array $data = []): void
    {
        self::log('Asset Created', $userId, array_merge(['item_id' => $itemId], $data));
    }

    public static function logAssetUpdated(int $userId, int $itemId, array $changes = []): void
    {
        self::log('Asset Updated', $userId, array_merge(['item_id' => $itemId], $changes));
    }

    public static function logAssetDeleted(int $userId, int $itemId, array $data = []): void
    {
        self::log('Asset Deleted', $userId, array_merge(['item_id' => $itemId], $data));
    }

    public static function logAssetPhotoUpdated(int $userId, int $itemId): void
    {
        self::log('Asset Photo Updated', $userId, ['item_id' => $itemId]);
    }

    public static function logAssetLinkedToPr(int $userId, int $itemId, int $prId, string $prCode): void
    {
        self::log('Asset Linked to PR', $userId, [
            'item_id' => $itemId,
            'pr_id' => $prId,
            'pr_code' => $prCode,
        ]);
    }

    public static function logAssetUnlinkedFromPr(int $userId, int $itemId, int $prId, string $prCode): void
    {
        self::log('Asset Unlinked from PR', $userId, [
            'item_id' => $itemId,
            'pr_id' => $prId,
            'pr_code' => $prCode,
        ]);
    }

    public static function logAssetStatusChanged(int $userId, int $itemId, string $oldStatus, string $newStatus): void
    {
        self::log('Asset Status Changed', $userId, [
            'item_id' => $itemId,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
        ]);
    }

    public static function logAssetHolderAssigned(int $userId, int $itemId, ?int $oldHolderId, int $newHolderId): void
    {
        self::log('Asset Holder Assigned', $userId, [
            'item_id' => $itemId,
            'old_holder_id' => $oldHolderId,
            'new_holder_id' => $newHolderId,
        ]);
    }

    // ==================== Purchase Requests ====================

    public static function logPrCreated(int $userId, int $prId, string $prCode, ?int $locationId = null): void
    {
        $context = [
            'pr_id' => $prId,
            'pr_code' => $prCode,
        ];

        if ($locationId !== null) {
            $context['location_id'] = $locationId;
        }

        self::log('PR Created', $userId, $context);
    }

    public static function logPrUpdated(int $userId, int $prId, string $prCode, array $changes = []): void
    {
        self::log('PR Updated', $userId, array_merge([
            'pr_id' => $prId,
            'pr_code' => $prCode,
        ], $changes));
    }

    public static function logPrDeleted(int $userId, int $prId, string $prCode): void
    {
        self::log('PR Deleted', $userId, [
            'pr_id' => $prId,
            'pr_code' => $prCode,
        ]);
    }

    public static function logPrEditRequestSubmitted(int $userId, int $requestId, int $prId, string $prCode): void
    {
        self::log('PR Edit Request Submitted', $userId, [
            'request_id' => $requestId,
            'pr_id' => $prId,
            'pr_code' => $prCode,
        ]);
    }

    public static function logPrEditRequestApproved(int $userId, int $prEditRequestId, int $prId, string $prCode, array $changes = []): void
{
    self::log('PR Edit Request Approved', $userId, array_merge([
        'pr_edit_request_id' => $prEditRequestId,
        'pr_id' => $prId,
        'pr_code' => $prCode,
    ], $changes));
}

    public static function logPrEditRequestRejected(int $userId, int $requestId, int $prId, string $prCode, ?string $reason = null): void
    {
        self::log('PR Edit Request Rejected', $userId, [
            'request_id' => $requestId,
            'pr_id' => $prId,
            'pr_code' => $prCode,
            'reason' => $reason,
        ]);
    }

    // ==================== Location Change Requests ====================

    public static function logLocationChangeRequestCreated(int $userId, int $requestId, int $itemId, array $data = []): void
    {
        self::log('Location Change Request Created', $userId, array_merge([
            'request_id' => $requestId,
            'item_id' => $itemId,
        ], $data));
    }

    public static function logLocationChangeRequestApproved(int $userId, int $requestId, int $itemId, array $data = []): void
    {
        self::log('Location Change Request Approved', $userId, array_merge([
            'request_id' => $requestId,
            'item_id' => $itemId,
        ], $data));
    }

    public static function logLocationChangeRequestRejected(int $userId, int $requestId, int $itemId, ?string $reason = null): void
    {
        self::log('Location Change Request Rejected', $userId, [
            'request_id' => $requestId,
            'item_id' => $itemId,
            'reason' => $reason,
        ]);
    }

    public static function logLocationChanged(int $userId, int $itemId, array $data = []): void
    {
        self::log('Location Changed', $userId, array_merge(['item_id' => $itemId], $data));
    }

    // ==================== Master Data Management (Super Admin) ====================

    public static function logLocationCreated(int $userId, int $locationId, string $locationName): void
    {
        self::log('Location Created', $userId, [
            'location_id' => $locationId,
            'location_name' => $locationName,
        ]);
    }

    public static function logLocationUpdated(int $userId, int $locationId, string $locationName, array $changes = []): void
    {
        self::log('Location Updated', $userId, array_merge([
            'location_id' => $locationId,
            'location_name' => $locationName,
        ], $changes));
    }

    public static function logLocationDeleted(int $userId, int $locationId, string $locationName): void
    {
        self::log('Location Deleted', $userId, [
            'location_id' => $locationId,
            'location_name' => $locationName,
        ]);
    }

    public static function logBrandCreated(int $userId, int $brandId, string $brandName): void
    {
        self::log('Brand Created', $userId, [
            'brand_id' => $brandId,
            'brand_name' => $brandName,
        ]);
    }

    public static function logBrandUpdated(int $userId, int $brandId, string $brandName, array $changes = []): void
    {
        self::log('Brand Updated', $userId, array_merge([
            'brand_id' => $brandId,
            'brand_name' => $brandName,
        ], $changes));
    }

    public static function logBrandDeleted(int $userId, int $brandId, string $brandName): void
    {
        self::log('Brand Deleted', $userId, [
            'brand_id' => $brandId,
            'brand_name' => $brandName,
        ]);
    }

    public static function logSupplierCreated(int $userId, int $supplierId, string $supplierName): void
    {
        self::log('Supplier Created', $userId, [
            'supplier_id' => $supplierId,
            'supplier_name' => $supplierName,
        ]);
    }

    public static function logSupplierUpdated(int $userId, int $supplierId, string $supplierName, array $changes = []): void
    {
        self::log('Supplier Updated', $userId, array_merge([
            'supplier_id' => $supplierId,
            'supplier_name' => $supplierName,
        ], $changes));
    }

    public static function logSupplierDeleted(int $userId, int $supplierId, string $supplierName): void
    {
        self::log('Supplier Deleted', $userId, [
            'supplier_id' => $supplierId,
            'supplier_name' => $supplierName,
        ]);
    }

    public static function logFloorCreated(int $userId, int $floorId, string $floorName): void
    {
        self::log('Floor Created', $userId, [
            'floor_id' => $floorId,
            'floor_name' => $floorName,
        ]);
    }

    public static function logFloorUpdated(int $userId, int $floorId, string $floorName, array $changes = []): void
    {
        self::log('Floor Updated', $userId, array_merge([
            'floor_id' => $floorId,
            'floor_name' => $floorName,
        ], $changes));
    }

    public static function logFloorDeleted(int $userId, int $floorId, string $floorName): void
    {
        self::log('Floor Deleted', $userId, [
            'floor_id' => $floorId,
            'floor_name' => $floorName,
        ]);
    }

    // ==================== Location Admin Assignments ====================

    public static function logLogAdminAssigned(int $userId, int $logAdminId, int $locationId, string $locationName): void
    {
        self::log('Log Admin Assigned to Location', $userId, [
            'log_admin_id' => $logAdminId,
            'location_id' => $locationId,
            'location_name' => $locationName,
        ]);
    }

    public static function logLogAdminUnassigned(int $userId, int $logAdminId, int $locationId, string $locationName): void
    {
        self::log('Log Admin Unassigned from Location', $userId, [
            'log_admin_id' => $logAdminId,
            'location_id' => $locationId,
            'location_name' => $locationName,
        ]);
    }

    // ==================== Import Operations ====================

    public static function logAssetsImported(int $userId, int $count, array $details = []): void
    {
        self::log('Assets Imported', $userId, array_merge([
            'imported_count' => $count,
        ], $details));
    }

    public static function logImportFailed(int $userId, string $reason, array $details = []): void
    {
        self::log('Import Failed', $userId, array_merge([
            'reason' => $reason,
        ], $details));
    }
}
