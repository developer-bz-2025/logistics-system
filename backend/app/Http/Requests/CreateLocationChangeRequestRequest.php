<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateLocationChangeRequestRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'item_id' => ['required', 'integer', 'exists:items,id'],
            'requested_location_id' => ['required', 'integer', 'exists:locations,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'item_id.required' => 'The item ID is required.',
            'item_id.exists' => 'The selected item does not exist.',
            'requested_location_id.required' => 'The requested location ID is required.',
            'requested_location_id.exists' => 'The selected location does not exist.',
            'notes.max' => 'The notes may not be greater than 1000 characters.',
        ];
    }
}

