export type TtUnit = { id:number; name:string; unit_admins:string[]; standards:string[] };
export type TtEntity = { id:number; name:string; heads:string[]; units:TtUnit[] };
export type TtCountry = { id:number; name:string; country_dirs:string[]; entities:TtEntity[] };


export const DEMO_COUNTRIES: TtCountry[] = [
{
id: 1, name: 'Lebanon', country_dirs: ['Layla Haddad'],
entities: [
{ id: 1, name: 'BZ', heads: ['Nour Saad'], units: [
{ id: 101, name: 'IT', unit_admins: ['Alaa Zaibak'], standards: ['Maya T.', 'Rami K.', 'Zeinab S.'] },
{ id: 102, name: 'Protection', unit_admins: ['Hadi M.'], standards: ['Amal E.', 'Jad B.'] },
{ id: 103, name: 'MEAL', unit_admins: ['Yara A.'], standards: ['Ola F.'] },
]},
{ id: 3, name: 'Pioneer', heads: ['Walid R.'], units: [
{ id: 131, name: 'Field Ops', unit_admins: ['Mira K.'], standards: ['Ali Z.', 'Hussein M.', 'Sara N.'] },
]},
]
},
{
id: 2, name: 'Syria', country_dirs: ['Fadi Barakat'],
entities: [
{ id: 3, name: 'Pioneer', heads: ['Sameer J.'], units: [
{ id: 331, name: 'Field Ops', unit_admins: ['Kinan T.'], standards: ['Ola A.', 'Rasha S.'] },
{ id: 332, name: 'Logistics', unit_admins: ['Joud M.'], standards: ['Bilal F.'] },
]},
{ id: 2, name: 'CSEU', heads: ['Firas G.'], units: [
{ id: 221, name: 'Dev', unit_admins: ['Nadia W.'], standards: ['Mohannad S.', 'Aya L.'] },
{ id: 222, name: 'Ops', unit_admins: ['Nour E.'], standards: ['Khaled A.'] },
{ id: 223, name: 'Design', unit_admins: ['Yousef R.'], standards: ['Sahar P.', 'Ruba U.'] },
]},
]
},
{
id: 3, name: 'Turkey', country_dirs: ['Omar Nasser'],
entities: [
{ id: 1, name: 'BZ', heads: ['Hanin S.'], units: [
{ id: 121, name: 'IT', unit_admins: ['Sami A.'], standards: ['Lina D.', 'Omar H.'] },
{ id: 122, name: 'Programs', unit_admins: ['Reem Y.'], standards: ['Tala R.', 'Ibrahim Q.', 'Dana J.'] },
]}
]
},
{
id: 4, name: 'Germany', country_dirs: ['Sara Karim'],
entities: [
{ id: 4, name: 'Shatila Studio', heads: ['Adel S.'], units: [
{ id: 441, name: 'Media', unit_admins: ['Reyhan B.'], standards: ['Rayan C.', 'Hala N.'] },
]},
{ id: 3, name: 'Pioneer', heads: ['Walid R.'], units: [
{ id: 231, name: 'DevRel', unit_admins: ['Hasan V.'], standards: ['Maha T.'] },
]},
{ id: 1, name: 'BZ', heads: ['Exec Team'], units: []}
]
}
];


export const GLOBAL_SUPER_ADMINS = ['Super Admin A'];
export const GLOBAL_C_LEVELS = ['Exec One', 'Exec Two'];