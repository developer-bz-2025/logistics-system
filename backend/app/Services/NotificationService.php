<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\NotificationRecipient;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class NotificationService
{
    /**
     * Send notification to specific user(s)
     */
    public static function sendNotification(
        string $title,
        string $content,
        int $senderId,
        array $recipientIds
    ): Notification {
        $notification = Notification::create([
            'title' => $title,
            'content' => $content,
            'created_at' => now(),
        ]);

        foreach ($recipientIds as $recipientId) {
            NotificationRecipient::create([
                'notification_id' => $notification->id,
                'sender_admin_id' => $senderId,
                'recipient_admin_id' => $recipientId,
                'is_read' => false,
            ]);
        }

        return $notification;
    }

    /**
     * Send notification to all users with a specific role
     */
    public static function sendNotificationToRole(
        string $title,
        string $content,
        int $senderId,
        string $roleName
    ): Notification {
        $role = Role::where('name', $roleName)->first();
        
        if (!$role) {
            throw new \Exception("Role '{$roleName}' not found");
        }

        $recipientIds = User::where('role_id', $role->id)
            ->pluck('id')
            ->toArray();

        if (empty($recipientIds)) {
            // Create notification anyway, but with no recipients
            return Notification::create([
                'title' => $title,
                'content' => $content,
                'created_at' => now(),
            ]);
        }

        return self::sendNotification($title, $content, $senderId, $recipientIds);
    }

    /**
     * Send notification to log admins assigned to a specific location
     */
    public static function sendNotificationToLocationAdmins(
        string $title,
        string $content,
        int $senderId,
        int $locationId
    ): Notification {
        $logAdminRoleId = Role::where('name', Role::LOG_ADMIN)->value('id');
        
        if (!$logAdminRoleId) {
            throw new \Exception("Log admin role not found");
        }

        $recipientIds = DB::table('user_locations')
            ->join('users', 'user_locations.user_id', '=', 'users.id')
            ->where('user_locations.location_id', $locationId)
            ->where('users.role_id', $logAdminRoleId)
            ->pluck('users.id')
            ->toArray();

        if (empty($recipientIds)) {
            // Create notification anyway, but with no recipients
            return Notification::create([
                'title' => $title,
                'content' => $content,
                'created_at' => now(),
            ]);
        }

        return self::sendNotification($title, $content, $senderId, $recipientIds);
    }

    /**
     * Notify log admin when location change request is received
     */
    public static function notifyLocationChangeRequestReceived(
        int $requestId,
        int $itemId,
        string $itemDescription,
        string $currentLocationName,
        string $requestedLocationName,
        int $requesterId,
        string $requesterName,
        int $requestedLocationId
    ): void {
        // Fetch fixed item name
        $fixedItemName = DB::table('items')
            ->join('fixed_items', 'items.fixed_item_id', '=', 'fixed_items.id')
            ->where('items.id', $itemId)
            ->value('fixed_items.name') ?? 'Unknown Item';

        $title = 'New Location Change Request';
        $content = "A location change request has been received for item '{$fixedItemName}'. " .
                   "Requested to move from '{$currentLocationName}' to '{$requestedLocationName}' by {$requesterName}.";

        self::sendNotificationToLocationAdmins(
            $title,
            $content,
            $requesterId,
            $requestedLocationId
        );
    }

    /**
     * Notify requester when location change request is approved
     */
    public static function notifyLocationChangeRequestApproved(
        int $requestId,
        int $itemId,
        string $itemDescription,
        string $currentLocationName,
        string $newLocationName,
        int $approverId,
        string $approverName,
        int $requesterId
    ): void {
        // Fetch fixed item name
        $fixedItemName = DB::table('items')
            ->join('fixed_items', 'items.fixed_item_id', '=', 'fixed_items.id')
            ->where('items.id', $itemId)
            ->value('fixed_items.name') ?? 'Unknown Item';

        $title = 'Location Change Request Approved';
        $content = "Your location change request for item '{$fixedItemName}' has been approved by {$approverName}. " .
                   "Item moved from '{$currentLocationName}' to '{$newLocationName}'.";

        self::sendNotification($title, $content, $approverId, [$requesterId]);
    }

    /**
     * Notify requester when location change request is rejected
     */
    public static function notifyLocationChangeRequestRejected(
        int $requestId,
        int $itemId,
        string $itemDescription,
        string $currentLocationName,
        string $requestedLocationName,
        int $rejecterId,
        string $rejecterName,
        int $requesterId,
        ?string $reason = null
    ): void {
        // Fetch fixed item name
        $fixedItemName = DB::table('items')
            ->join('fixed_items', 'items.fixed_item_id', '=', 'fixed_items.id')
            ->where('items.id', $itemId)
            ->value('fixed_items.name') ?? 'Unknown Item';

        $reasonText = $reason ? " Reason: {$reason}" : '';
        $title = 'Location Change Request Rejected';
        $content = "Your location change request for item '{$fixedItemName}' has been rejected by {$rejecterName}. " .
                   "Requested move from '{$currentLocationName}' to '{$requestedLocationName}'.{$reasonText}";

        self::sendNotification($title, $content, $rejecterId, [$requesterId]);
    }

    /**
     * Notify super admin when PR edit request is submitted
     */
    public static function notifyPrEditRequestSubmitted(
        int $requestId,
        string $prCode,
        int $requesterId,
        string $requesterName
    ): void {
        $title = 'New PR Edit Request';
        $content = "PR admin {$requesterName} has submitted an edit request for PR '{$prCode}'. " .
                   "Please review and approve or reject the request.";

        self::sendNotificationToRole(
            $title,
            $content,
            $requesterId,
            Role::SUPER_ADMIN
        );
    }

    /**
     * Notify PR admin when PR edit request is approved
     */
    public static function notifyPrEditRequestApproved(
        int $requestId,
        string $prCode,
        int $approverId,
        string $approverName,
        int $requesterId
    ): void {
        $title = 'PR Edit Request Approved';
        $content = "Your edit request for PR '{$prCode}' has been approved by {$approverName}. " .
                   "The changes have been applied to the PR.";

        self::sendNotification($title, $content, $approverId, [$requesterId]);
    }

    /**
     * Notify PR admin when PR edit request is rejected
     */
    public static function notifyPrEditRequestRejected(
        int $requestId,
        string $prCode,
        int $rejecterId,
        string $rejecterName,
        int $requesterId,
        ?string $reason = null
    ): void {
        $reasonText = $reason ? " Reason: {$reason}" : '';
        $title = 'PR Edit Request Rejected';
        $content = "Your edit request for PR '{$prCode}' has been rejected by {$rejecterName}.{$reasonText}";

        self::sendNotification($title, $content, $rejecterId, [$requesterId]);
    }

    /**
     * Notify when item edit request is submitted (to super admin)
     */
    public static function notifyItemEditRequestSubmitted(
        int $requestId,
        int $itemId,
        string $itemDescription,
        int $requesterId,
        string $requesterName
    ): void {
        $title = 'New Item Edit Request';
        $content = "Log admin {$requesterName} has submitted an edit request for item '{$itemDescription}'. " .
                   "Please review and approve or reject the request.";

        self::sendNotificationToRole(
            $title,
            $content,
            $requesterId,
            Role::SUPER_ADMIN
        );
    }

    /**
     * Notify when item edit request is approved
     */
    public static function notifyItemEditRequestApproved(
        int $requestId,
        int $itemId,
        string $itemDescription,
        int $approverId,
        string $approverName,
        int $requesterId
    ): void {
        $title = 'Item Edit Request Approved';
        $content = "Your edit request for item '{$itemDescription}' has been approved by {$approverName}. " .
                   "The changes have been applied to the item.";

        self::sendNotification($title, $content, $approverId, [$requesterId]);
    }

    /**
     * Notify when item edit request is rejected
     */
    public static function notifyItemEditRequestRejected(
        int $requestId,
        int $itemId,
        string $itemDescription,
        int $rejecterId,
        string $rejecterName,
        int $requesterId,
        ?string $reason = null
    ): void {
        $reasonText = $reason ? " Reason: {$reason}" : '';
        $title = 'Item Edit Request Rejected';
        $content = "Your edit request for item '{$itemDescription}' has been rejected by {$rejecterName}.{$reasonText}";

        self::sendNotification($title, $content, $rejecterId, [$requesterId]);
    }
}
