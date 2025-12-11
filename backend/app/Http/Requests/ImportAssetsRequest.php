<?php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ImportAssetsRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'file' => ['required','file','mimes:xlsx,xls','max:51200'], // 50MB max
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'Please select a file to upload.',
            'file.file' => 'The uploaded file is invalid.',
            'file.mimes' => 'The file must be an Excel file (.xlsx or .xls).',
            'file.max' => 'The file size must not exceed 50MB.',
        ];
    }
}
