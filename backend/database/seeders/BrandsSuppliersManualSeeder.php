<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BrandsSuppliersManualSeeder extends Seeder
{
    public function run(): void
    {
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
                'Gorenje','Smeg','Fisher & Paykel','Queen chef',
            ],
            'Vehicles' => [
                'NA','Yamaha','Honda','SYM','Baotian','TaoTao','Znen','Akkad',
                'Toyota','Lexus','Nissan','Infiniti','Acura','Mazda','Mitsubishi','Subaru','Suzuki','Daihatsu',
                'Hyundai','Kia','Genesis','Geely','BYD','Ford','Changan','Chery','Opel','Fiat','Chevrolet',
                'Cadillac','GMC','Chrysler','isuzu','Jeep','Mercedes-Benz','Volkswagen','Audi','BMW','Mini',
                'Renault','Peugeot','Citroën','Jaguar','Land Rover','Volvo','Lada',
            ],
            'CEI' => [
                'Dell','HP','Lenovo','Apple','ASUS','Acer','MSI','Microsoft','Samsung',
                'IBM','Cisco','Huawei','TP-Link','Netgear','Ubiquiti','D-Link','Juniper','Fortinet',
                'Western Digital','Seagate','Toshiba','Kingston','Crucial','Synology','QNAP',
                'Canon','Epson','Brother','Ricoh','Xerox','Logitech','Razer',
            ],
        ];

        // Upsert all brands
        $brandNames = array_values(array_unique(array_merge(
            $brandsByGroup['FAM'], $brandsByGroup['Vehicles'], $brandsByGroup['CEI']
        )));
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
                'Fairco','Fliefel','Galerie Al Jarrah','Galerie Pratique','Hawa Center Office Furniture','Home Center','Jarrah Group',
                'K. Fleifel Ind. Co. Sarl','Kamaplast','Moebel – Office Work Center','Office Design & Supplies','Opaque (Curtains)',
                'OWC','Panda Plast','PolyForm','WAMCO s.a.r.l. (Window films)','شركة غاليري جراح ش.م.م',
                'For Potential emergency response 2023 (Saida / Dahye)','مؤسسة المرعبي','شركة ارقدان','شركة مفروشات هويلو',
                'علي رباح للمفروشات','Galerie Al Jarrah','KCOM OFFICE SOLUTIOM','Furniture Trading Center','AL Nour Sawmill',
            ],
            // Appliances
            'Appliances' => [
                'Agha Sarkissian','CTC - Samsung','Hajj Electronics','Karam Electronics','Kassis Electric','Khoury Home','Power Care',
                'Sami Kotob City','Mtayrek Electrics','Hamdan Electronics','Azar Fire Protection','BFS system','Java Fire Protection',
                'Moghnieh Fire','Smart Security','Zod Security','Hateco','Victoria Fire','SOS','IT Capital',
            ],
            // Machine
            'Machine' => [
                'Combat Lebanon','Pest Off','Boecker','Insecta lb','S.D.C','SIAD Pest conrol','Azar Fire Protection S.A.L',
                'Fitzpatrick','Maison De La Securite','SOS','Wisehouse','Zod Security','Wamco','N.S.N international s.a.r.l','Bisco',
                'Ets. Nada N. Nehme','Jonco M E Trading','Turuqoise','Pharmacie Sarafian','Royal Medicare','Baldaty','Garo Sewing',
                'Hani Gizi Sewing','Al Awaeel company','SMEC','FS Energy','Fasco','Technosolution',
            ],
            // Vehicles
            'Vehicles' => [
                'Advanced Car','AVIS','bassam shaker','Charlie Rent A Car','Hala Group','Infifnity group','Mike Rent A Car','Force',
                'Leadin rental company (LERCOM)','Najib Rent a car','HOZ Rent a Car','Fara Rent a Car',
            ],
            // CEI (Computer & Electronics & IT_Equipment)
            'Computer & Electronics & IT_Equipment' => [
                'Adkom','Ahmad ALI taleb','Al Hatem est','ANF','CMC Crystal Mobile Communication','Electro City','Frost -tech','habli est',
                'Hassan Bros.','Hijazi Group','connexions','Aims','MAT','Metal Fabric','Microcity','Mojitech sarl','Qabassat',
                'Rasheed electric','Sbeity Computers','GIGANET','Space technology','Traboulsi est.','YS electronics','مؤسسة غوى',
                'Nasr Trading and Contracting','Mtayrek Electrics','Hamdan Electronics','Azz Group','MAF','Dib Hanna Ibrahim',
                'Active Tech Services','Maassarani Electronics','Abed Tahan','Al Haceb','Antaki - Burotek','Bugs','CCT','Compudata',
                'Compulife','Computer Business Machine (CBM)','Compuworld','Dabbous Mega Supplies','Domtech',
                'CCG - Consolidated Consultancy Group','Guardia Systems','Hiperdist','ICCS','Insight Solutions','Interlink','Intracom Telecom',
                'IT Capital','Karam Electronics','Khoury Home','Libatech','Microtech','Multitech','NBC','Plexus Invest','Quantech',
                'Qabassat Computers','Secure Edge','SIS Technology','SME S.A.R.L','Star Computer Company','Super Dealer',
                'Teletrade -Multimedia Megastores','Uni Lebanon SAL','Sbeity Computer','ECA','Ayoub','Provideo','Titan Technologies Inc Sal',
                'TRACCS Lebanon Company','Pancrop Supplies & Services','Computel','Selfani Tech SARL','Kassiss Electric','Black box .com',
                'Multi-Tech SARL','Technomania','El-Haceb company SAL','Triplec','InterTech','ITG','Smartech','EXO',
                'ESCO fathallah ( UPS and Battery )','Click tech','Terranet','Sodetel','Wise','IDM',
            ],
        ];

        // Upsert suppliers (flat list)
        $allSupplierNames = [];
        foreach ($suppliersByCategory as $catName => $list) {
            $allSupplierNames = array_merge($allSupplierNames, $list);
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
