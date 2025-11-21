<?php

namespace App\Console\Commands;
// use Api\Models\User;
use App\Models\User;


use Illuminate\Console\Command;

class SyncEmployees extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:sync-employees';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        try {

            // === Step 1: Fetch from external API ===


            $appid = '3906765749';
            $secretKey = 'sl4g480ulbuiows9akkhyfg0l247qmtv9m7dq7lk1ymrq';
            $userId = 'USER06';
            $apiUrl = 'http://basmeh-zeitooneh.com/BZ/api/rest_api.php';

            $timestamp = time();
            $strToSign = "timestamp=$timestamp,appid=$appid";
            $hash = hash_hmac('sha256', $strToSign, $secretKey, true);
            $ATMITSignature = base64_encode($hash);

            // Get Token
            $postData = [
                'timestamp' => $timestamp,
                'appid' => $appid,
                'ATMITSignature' => $ATMITSignature,
                'userId' => $userId,
                'operation_type' => 'get_token'
            ];

            $ch = curl_init($apiUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
            $tokenResponse = curl_exec($ch);
            curl_close($ch);

            $tokenResponse = preg_replace('/^\xEF\xBB\xBF/', '', $tokenResponse);
            $tokenData = json_decode($tokenResponse, true);

            if (!isset($tokenData['returned_data'])) {
                throw new \Exception('Failed to retrieve token from external API');
            }

            $tokenuser = $tokenData['returned_data'];

            // Get Employees
            $postData = [
                'timestamp' => $timestamp,
                'appid' => $appid,
                'ATMITSignature' => $ATMITSignature,
                'userId' => $userId,
                'tokenuser' => $tokenuser,
                'operation_type' => 'get_employee_data'
            ];

            $ch = curl_init($apiUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
            $employeeResponse = curl_exec($ch);
            curl_close($ch);

            $employeeResponse = preg_replace('/^\xEF\xBB\xBF/', '', $employeeResponse);
            $employeeData = json_decode($employeeResponse, true);

            if (!isset($employeeData['returned_data'])) {
                throw new \Exception('Failed to retrieve employee data from external API');
            }

            $employees = $employeeData['returned_data'];

            // === Step 2: Sync with Database ===

            foreach ($employees as $emp) {
                // Prepare data
                $emp_id = $emp['ID'] ?? null;
                $emp_no = $emp['EMPLOYEE_NO'] ?? null;
                $emp_name = $emp['VAL'] ?? null;
                $emp_position = $emp['EMPLOYEE_POSITION'] ?? null;
                $emp_branch = $emp['BRANCH'] ?? null;
                
                // Get business email (EMAIL_ADDRESS) and personal email
                $business_email_raw = trim($emp['EMAIL_ADDRESS'] ?? '');
                $business_email = (!empty($business_email_raw) && strtolower($business_email_raw) !== 'n/a') ? $business_email_raw : null;
                
                $personal_email_raw = trim($emp['E_MAIL'] ?? $emp['E_MAIL'] ?? '');
                $personal_email = (!empty($personal_email_raw) && strtolower($personal_email_raw) !== 'n/a') ? $personal_email_raw : null;

                // Sync employee using hr_id as the unique identifier
                $user = User::firstOrNew(['hr_id' => $emp_id]);
                
                // Determine which email to use
                $final_email = null;
                
                if ($business_email) {
                    // Check if business email is already used by a different user
                    $existingUserWithBusinessEmail = User::where('email', $business_email)
                        ->where('hr_id', '!=', $emp_id)
                        ->first();
                    
                    if ($existingUserWithBusinessEmail) {
                        // Business email is taken, use personal email if available
                        if ($personal_email) {
                            $final_email = $personal_email;
                            $this->warn("⚠ Business email '{$business_email}' already used by {$existingUserWithBusinessEmail->name} (HR ID: {$existingUserWithBusinessEmail->hr_id}). Using personal email for {$emp_name} (HR ID: {$emp_id})");
                        } else {
                            // No personal email available, still use business email (since unique constraint is removed)
                            $final_email = $business_email;
                            $this->warn("⚠ Business email '{$business_email}' already used by {$existingUserWithBusinessEmail->name} (HR ID: {$existingUserWithBusinessEmail->hr_id}). No personal email available, using business email for {$emp_name} (HR ID: {$emp_id})");
                        }
                    } else {
                        // Business email is available, use it
                        $final_email = $business_email;
                    }
                } elseif ($personal_email) {
                    // No business email, use personal email
                    $final_email = $personal_email;
                }
                
                $user->fill([
                    'name' => $emp_name,
                    'employee_no' => $emp_no,
                    'email' => $final_email,
                    'position' => $emp_position,
                    'branch' => $emp_branch,
                ]);

                if (!$user->exists) {
                    $user->password = \Hash::make('welcome123');
                }

                if (!$final_email) {
                    $this->warn("⚠ Skipping {$emp_name} — no valid email (business or personal)");
                    continue;
                }

                try {
                    $user->save();
                    $now=Now();
                    $this->line("Synced: {$emp_name} ({$final_email}) at {$now}");
                } catch (\Exception $e) {
                    $this->error("❌ Error syncing {$emp_name}: " . $e->getMessage());
                    continue;
                }


                // User::updateOrCreate(
                //     ['hr_id' => $emp_id], // Condition to find the employee
                //     [
                //         'name'       => $emp_name,
                //         'employee_no'       => $emp_no,
                //         'email'      => $emp_email,
                //         'position'       => $emp_position,
                //         'branch'       => $emp_branch,
                //         'password'    => \Hash::make('welcome123'), // ✅ default password
                //     ] 
                // );
            }

            // Get admin_id from JWT token if available
            // $admin = $request->getAttribute('admin');
            // $adminId = $admin ? $admin->admin_id : 0;


            return true;

        } catch (\Exception $e) {
            $this->error("❌ Error: " . $e->getMessage());

            return false;
        }
    }
}
