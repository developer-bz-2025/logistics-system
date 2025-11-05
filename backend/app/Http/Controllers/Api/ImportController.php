<?php
namespace App\Http\Controllers\Api;

use App\Http\Requests\ImportAssetsRequest;
use App\Services\ImportAssetsService;
use App\Http\Controllers\Controller;

use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ImportController extends Controller
{
// use PhpOffice\PhpSpreadsheet\IOFactory; // <-- not needed in controller now

public function import(ImportAssetsRequest $request, ImportAssetsService $service)
{
    // Choose the disk you really use. If your root is storage/app/private, use 'private'.
    // If you want storage/app, use 'local'.
    $disk = 'local'; // or 'local' — but be consistent!

    // 1) Store on that disk
    $relPath = $request->file('file')->store('imports', $disk); // e.g. imports/xyz.xlsx

    // 2) Resolve absolute path from the SAME disk
    $absPath = Storage::disk($disk)->path($relPath);

    // 3) Sanity
    if (!is_file($absPath)) {
        logger()->error('Stored file not found', compact('disk','relPath','absPath'));
        abort(400, "Stored file not found: {$absPath}");
    }

    // (Optional) Normalize slashes for Windows
    $absPath = str_replace('\\', '/', $absPath);

    logger()->info('import path', [
        'path'   => $relPath,
        'abs'    => $absPath,
        'exists' => file_exists($absPath),
        'is_file'=> is_file($absPath),
    ]);

    // 4) Pass the SAME absolute path to the service
    [$summary, $report] = $service->run($absPath);

    return response()->json([
        'ok'      => true,
        'summary' => $summary,
        'report'  => $report,
    ]);
}

}
