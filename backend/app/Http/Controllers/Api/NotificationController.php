<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NotificationRecipient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    /**
     * GET /api/notifications
     * Fetch notifications for the authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Pagination
        $perPage = min(max((int) $request->integer('per_page', 15), 1), 100);
        $page = max((int) $request->integer('page', 1), 1);

        // Filter by read status if provided
        $isRead = $request->query('is_read');
        if ($isRead !== null) {
            $isRead = filter_var($isRead, FILTER_VALIDATE_BOOLEAN);
        }

        $query = NotificationRecipient::with(['notification', 'sender:id,name,email'])
            ->where('recipient_admin_id', $user->id)
            ->orderByRaw('(SELECT created_at FROM notifications WHERE notifications.id = notification_recipients.notification_id) DESC');

        // Apply read status filter
        if ($isRead !== null) {
            $query->where('is_read', $isRead);
        }

        // Paginate
        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        // Format response
        $data = collect($paginator->items())->map(function ($recipient) {
            return [
                'id' => $recipient->id,
                'notification_id' => $recipient->notification_id,
                'title' => $recipient->notification->title ?? null,
                'content' => $recipient->notification->content ?? null,
                'is_read' => $recipient->is_read,
                'read_at' => $recipient->read_at?->toDateTimeString(),
                'created_at' => $recipient->notification->created_at?->toDateTimeString() ?? $recipient->created_at?->toDateTimeString(),
                'sender' => $recipient->sender ? [
                    'id' => $recipient->sender->id,
                    'name' => $recipient->sender->name,
                    'email' => $recipient->sender->email,
                ] : null,
            ];
        });

        return response()->json([
            'data' => $data,
            'total' => $paginator->total(),
            'per_page' => $paginator->perPage(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'unread_count' => NotificationRecipient::where('recipient_admin_id', $user->id)
                ->where('is_read', false)
                ->count(),
        ]);
    }

    /**
     * GET /api/notifications/unread-count
     * Get count of unread notifications
     */
    public function unreadCount(): JsonResponse
    {
        $user = auth()->user();
        
        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $count = NotificationRecipient::where('recipient_admin_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'unread_count' => $count,
        ]);
    }

    /**
     * PUT /api/notifications/{id}/read
     * Mark a specific notification as read
     */
    public function markAsRead(int $id): JsonResponse
    {
        $user = auth()->user();
        
        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $recipient = NotificationRecipient::where('id', $id)
            ->where('recipient_admin_id', $user->id)
            ->first();

        if (!$recipient) {
            return response()->json([
                'message' => 'Notification not found.',
            ], 404);
        }

        if (!$recipient->is_read) {
            $recipient->is_read = true;
            $recipient->read_at = now();
            $recipient->save();
        }

        return response()->json([
            'message' => 'Notification marked as read.',
            'data' => [
                'id' => $recipient->id,
                'notification_id' => $recipient->notification_id,
                'is_read' => $recipient->is_read,
                'read_at' => $recipient->read_at?->toDateTimeString(),
            ],
        ]);
    }

    /**
     * PUT /api/notifications/mark-all-read
     * Mark all notifications as read for the authenticated user
     */
    public function markAllAsRead(): JsonResponse
    {
        $user = auth()->user();
        
        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $updated = NotificationRecipient::where('recipient_admin_id', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json([
            'message' => "{$updated} notification(s) marked as read.",
            'updated_count' => $updated,
        ]);
    }

    /**
     * GET /api/notifications/{id}
     * Get a specific notification details
     */
    public function show(int $id): JsonResponse
    {
        $user = auth()->user();
        
        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $recipient = NotificationRecipient::with(['notification', 'sender:id,name,email'])
            ->where('id', $id)
            ->where('recipient_admin_id', $user->id)
            ->first();

        if (!$recipient) {
            return response()->json([
                'message' => 'Notification not found.',
            ], 404);
        }

        // Auto-mark as read when viewing
        if (!$recipient->is_read) {
            $recipient->is_read = true;
            $recipient->read_at = now();
            $recipient->save();
        }

        return response()->json([
            'data' => [
                'id' => $recipient->id,
                'notification_id' => $recipient->notification_id,
                'title' => $recipient->notification->title ?? null,
                'content' => $recipient->notification->content ?? null,
                'is_read' => $recipient->is_read,
                'read_at' => $recipient->read_at?->toDateTimeString(),
                'created_at' => $recipient->notification->created_at?->toDateTimeString() ?? $recipient->created_at?->toDateTimeString(),
                'sender' => $recipient->sender ? [
                    'id' => $recipient->sender->id,
                    'name' => $recipient->sender->name,
                    'email' => $recipient->sender->email,
                ] : null,
            ],
        ]);
    }

    /**
     * DELETE /api/notifications/{id}
     * Delete a notification (soft delete or hard delete)
     */
    public function destroy(int $id): JsonResponse
    {
        $user = auth()->user();
        
        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $recipient = NotificationRecipient::where('id', $id)
            ->where('recipient_admin_id', $user->id)
            ->first();

        if (!$recipient) {
            return response()->json([
                'message' => 'Notification not found.',
            ], 404);
        }

        $recipient->delete();

        return response()->json([
            'message' => 'Notification deleted successfully.',
        ]);
    }
}
