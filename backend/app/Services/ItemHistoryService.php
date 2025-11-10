<?php

namespace App\Services;

use App\Models\ItemHistory;
use Illuminate\Support\Facades\Auth;

class ItemHistoryService
{
    /**
     * Log an item history event
     *
     * @param int $itemId
     * @param string $eventType
     * @param string|null $summary
     * @param array|null $payload
     * @param int|null $byUserId
     * @return ItemHistory
     */
    public static function logEvent(
        int $itemId,
        string $eventType,
        ?string $summary = null,
        ?array $payload = null,
        ?int $byUserId = null
    ): ItemHistory {
        // Use authenticated user if no user ID provided
        if ($byUserId === null && Auth::check()) {
            $byUserId = Auth::id();
        }

        return ItemHistory::create([
            'item_id' => $itemId,
            'event_type' => $eventType,
            'summary' => $summary,
            'by_user_id' => $byUserId,
            'payload' => $payload,
            'accurred_at' => now(),
        ]);
    }

    /**
     * Log item creation
     */
    public static function logItemCreated(int $itemId, array $itemData = []): ItemHistory
    {
        return self::logEvent(
            $itemId,
            'created',
            'Item created',
            ['item_data' => $itemData]
        );
    }

    /**
     * Log item update
     */
    public static function logItemUpdated(int $itemId, array $changes = []): ItemHistory
    {
        $summary = 'Item updated';
        if (!empty($changes)) {
            $changedFields = array_keys($changes);
            $summary = 'Updated: ' . implode(', ', $changedFields);
        }

        return self::logEvent(
            $itemId,
            'updated',
            $summary,
            ['changes' => $changes]
        );
    }

    /**
     * Log location change
     */
    public static function logLocationChanged(int $itemId, $oldLocation, $newLocation): ItemHistory
    {
        $oldName = is_object($oldLocation) ? $oldLocation->name : $oldLocation;
        $newName = is_object($newLocation) ? $newLocation->name : $newLocation;

        return self::logEvent(
            $itemId,
            'location_changed',
            "Location: {$oldName} → {$newName}",
            [
                'old_location' => $oldName,
                'new_location' => $newName,
                'old_location_id' => is_object($oldLocation) ? $oldLocation->id : null,
                'new_location_id' => is_object($newLocation) ? $newLocation->id : null,
            ]
        );
    }

    /**
     * Log status change
     */
    public static function logStatusChanged(int $itemId, $oldStatus, $newStatus): ItemHistory
    {
        $oldName = is_object($oldStatus) ? $oldStatus->name : $oldStatus;
        $newName = is_object($newStatus) ? $newStatus->name : $newStatus;

        return self::logEvent(
            $itemId,
            'status_changed',
            "Status: {$oldName} → {$newName}",
            [
                'old_status' => $oldName,
                'new_status' => $newName,
                'old_status_id' => is_object($oldStatus) ? $oldStatus->id : null,
                'new_status_id' => is_object($newStatus) ? $newStatus->id : null,
            ]
        );
    }

    /**
     * Log holder/user assignment
     */
    public static function logHolderAssigned(int $itemId, $oldHolder, $newHolder): ItemHistory
    {
        $oldName = $oldHolder ? (is_object($oldHolder) ? $oldHolder->name : $oldHolder) : 'Unassigned';
        $newName = $newHolder ? (is_object($newHolder) ? $newHolder->name : $newHolder) : 'Unassigned';

        return self::logEvent(
            $itemId,
            'holder_assigned',
            "Holder: {$oldName} → {$newName}",
            [
                'old_holder' => $oldName,
                'new_holder' => $newName,
                'old_holder_id' => is_object($oldHolder) ? $oldHolder->id : null,
                'new_holder_id' => is_object($newHolder) ? $newHolder->id : null,
            ]
        );
    }

    /**
     * Log brand change
     */
    public static function logBrandChanged(int $itemId, $oldBrand, $newBrand): ItemHistory
    {
        $oldName = $oldBrand ? (is_object($oldBrand) ? $oldBrand->name : $oldBrand) : 'None';
        $newName = $newBrand ? (is_object($newBrand) ? $newBrand->name : $newBrand) : 'None';

        return self::logEvent(
            $itemId,
            'brand_changed',
            "Brand: {$oldName} → {$newName}",
            [
                'old_brand' => $oldName,
                'new_brand' => $newName,
                'old_brand_id' => is_object($oldBrand) ? $oldBrand->id : null,
                'new_brand_id' => is_object($newBrand) ? $newBrand->id : null,
            ]
        );
    }

    /**
     * Log color change
     */
    public static function logColorChanged(int $itemId, $oldColor, $newColor): ItemHistory
    {
        $oldName = $oldColor ? (is_object($oldColor) ? $oldColor->name : $oldColor) : 'None';
        $newName = $newColor ? (is_object($newColor) ? $newColor->name : $newColor) : 'None';

        return self::logEvent(
            $itemId,
            'color_changed',
            "Color: {$oldName} → {$newName}",
            [
                'old_color' => $oldName,
                'new_color' => $newName,
                'old_color_id' => is_object($oldColor) ? $oldColor->id : null,
                'new_color_id' => is_object($newColor) ? $newColor->id : null,
            ]
        );
    }

    /**
     * Log attributes change
     */
    public static function logAttributesChanged(int $itemId, array $changes = []): ItemHistory
    {
        return self::logEvent(
            $itemId,
            'attributes_changed',
            'Item attributes updated',
            ['attribute_changes' => $changes]
        );
    }

    /**
     * Log PR linkage
     */
    public static function logPrLinked(int $itemId, int $prId, string $prNumber): ItemHistory
    {
        return self::logEvent(
            $itemId,
            'pr_linked',
            "Linked to PR #{$prNumber}",
            ['pr_id' => $prId, 'pr_number' => $prNumber]
        );
    }

    /**
     * Log PR unlinked
     */
    public static function logPrUnlinked(int $itemId, int $prId, string $prNumber): ItemHistory
    {
        return self::logEvent(
            $itemId,
            'pr_unlinked',
            "Unlinked from PR #{$prNumber}",
            ['pr_id' => $prId, 'pr_number' => $prNumber]
        );
    }

    /**
     * Log maintenance in
     */
    public static function logMaintenanceIn(int $itemId, ?string $reason = null): ItemHistory
    {
        return self::logEvent(
            $itemId,
            'maintenance_in',
            'Sent for maintenance' . ($reason ? ": {$reason}" : ''),
            ['reason' => $reason]
        );
    }

    /**
     * Log maintenance out
     */
    public static function logMaintenanceOut(int $itemId, ?string $notes = null): ItemHistory
    {
        return self::logEvent(
            $itemId,
            'maintenance_out',
            'Returned from maintenance' . ($notes ? ": {$notes}" : ''),
            ['notes' => $notes]
        );
    }

    /**
     * Log maintenance status change
     */
    public static function logMaintenanceStatusChanged(int $itemId, $oldStatus, $newStatus): ItemHistory
    {
        $oldName = is_object($oldStatus) ? $oldStatus->name : $oldStatus;
        $newName = is_object($newStatus) ? $newStatus->name : $newStatus;

        return self::logEvent(
            $itemId,
            'maintenance_status_changed',
            "Maintenance status: {$oldName} → {$newName}",
            [
                'old_status' => $oldName,
                'new_status' => $newName,
                'old_status_id' => is_object($oldStatus) ? $oldStatus->id : null,
                'new_status_id' => is_object($newStatus) ? $newStatus->id : null,
            ]
        );
    }

    /**
     * Log edit request submitted
     */
    public static function logEditRequestSubmitted(int $itemId, int $requestId): ItemHistory
    {
        return self::logEvent(
            $itemId,
            'edit_request_submitted',
            'Edit request submitted',
            ['edit_request_id' => $requestId]
        );
    }

    /**
     * Log edit request approved
     */
    public static function logEditRequestApproved(int $itemId, int $requestId): ItemHistory
    {
        return self::logEvent(
            $itemId,
            'edit_request_approved',
            'Edit request approved',
            ['edit_request_id' => $requestId]
        );
    }

    /**
     * Log edit request rejected
     */
    public static function logEditRequestRejected(int $itemId, int $requestId, ?string $reason = null): ItemHistory
    {
        return self::logEvent(
            $itemId,
            'edit_request_rejected',
            'Edit request rejected' . ($reason ? ": {$reason}" : ''),
            ['edit_request_id' => $requestId, 'reason' => $reason]
        );
    }
}
