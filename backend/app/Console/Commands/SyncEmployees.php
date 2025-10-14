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
                $api_email = trim($emp['E_MAIL'] ?? '');
                $emp_email = (!empty($api_email) && strtolower($api_email) !== 'n/a') ? $api_email : null;


                // Sync employee using emp_no (from API's ID) as the unique identifier.
                // If an employee with this emp_no exists, update it. Otherwise, create a new one.
                $user = User::firstOrNew(['hr_id' => $emp_id]);
                $user->fill([
                    'name' => $emp_name,
                    'employee_no' => $emp_no,
                    'email' => $emp_email ?: null,
                    'position' => $emp_position,
                    'branch' => $emp_branch,
                ]);

                if (!$user->exists) {
                    $user->password = \Hash::make('welcome123');
                }

                // if (!$emp_email) {
                //     $this->warn("⚠ Skipping {$emp_name} — no valid email");
                //     continue;
                // }

                $user->save();
                $now=Now();

                $this->line("Synced: {$emp_name} ({$emp_email}) at {$now}");


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
            $this->error("❌ Error syncing {$emp['VAL']}: " . $e->getMessage());

            return false;
        }
    }
}
