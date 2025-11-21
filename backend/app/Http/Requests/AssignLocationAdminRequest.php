<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssignLocationAdminRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'user_id'        => ['required', 'integer', 'exists:users,id'],
            'location_ids'   => ['required', 'array', 'min:1'],
            'location_ids.*' => ['integer', 'distinct', 'exists:locations,id'],
        ];
    }
}

