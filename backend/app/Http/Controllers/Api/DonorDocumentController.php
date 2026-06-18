<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Donor;
use App\Models\DonorDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DonorDocumentController extends Controller
{
    /**
     * GET /api/finance/donors/{donorId}/documents
     */
    public function index(int $donorId)
    {
        Donor::findOrFail($donorId);

        $documents = DonorDocument::query()
            ->where('donor_id', $donorId)
            ->with('uploader:id,name')
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $documents]);
    }

    /**
     * POST /api/finance/donors/{donorId}/documents
     */
    public function store(Request $request, int $donorId)
    {
        $donor = Donor::findOrFail($donorId);

        $validated = $request->validate([
            'document' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:10240'],
        ], [
            'document.mimes' => 'The document must be a file of type: pdf, doc, docx and be less than 10 MB.',
            'document.max' => 'The document must be a file of type: pdf, doc, docx and be less than 10 MB.',
        ]);

        $file = $request->file('document');
        $ext = $file->getClientOriginalExtension();
        $safe = preg_replace('/[^A-Za-z0-9\-\_\.]/', '-', $donor->donor);
        $storedName = "{$safe}_{$donor->id}_" . now()->format('YmdHis') . ".{$ext}";
        $path = $file->storeAs('donors/documents', $storedName, 'public');

        $document = DonorDocument::create([
            'donor_id' => $donor->id,
            'original_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'mime_type' => $file->getClientMimeType(),
            'uploaded_by' => $request->user()?->id,
        ]);

        $document->load('uploader:id,name');

        return response()->json($document, 201);
    }

    /**
     * DELETE /api/finance/donors/{donorId}/documents/{documentId}
     */
    public function destroy(int $donorId, int $documentId)
    {
        $document = DonorDocument::query()
            ->where('donor_id', $donorId)
            ->where('id', $documentId)
            ->firstOrFail();

        if ($document->file_path && Storage::disk('public')->exists($document->file_path)) {
            Storage::disk('public')->delete($document->file_path);
        }

        $document->delete();

        return response()->json(['message' => 'Document deleted successfully.']);
    }
}
