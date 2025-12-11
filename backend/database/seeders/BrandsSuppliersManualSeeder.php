<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BrandsSuppliersManualSeeder extends Seeder
{
    public function run(): void
    {
        // Truncate existing data for fresh seeding
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('supplier_category')->truncate();
        DB::table('brand_category')->truncate();
        DB::table('suppliers')->truncate();
        DB::table('brands')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // ----------------------------
        // 0) Category aliases (be flexible with names)
        // ----------------------------
        $categoryAliases = [
            'Furniture' => ['Furniture'],
            'Appliances' => ['Appliances'],
            'Machine' => ['Machine', 'machin'],
            'Vehicles' => ['Vehicles'],
            // Support either a merged label or the three separate categories
            'Computer & Electronics & IT_Equipment' => [
                'Computer & Electronics & IT_Equipment', 'Computer', 'Electronics', 'IT_Equipment'
            ],
        ];

        // Map category name in DB => one of the keys above
        $catIdByName = DB::table('categories')->pluck('id', 'name')->toArray();

        $categoryIdsByGroup = [
            'Furniture' => [],
            'Appliances' => [],
            'Machine' => [],
            'Vehicles' => [],
            'Computer & Electronics & IT_Equipment' => [],
        ];

        foreach ($categoryAliases as $groupKey => $aliases) {
            foreach ($aliases as $alias) {
                if (isset($catIdByName[$alias])) {
                    $categoryIdsByGroup[$groupKey][] = $catIdByName[$alias];
                }
            }
        }

        // ----------------------------
        // 1) BRANDS
        // ----------------------------
        $brandsByGroup = [
            // Furniture + Appliances + Machine share these brands
            'FAM' => [
                'NA','Samsung','LG','Whirlpool','Bosch','GE Appliances','Electrolux','Haier','Frigidaire',
                'Maytag','KitchenAid','Miele','Panasonic','Philips','Sharp','Siemens','Arcelik','Beko',
                'Gorenje','Smeg','Fisher & Paykel','Queen chef','GFERRARI','Tecno naf','Sunny','ONYX','PAN POWER','Al Shams','Condor',
                'MEDia','TCL','GSFerari','Tecnomatic','Savo','Yildiz','General','Comp','Cool','Queen','Chef','Tecnoline','Gold',
                'KSM','Lammily','Starsat','Campomatic','Midea','Galanz','AIRREX','LOGIK','Awael','Atlas','Tuff','Bull','Hitachi',
                'IDEA','Pronex','Vikvision','HIKVISION','Marsriva','Tenda','V-Link','Netis','Super','Deluxe','Longson','Romeo',
                'Prado','PCD','Fanshine','Kuchef','Vitec','Gree','Star','JVC'
            ],
            'Vehicles' => [
                'NA','Yamaha','Honda','SYM','Baotian','TaoTao','Znen','Akkad',
                'Toyota','Lexus','Nissan','Infiniti','Acura','Mazda','Mitsubishi','Subaru','Suzuki','Daihatsu',
                'Kia','Genesis','Geely','BYD','Ford','Changan','Chery','Opel','Fiat','Chevrolet',
                'Cadillac','GMC','Chrysler','isuzu','Jeep','Mercedes-Benz','Volkswagen','Audi','BMW','Mini',
                'Renault','Peugeot','Citroën','Jaguar','Land Rover','Volvo','Lada',
            ],
            'CEI' => [
                'Dell','HP','Lenovo','Apple','ASUS','Acer','MSI','Microsoft',
                'IBM','Cisco','Huawei','TP-Link','Netgear','Ubiquiti','D-Link','Juniper','Fortinet',
                'Western Digital','Seagate','Toshiba','Kingston','Crucial','Synology','QNAP',
                'Canon','Epson','Brother','Ricoh','Xerox','Logitech','Razer',
                'BenQ','NEC','ViewSonic','Hyundai'
            ],
        ];

        // Upsert all brands
        // Clean brand names: remove trailing commas and trim whitespace
        $cleanBrandName = function($name) {
            return trim(rtrim($name, ','));
        };
        
        $allBrands = array_merge(
            array_map($cleanBrandName, $brandsByGroup['FAM']),
            array_map($cleanBrandName, $brandsByGroup['Vehicles']),
            array_map($cleanBrandName, $brandsByGroup['CEI'])
        );
        
        $brandNames = array_values(array_unique($allBrands));
        
        DB::table('brands')->upsert(
            array_map(fn($n) => ['name' => $n], $brandNames),
            ['name'],
            []
        );
        $brandIdByName = DB::table('brands')->pluck('id', 'name')->toArray();

        // Attach brand_category
        $attachBrandPairs = [];

        // FAM brands go to Furniture + Appliances + Machine groups (whatever exists)
        foreach (['Furniture','Appliances','Machine'] as $grp) {
            foreach ($categoryIdsByGroup[$grp] as $catId) {
                foreach ($brandsByGroup['FAM'] as $b) {
                    if (isset($brandIdByName[$b])) {
                        $attachBrandPairs[$catId.'::'.$brandIdByName[$b]] = [
                            'category_id' => $catId,
                            'brand_id'    => $brandIdByName[$b],
                        ];
                    }
                }
            }
        }
        // Vehicles brands
        foreach ($categoryIdsByGroup['Vehicles'] as $catId) {
            foreach ($brandsByGroup['Vehicles'] as $b) {
                if (isset($brandIdByName[$b])) {
                    $attachBrandPairs[$catId.'::'.$brandIdByName[$b]] = [
                        'category_id' => $catId,
                        'brand_id'    => $brandIdByName[$b],
                    ];
                }
            }
        }
        // Computer/Electronics/IT_Equipment brands
        foreach ($categoryIdsByGroup['Computer & Electronics & IT_Equipment'] as $catId) {
            foreach ($brandsByGroup['CEI'] as $b) {
                if (isset($brandIdByName[$b])) {
                    $attachBrandPairs[$catId.'::'.$brandIdByName[$b]] = [
                        'category_id' => $catId,
                        'brand_id'    => $brandIdByName[$b],
                    ];
                }
            }
        }

        if (!empty($attachBrandPairs)) {
            DB::table('brand_category')->upsert(
                array_values($attachBrandPairs),
                ['brand_id','category_id'],
                []
            );
        }

        // ----------------------------
        // 2) SUPPLIERS
        // ----------------------------
        $suppliersByCategory = [
            // Furniture
            'Furniture' => [
                'Al Maktab','Alain Moubarak','BUREAUTICO PLUS S.A.R.L.','bureautico plus sarl','cedar office center','Crown House',
                'Farah','Fliefel','Galerie Al Jarrah','Galerie Pratique','Hawa Center Office Furniture','Home Center','Jarrah Group',
                'K. Fleifel Ind. Co. Sarl','K. Fleifel ltd. Co. Sarl','Kamaplast','Moebel – Office Work Center','Office Design & Supplies','Opaque (Curtains)',
                'OWC','Panda Plast','PolyForm','WAMCO s.a.r.l. (Window films)','شركة غاليري جراح ش.م.م',
                'شركة فادي حمزة ش.م.م','مؤسسة المرعبي','شركة رفدن','شركة مفروشات الديبلو','في ريام للمفروشات',
                'KCOM OFFICE SOLUTION','Furniture Trading Center','AL Nour Sawmill','Issam EST','Upper group','Societe Kassab','Fleifel'
            ],
            // Appliances
            'Appliances' => [
                'Agha Sarkissian','CTC Samsung','Hajj Electronics','Karam Electronics','Kassis Electric','Khoury Home','Power Care',
                'Sami Kotob City','Mtayrek Electrics','Mleyrek Electrics','Hamdan Electronics','Azar Fire Protection','BFS system','U.S system',
                'Java Fire Protection','Jawa Fire Protection','Moghnieh Fire','Moytmieh Fire','Smart Security','Zod Security','Helesco',
                'Victoria Fire','SOS','IT Capital','Malik`s Book shop','Tannourine Water Co. SAL','AlTalyani library','Dar Elchimal',
                'Te Vega','Kassem Jarrah','Central Pharmacy','AT&C (Allam trading)','K6 TECH','KO TECH','Arope','Jihad Jamil Saleh','Jahed Jamal Saleh','Awad trading','Techno Solution'
            ],
            // Machine
            'Machine' => [
                'Combat Lebanon','Pest Off','Boecker','Insecta lb','Insecta Is','S.D.C','SIAD Pest conrol','SIAD Post conrol',
                'Azar Fire Protection S.A.L','Fitzpatrick','Maison De La Securite','SOS','Wisehouse','Zod Security','Wamco',
                'N.S.N international s.a.r.l.','Bisco','Ets. Nada N. Nehme','Ets. Nada N. Nohme','Jonco M E Trading','Jonco ME Trading',
                'Turuqoise','Turuquoise','Pharmacie Sarafian','Royal Medicare','Baldaty','Garo Sewing','Hani Gizi Sewing',
                'Al Awaeel company','Al Awael company','SMEC','FS Energy','Fasco','Fason','Technosolution',
            ],
            // Vehicles
            'Vehicles' => [
                'Advanced Car','AVIS','bassam shaker','Bassam Shukair','Charlie Rent A Car','Hala Group','Infifnity group','Infinity Group',
                'Mike Rent a Car','Force','Leadin rental company (LERCOM)','Najib Rent a car','HOZ Rent a Car','Fara Rent a Car','Fares Rent a Car','Bassoul Heneine'
            ],
            // CEI (Computer & Electronics & IT_Equipment)
            'Computer & Electronics & IT_Equipment' => [
                'Adkom','Ahmad ALI taleb','Al Hatem est','ANF','CMC Crystal Mobile Communication','Electro City','Frost -tech','habli est','habib est',
                'Hassan Bros.','Hassan Raas','Hijazi Group','connexions','Aims','MAT','Metal Fabric','Murooly','Mojitech sarl','Mojteh sarl',
                'Qabassat','Gabsnet','Rasheed electric','Sbeity Computers','GIGANET','GGANFT','Space technology','Soace technology',
                'Traboulsi est.','Traboulsi est','YS electronics','مؤسسة غوى','مؤسسة خوري','Nawf Trading and Contracting',
                'Nasr Trading and Contracting','Hamdan Electronics','Azz Group','MAF','Dib Hanna Ibrahim','Dili Hense Ibrahim',
                'Active Tech Services','Maassarani Electronics','Massarani Electronics','Abed Tahan','Al Haceb','Antaki - Burotek','Antaki - Buretak',
                'Bugs','CCT','CCI','Compudata','Compulife','Computer Business Machine (CBM)','Compuworld','Dabbous Mega Supplies','Domtech','Damtech',
                'CCG - Consolidated Consultancy Group','Guardia Systems','Hiperdist','ICCS','Insight Solutions','Interlink','Intracom Telecom',
                'Karam Electronics','Libatech','Microtech','Multitech','NBC','NTC','Plexus Invest','Quantech',
                'Qabassat Computers','Qabasat Computers','Secure Edge','SIS Technology','SME S.A.R.L','SMF S.A.R.L','Star Computer Company',
                'Super Dealer','Super Doctor','Teletrade -Multimedia Megastores','Teletrade - Multimedia Megastores','Uni Lebanon SAL',
                'Sbeity Computer','Sbeity Computers','ECA','BCA','Ayoub','Provideo','Provides','Titan Technologies Inc Sal','Lilian Technologies Inc Sal',
                'TRACCS Lebanon Company','Pancrop Supplies & Services','Computel','Selfani Tech SARL','Selfani Tech sarl','Kassiss Electric',
                'Black box .com','Blackbox.com','Multi-Tech SARL','Technomania','El-Haceb company SAL','Triplec','InterTech','ITG','ITS','Smartech','EXO',
                'ESCO fathallah ( UPS and Battery )','ESCO Faddallah (UPS and Battery)','Click tech','Clicktech','Terranet','Tomanel',
                'Sodetel','Societel','Wise','IDM','techpunto','ETI','Zero 3 co','IB Hayek','Class road','ALFA','Touch','Elite cell','Mr. Pure','Versalink','NCTS'
            ],
        ];

        // Upsert suppliers (flat list)
        // Clean supplier names: remove trailing commas and trim whitespace
        $cleanSupplierName = function($name) {
            return trim(rtrim($name, ','));
        };
        
        $allSupplierNames = [];
        foreach ($suppliersByCategory as $catName => $list) {
            $cleanedList = array_map($cleanSupplierName, $list);
            $allSupplierNames = array_merge($allSupplierNames, $cleanedList);
        }
        $allSupplierNames = array_values(array_unique($allSupplierNames));

        DB::table('suppliers')->upsert(
            array_map(fn($n) => ['name' => $n, 'phone' => null, 'address' => null, 'email' => null, 'docs' => null], $allSupplierNames),
            ['name'],
            ['phone','address','email','docs']
        );
        $supplierIdByName = DB::table('suppliers')->pluck('id', 'name')->toArray();

        // Attach supplier_category
        $attachSupplierPairs = [];

        // Furniture
        foreach ($categoryIdsByGroup['Furniture'] as $catId) {
            foreach ($suppliersByCategory['Furniture'] as $s) {
                if (isset($supplierIdByName[$s])) {
                    $attachSupplierPairs[$catId.'::'.$supplierIdByName[$s]] = [
                        'category_id' => $catId,
                        'supplier_id' => $supplierIdByName[$s],
                    ];
                }
            }
        }
        // Appliances
        foreach ($categoryIdsByGroup['Appliances'] as $catId) {
            foreach ($suppliersByCategory['Appliances'] as $s) {
                if (isset($supplierIdByName[$s])) {
                    $attachSupplierPairs[$catId.'::'.$supplierIdByName[$s]] = [
                        'category_id' => $catId,
                        'supplier_id' => $supplierIdByName[$s],
                    ];
                }
            }
        }
        // Machine
        foreach ($categoryIdsByGroup['Machine'] as $catId) {
            foreach ($suppliersByCategory['Machine'] as $s) {
                if (isset($supplierIdByName[$s])) {
                    $attachSupplierPairs[$catId.'::'.$supplierIdByName[$s]] = [
                        'category_id' => $catId,
                        'supplier_id' => $supplierIdByName[$s],
                    ];
                }
            }
        }
        // Vehicles
        foreach ($categoryIdsByGroup['Vehicles'] as $catId) {
            foreach ($suppliersByCategory['Vehicles'] as $s) {
                if (isset($supplierIdByName[$s])) {
                    $attachSupplierPairs[$catId.'::'.$supplierIdByName[$s]] = [
                        'category_id' => $catId,
                        'supplier_id' => $supplierIdByName[$s],
                    ];
                }
            }
        }
        // CEI
        foreach ($categoryIdsByGroup['Computer & Electronics & IT_Equipment'] as $catId) {
            foreach ($suppliersByCategory['Computer & Electronics & IT_Equipment'] as $s) {
                if (isset($supplierIdByName[$s])) {
                    $attachSupplierPairs[$catId.'::'.$supplierIdByName[$s]] = [
                        'category_id' => $catId,
                        'supplier_id' => $supplierIdByName[$s],
                    ];
                }
            }
        }

        if (!empty($attachSupplierPairs)) {
            DB::table('supplier_category')->upsert(
                array_values($attachSupplierPairs),
                ['supplier_id','category_id'],
                []
            );
        }

        $this->command->info('Brands and suppliers seeded & attached to categories.');
    }
}
