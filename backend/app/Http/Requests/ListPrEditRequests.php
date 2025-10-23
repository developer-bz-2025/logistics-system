<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ListPrEditRequests extends FormRequest
{
    // public function authorize(): bool|null { return $this->user()?->can('approve-pr-edit-requests'); }

    public function rules()
    {
        return [
            'page'      => ['sometimes','integer','min:1'],
            'per_page'  => ['sometimes','integer','min:1','max:100'],
            'status'    => ['sometimes','string'], // "Pending,Approved,Rejected" (comma-separated or single)
            'q'         => ['sometimes','string','max:200'], // searches pr_code and requester name/email
            'from'      => ['sometimes','date'],   // request_date >= from
            'to'        => ['sometimes','date'],   // request_date <= to
            'include'   => ['sometimes','string'], // items,pr,requester
            'sort'      => ['sometimes','string'], // e.g. "-request_date", "pr_code"
        ];
    }
}