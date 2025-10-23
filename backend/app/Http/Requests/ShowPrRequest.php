<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ShowPrRequest extends FormRequest
{
    public function authorize() { return auth()->check(); } // tighten later if needed
    public function rules() {
        return [
            'include' => ['nullable','string'], // e.g. "items,supplier,fixedItem"
        ];
    }
}