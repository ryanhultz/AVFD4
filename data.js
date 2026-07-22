// ══════════════════════════════════════════════════════════
// DATA.JS — Constants and reference data
// Personnel roster, API URLs, NERIS taxonomy, dropdown option
// lists, apparatus list, tab labels, and the EMPTY state shape.
// No functions here that DO anything — just data.
// ══════════════════════════════════════════════════════════


// ══════════════════════════════
// DATA — PERSONNEL loaded from the Cloudflare roster API (see ROSTER_API_URL)
// ══════════════════════════════
let PERSONNEL = [];  // filled by loadPersonnel()

// Fallback roster used if the roster API cannot be reached (offline, etc.)
const PERSONNEL_FALLBACK = [
  {name:"Anthony, Robert",  badge:"8",   qual:"int"},
  {name:"Bacon, Jason",     badge:"80",  qual:"int"},
  {name:"Batis, Jeffery",   badge:"137", qual:""},
  {name:"Bench, Tyler",     badge:"116", qual:"int"},
  {name:"Bodoh, Lori",      badge:"88",  qual:"emt/int"},
  {name:"Burns, Jim",       badge:"109", qual:"int"},
  {name:"Burtless, John",   badge:"16",  qual:""},
  {name:"Butler, Mitchell", badge:"124", qual:"int"},
  {name:"Ely, Fred",        badge:"135", qual:""},
  {name:"Farrance, James",  badge:"128", qual:"int"},
  {name:"Foster, Barrie-Lyn",badge:"46", qual:"emt/int"},
  {name:"Foster, Craig",    badge:"21",  qual:"int"},
  {name:"Foster, Kevin",    badge:"23",  qual:"emt/int"},
  {name:"Froio, Samuel",    badge:"135", qual:""},
  {name:"Fronce, Ryan",     badge:"131", qual:"int"},
  {name:"George, Michael",  badge:"110", qual:"int"},
  {name:"Hultz, Kyle",      badge:"43",  qual:"int"},
  {name:"Hultz, Ryan",      badge:"41",  qual:"int"},
  {name:"Jackson, Luke",    badge:"132", qual:"int"},
  {name:"Jackson, Matt",    badge:"108", qual:""},
  {name:"Jakaub, Stan",     badge:"117", qual:"int"},
  {name:"Lamaster, John Jr.",badge:"49", qual:"int"},
  {name:"Marriott, Michael",badge:"111", qual:"int"},
  {name:"McNabb, Tim",      badge:"121", qual:"emt/int"},
  {name:"Parker, David",    badge:"102", qual:"emt/int"},
  {name:"Perkins, David",   badge:"53",  qual:"emt/int"},
  {name:"Rodriguez, Luis",  badge:"125", qual:"emt/int"},
  {name:"Salato, Vincent",  badge:"126", qual:"int"},
  {name:"Shaw, Andrew",     badge:"133", qual:"int"},
  {name:"Shaw, John",       badge:"123", qual:"int"},
  {name:"Thurston, Brad",   badge:"131", qual:"emt"},
  {name:"Thurston, Christine",badge:"119",qual:"emt"},
  {name:"Thurston, Ken Sr.",badge:"66",  qual:"int"},
  {name:"Thurston, Kevin",  badge:"129", qual:"int"},
  {name:"Thurston, Richard",badge:"114", qual:"int"},
  {name:"Thurston, Rob Jr.",badge:"100", qual:"emt/int"},
  {name:"Walborn, George Jr.",badge:"91",qual:"int"},
  {name:"Walczyk, Tom",     badge:"70",  qual:"int"},
  {name:"Wells, Jason",     badge:"120", qual:"int"},
];

// Cloudflare Worker that serves the live roster (see roster-worker.js).
// Update this if the Worker is ever redeployed under a different URL.
const ROSTER_API_URL = 'https://aurelius-roster-api.ryanhultz.workers.dev/roster';

// Cloudflare Worker that stores completed reports centrally (see
// reports-worker.js). Reports are public information — no login/key
// required for reads or writes, same policy as the roster's reads.
const REPORTS_API_URL = 'https://aurelius-reports-api.ryanhultz.workers.dev/reports';

async function loadPersonnel() {
  // Always start with the built-in roster so the app is never stuck
  if (PERSONNEL.length === 0) PERSONNEL = [...PERSONNEL_FALLBACK];
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000); // 4-second timeout
    const res = await fetch(ROSTER_API_URL + '?v=' + Date.now(), { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      PERSONNEL = data.map(p => ({
        name: String(p.name||'').trim(),
        badge: String(p.badge||'').trim(),
        qual: String(p.qual||'').trim().toLowerCase(),
      })).filter(p => p.name && p.badge);
      PERSONNEL.sort((a,b) => a.name.localeCompare(b.name));
      console.log(`Loaded ${PERSONNEL.length} personnel from the roster API`);
    }
  } catch(e) {
    console.warn('Using built-in roster:', e.message);
    PERSONNEL = [...PERSONNEL_FALLBACK];
  }
};

const AMB_SERVICES = ["AUBURN CITY","THROOP","FLEMING","CAYUGA","SOUTH CAYUGA","SKANEATELES (SAVES)","Mercy Flight Central","LifeNet","Other"];

// Officer ranks for the incident commander
const IC_RANKS = ["Chief","Assistant Chief","2nd Assistant Chief","Captain","Lieutenant","Firefighter"];

// Receiving hospitals within ~60 miles of Cayuga, NY (emergency departments),
// ordered roughly by distance from Aurelius.
const HOSPITALS = [
  "Auburn Community Hospital — Auburn (~5 mi)",
  "Cayuga Medical Center — Ithaca (~30 mi)",
  "Geneva General Hospital — Geneva (~25 mi)",
  "Upstate Community Hospital — Syracuse (~30 mi)",
  "Crouse Hospital — Syracuse (~33 mi)",
  "Upstate University Hospital — Syracuse (~33 mi)",
  "Guthrie Cortland Medical Center — Cortland (~40 mi)",
  "Newark-Wayne Community Hospital — Newark (~35 mi)",
  "Clifton Springs Hospital — Clifton Springs (~30 mi)",
  "Fulton Medical Center — Fulton (~40 mi)",
  "Central Square Medical Center — Central Square (~45 mi)",
  "Oswego Hospital — Oswego (~50 mi)",
  "Strong Memorial Hospital — Rochester (~60 mi)",
  "Rochester General Hospital — Rochester (~60 mi)",
  "Not Transported",
  "Standby — No Transport",
  "Other",
];

// ── Dispatch narrative dropdown options ──────────────────
// ── NERIS incident taxonomy (7 core categories → subtypes) ──
// Replaced the retired NFIRS codes (NFIRS sunset Feb 2026; NERIS is now the
// mandated system in NY per General Municipal Law 204-d). Plain-language,
// no numeric codes — matches how NERIS itself is structured.
const NERIS_CATEGORIES = [
  { code:"FIRE", label:"Fire", subtypes:[
    // Structure
    {c:"FIRE||STRUCTURE_FIRE||STRUCTURAL_INVOLVEMENT_FIRE", l:"Structure — Structural Involvement Fire"},
    {c:"FIRE||STRUCTURE_FIRE||ROOM_AND_CONTENTS_FIRE", l:"Structure — Room and Contents Fire"},
    {c:"FIRE||STRUCTURE_FIRE||CONFINED_COOKING_APPLIANCE_FIRE", l:"Structure — Confined Cooking Appliance Fire"},
    {c:"FIRE||STRUCTURE_FIRE||CHIMNEY_FIRE", l:"Structure — Chimney Fire"},
    // Transportation
    {c:"FIRE||TRANSPORTATION_FIRE||VEHICLE_FIRE_PASSENGER", l:"Vehicle Fire — Passenger"},
    {c:"FIRE||TRANSPORTATION_FIRE||VEHICLE_FIRE_COMMERCIAL", l:"Vehicle Fire — Commercial"},
    {c:"FIRE||TRANSPORTATION_FIRE||VEHICLE_FIRE_RV", l:"Vehicle Fire — RV"},
    {c:"FIRE||TRANSPORTATION_FIRE||VEHICLE_FIRE_FOOD_TRUCK", l:"Vehicle Fire — Food Truck"},
    {c:"FIRE||TRANSPORTATION_FIRE||POWERED_MOBILITY_DEVICE_FIRE", l:"Powered Mobility Device Fire"},
    {c:"FIRE||TRANSPORTATION_FIRE||TRAIN_RAIL_FIRE", l:"Train/Rail Fire"},
    {c:"FIRE||TRANSPORTATION_FIRE||BOAT_PERSONAL_WATERCRAFT_BARGE_FIRE", l:"Boat/Watercraft/Barge Fire"},
    {c:"FIRE||TRANSPORTATION_FIRE||AIRCRAFT_FIRE", l:"Aircraft Fire"},
    // Outside
    {c:"FIRE||OUTSIDE_FIRE||VEGETATION_GRASS_FIRE", l:"Outside — Vegetation/Grass Fire"},
    {c:"FIRE||OUTSIDE_FIRE||WILDFIRE_WILDLAND", l:"Outside — Wildfire/Wildland"},
    {c:"FIRE||OUTSIDE_FIRE||WILDFIRE_URBAN_INTERFACE", l:"Outside — Wildfire Urban Interface"},
    {c:"FIRE||OUTSIDE_FIRE||TRASH_RUBBISH_FIRE", l:"Outside — Trash/Rubbish Fire"},
    {c:"FIRE||OUTSIDE_FIRE||DUMPSTER_OUTDOOR_CONTAINER_FIRE", l:"Outside — Dumpster/Container Fire"},
    {c:"FIRE||OUTSIDE_FIRE||CONSTRUCTION_WASTE", l:"Outside — Construction Waste Fire"},
    {c:"FIRE||OUTSIDE_FIRE||OUTSIDE_TANK_FIRE", l:"Outside — Tank Fire"},
    {c:"FIRE||OUTSIDE_FIRE||UTILITY_INFRASTRUCTURE_FIRE", l:"Outside — Utility/Infrastructure Fire"},
    {c:"FIRE||OUTSIDE_FIRE||OTHER_OUTSIDE_FIRE", l:"Other Outside Fire"},
    // Special
    {c:"FIRE||SPECIAL_FIRE||ESS_FIRE", l:"Special — Energy Storage System Fire"},
    {c:"FIRE||SPECIAL_FIRE||EXPLOSION", l:"Special — Explosion"},
    {c:"FIRE||SPECIAL_FIRE||INFRASTRUCTURE_FIRE", l:"Special — Infrastructure Fire"}] },

  { code:"MEDICAL", label:"Medical", subtypes:[
    // Illness
    {c:"MEDICAL||ILLNESS||CARDIAC_ARREST", l:"Illness — Cardiac Arrest"},
    {c:"MEDICAL||ILLNESS||HEART_PROBLEMS", l:"Illness — Heart Problems"},
    {c:"MEDICAL||ILLNESS||CHEST_PAIN_NON_TRAUMA", l:"Illness — Chest Pain (Non-Trauma)"},
    {c:"MEDICAL||ILLNESS||BREATHING_PROBLEMS", l:"Illness — Breathing Problems"},
    {c:"MEDICAL||ILLNESS||STROKE_CVA", l:"Illness — Stroke/CVA"},
    {c:"MEDICAL||ILLNESS||UNCONSCIOUS_VICTIM", l:"Illness — Unconscious Victim"},
    {c:"MEDICAL||ILLNESS||ALTERED_MENTAL_STATUS", l:"Illness — Altered Mental Status"},
    {c:"MEDICAL||ILLNESS||CONVULSIONS_SEIZURES", l:"Illness — Convulsions/Seizures"},
    {c:"MEDICAL||ILLNESS||DIABETIC_PROBLEMS", l:"Illness — Diabetic Problems"},
    {c:"MEDICAL||ILLNESS||OVERDOSE", l:"Illness — Overdose"},
    {c:"MEDICAL||ILLNESS||ALLERGIC_REACTION_STINGS", l:"Illness — Allergic Reaction/Stings"},
    {c:"MEDICAL||ILLNESS||ABDOMINAL_PAIN", l:"Illness — Abdominal Pain"},
    {c:"MEDICAL||ILLNESS||BACK_PAIN_NON_TRAUMA", l:"Illness — Back Pain (Non-Trauma)"},
    {c:"MEDICAL||ILLNESS||HEADACHE", l:"Illness — Headache"},
    {c:"MEDICAL||ILLNESS||NAUSEA_VOMITING", l:"Illness — Nausea/Vomiting"},
    {c:"MEDICAL||ILLNESS||PSYCHOLOGICAL_BEHAVIOR_ISSUES", l:"Illness — Psychological/Behavioral"},
    {c:"MEDICAL||ILLNESS||PREGNANCY_CHILDBIRTH", l:"Illness — Pregnancy/Childbirth"},
    {c:"MEDICAL||ILLNESS||SICK_CASE", l:"Illness — Sick Case"},
    {c:"MEDICAL||ILLNESS||WELL_PERSON_CHECK", l:"Illness — Well Person Check"},
    {c:"MEDICAL||ILLNESS||PANDEMIC_EPIDEMIC_OUTBREAK", l:"Illness — Pandemic/Epidemic Outbreak"},
    {c:"MEDICAL||ILLNESS||UNKNOWN_PROBLEM", l:"Illness — Unknown Problem"},
    {c:"MEDICAL||ILLNESS||NO_APPROPRIATE_CHOICE", l:"Illness — No Appropriate Choice"},
    // Injury
    {c:"MEDICAL||INJURY||MOTOR_VEHICLE_COLLISION", l:"Injury — Motor Vehicle Collision"},
    {c:"MEDICAL||INJURY||FALL", l:"Injury — Fall"},
    {c:"MEDICAL||INJURY||ASSAULT", l:"Injury — Assault"},
    {c:"MEDICAL||INJURY||HEMORRHAGE_LACERATION", l:"Injury — Hemorrhage/Laceration"},
    {c:"MEDICAL||INJURY||BURNS_EXPLOSION", l:"Injury — Burns/Explosion"},
    {c:"MEDICAL||INJURY||CARBON_MONOXIDE_OTHER_INHALATION_INJURY", l:"Injury — CO/Inhalation Injury"},
    {c:"MEDICAL||INJURY||CHOKING", l:"Injury — Choking"},
    {c:"MEDICAL||INJURY||POISONING", l:"Injury — Poisoning"},
    {c:"MEDICAL||INJURY||ELECTROCUTION", l:"Injury — Electrocution"},
    {c:"MEDICAL||INJURY||HEAT_COLD_EXPOSURE", l:"Injury — Heat/Cold Exposure"},
    {c:"MEDICAL||INJURY||DROWNING_DIVING_SCUBA_ACCIDENT", l:"Injury — Drowning/Diving Accident"},
    {c:"MEDICAL||INJURY||ANIMAL_BITES", l:"Injury — Animal Bites"},
    {c:"MEDICAL||INJURY||EYE_TRAUMA", l:"Injury — Eye Trauma"},
    {c:"MEDICAL||INJURY||GUNSHOT_WOUND", l:"Injury — Gunshot Wound"},
    {c:"MEDICAL||INJURY||STAB_PENETRATING_TRAUMA", l:"Injury — Stab/Penetrating Trauma"},
    {c:"MEDICAL||INJURY||INDUSTRIAL_INACCESSIBLE_ENTRAPMENT", l:"Injury — Industrial/Inaccessible Entrapment"},
    {c:"MEDICAL||INJURY||OTHER_TRAUMATIC_INJURY", l:"Injury — Other Traumatic Injury"},
    // Other
    {c:"MEDICAL||OTHER||MEDICAL_ALARM", l:"Other — Medical Alarm"},
    {c:"MEDICAL||OTHER||STANDBY_REQUEST", l:"Other — Standby Request"},
    {c:"MEDICAL||OTHER||INTERCEPT_OTHER_UNIT", l:"Other — Intercept Other Unit"},
    {c:"MEDICAL||OTHER||AIRMEDICAL_TRANSPORT", l:"Other — Airmedical Transport"},
    {c:"MEDICAL||OTHER||TRANSFER_INTERFACILITY", l:"Other — Transfer/Interfacility"},
    {c:"MEDICAL||OTHER||HEALTHCARE_PROFESSIONAL_ADMISSION", l:"Other — Healthcare Professional Admission"},
    {c:"MEDICAL||OTHER||COMMUNITY_PUBLIC_HEALTH", l:"Other — Community/Public Health"}] },

  { code:"HAZSIT", label:"Hazardous Situation", subtypes:[
    // Non-chemical
    {c:"HAZSIT||HAZARD_NONCHEM||ELEC_POWER_LINE_DOWN_ARCHING_MALFUNC", l:"Power Line Down/Arcing/Malfunction"},
    {c:"HAZSIT||HAZARD_NONCHEM||ELEC_HAZARD_SHORT_CIRCUIT", l:"Electrical Hazard/Short Circuit"},
    {c:"HAZSIT||HAZARD_NONCHEM||MOTOR_VEHICLE_COLLISION", l:"Motor Vehicle Collision (No Injuries)"},
    {c:"HAZSIT||HAZARD_NONCHEM||BOMB_THREAT_RESPONSE_SUSPICIOUS_PACKAGE", l:"Bomb Threat/Suspicious Package"},
    // Hazmat
    {c:"HAZSIT||HAZARDOUS_MATERIALS||GAS_LEAK_ODOR", l:"Hazmat — Gas Leak/Odor"},
    {c:"HAZSIT||HAZARDOUS_MATERIALS||FUEL_SPILL_ODOR", l:"Hazmat — Fuel Spill/Odor"},
    {c:"HAZSIT||HAZARDOUS_MATERIALS||CARBON_MONOXIDE_RELEASE", l:"Hazmat — Carbon Monoxide Release"},
    {c:"HAZSIT||HAZARDOUS_MATERIALS||HAZMAT_RELEASE_FACILITY", l:"Hazmat — Release, Facility"},
    {c:"HAZSIT||HAZARDOUS_MATERIALS||HAZMAT_RELEASE_TRANSPORT", l:"Hazmat — Release, Transport"},
    {c:"HAZSIT||HAZARDOUS_MATERIALS||BIOLOGICAL_RELEASE_INCIDENT", l:"Hazmat — Biological Release"},
    {c:"HAZSIT||HAZARDOUS_MATERIALS||RADIOACTIVE_RELEASE_INCIDENT", l:"Hazmat — Radioactive Release"},
    // Overpressure
    {c:"HAZSIT||OVERPRESSURE||NO_RUPTURE", l:"Overpressure — No Rupture"},
    {c:"HAZSIT||OVERPRESSURE||RUPTURE_WITHOUT_FIRE", l:"Overpressure — Rupture Without Fire"},
    // Investigation
    {c:"HAZSIT||INVESTIGATION||SMOKE_INVESTIGATION", l:"Investigation — Smoke"},
    {c:"HAZSIT||INVESTIGATION||ODOR", l:"Investigation — Odor"}] },

  { code:"RESCUE", label:"Rescue", subtypes:[
    // Transportation
    {c:"RESCUE||TRANSPORTATION||MOTOR_VEHICLE_EXTRICATION_ENTRAPPED", l:"Motor Vehicle Extrication/Entrapped"},
    {c:"RESCUE||TRANSPORTATION||AVIATION_COLLISION_CRASH", l:"Aviation Collision/Crash"},
    {c:"RESCUE||TRANSPORTATION||AVIATION_STANDBY", l:"Aviation Standby"},
    {c:"RESCUE||TRANSPORTATION||TRAIN_RAIL_COLLISION_DERAILMENT", l:"Train/Rail Collision/Derailment"},
    // Structure
    {c:"RESCUE||STRUCTURE||EXTRICATION_ENTRAPPED", l:"Structure — Extrication/Entrapped"},
    {c:"RESCUE||STRUCTURE||BUILDING_STRUCTURE_COLLAPSE", l:"Structure — Building/Structure Collapse"},
    {c:"RESCUE||STRUCTURE||ELEVATOR_ESCALATOR_RESCUE", l:"Structure — Elevator/Escalator Rescue"},
    {c:"RESCUE||STRUCTURE||CONFINED_SPACE_RESCUE", l:"Structure — Confined Space Rescue"},
    // Outside
    {c:"RESCUE||OUTSIDE||EXTRICATION_ENTRAPPED", l:"Outside — Extrication/Entrapped"},
    {c:"RESCUE||OUTSIDE||CONFINED_SPACE_RESCUE", l:"Outside — Confined Space Rescue"},
    {c:"RESCUE||OUTSIDE||HIGH_ANGLE_RESCUE", l:"Outside — High Angle Rescue"},
    {c:"RESCUE||OUTSIDE||LOW_ANGLE_RESCUE", l:"Outside — Low Angle Rescue"},
    {c:"RESCUE||OUTSIDE||STEEP_ANGLE_RESCUE", l:"Outside — Steep Angle Rescue"},
    {c:"RESCUE||OUTSIDE||TRENCH", l:"Outside — Trench Rescue"},
    {c:"RESCUE||OUTSIDE||BACKCOUNTRY_RESCUE", l:"Outside — Backcountry Rescue"},
    {c:"RESCUE||OUTSIDE||LIMITED_NO_ACCESS", l:"Outside — Limited/No Access"},
    // Water
    {c:"RESCUE||WATER||PERSON_IN_WATER_STANDING", l:"Water — Person in Water (Standing)"},
    {c:"RESCUE||WATER||PERSON_IN_WATER_SWIFTWATER", l:"Water — Person in Water (Swiftwater)"},
    {c:"RESCUE||WATER||WATERCRAFT_IN_DISTRESS", l:"Water — Watercraft in Distress"}] },

  { code:"PUBSERV", label:"Public Service", subtypes:[
    // Alarms (non-medical)
    {c:"PUBSERV||ALARMS_NONMED||FIRE_ALARM", l:"Alarm — Fire Alarm"},
    {c:"PUBSERV||ALARMS_NONMED||CO_ALARM", l:"Alarm — CO Alarm"},
    {c:"PUBSERV||ALARMS_NONMED||GAS_ALARM", l:"Alarm — Gas Alarm"},
    {c:"PUBSERV||ALARMS_NONMED||OTHER_ALARM", l:"Alarm — Other Alarm"},
    // Citizen assist
    {c:"PUBSERV||CITIZEN_ASSIST||LIFT_ASSIST", l:"Citizen Assist — Lift Assist"},
    {c:"PUBSERV||CITIZEN_ASSIST||CITIZEN_ASSIST_SERVICE_CALL", l:"Citizen Assist — Service Call"},
    {c:"PUBSERV||CITIZEN_ASSIST||PERSON_IN_DISTRESS", l:"Citizen Assist — Person in Distress"},
    {c:"PUBSERV||CITIZEN_ASSIST||LOST_PERSON", l:"Citizen Assist — Lost Person"},
    // Disaster / weather
    {c:"PUBSERV||DISASTER_WEATHER||WEATHER_RESPONSE", l:"Weather Response"},
    {c:"PUBSERV||DISASTER_WEATHER||DAMAGE_ASSESSMENT", l:"Damage Assessment"},
    // Other
    {c:"PUBSERV||OTHER||STANDBY", l:"Other — Standby"},
    {c:"PUBSERV||OTHER||MOVE_UP", l:"Other — Move Up"},
    {c:"PUBSERV||OTHER||DAMAGED_HYDRANT", l:"Other — Damaged Hydrant"}] },

  { code:"NOEMERG", label:"No Emergency", subtypes:[
    {c:"NOEMERG||CANCELLED", l:"Cancelled"},
    // False alarm
    {c:"NOEMERG||FALSE_ALARM||ACCIDENTAL_ALARM", l:"False Alarm — Accidental"},
    {c:"NOEMERG||FALSE_ALARM||MALFUNCTIONING_ALARM", l:"False Alarm — Malfunctioning"},
    {c:"NOEMERG||FALSE_ALARM||INTENTIONAL_FALSE_ALARM", l:"False Alarm — Intentional"},
    {c:"NOEMERG||FALSE_ALARM||BOMB_SCARE", l:"False Alarm — Bomb Scare"},
    {c:"NOEMERG||FALSE_ALARM||OTHER_FALSE_CALL", l:"False Alarm — Other False Call"},
    // Good intent
    {c:"NOEMERG||GOOD_INTENT||NO_INCIDENT_FOUND_LOCATION_ERROR", l:"Good Intent — No Incident Found/Location Error"},
    {c:"NOEMERG||GOOD_INTENT||SMOKE_FROM_NONHOSTILE_SOURCE", l:"Good Intent — Smoke from Non-Hostile Source"},
    {c:"NOEMERG||GOOD_INTENT||CONTROLLED_BURNING_AUTHORIZED", l:"Good Intent — Controlled Burning (Authorized)"},
    {c:"NOEMERG||GOOD_INTENT||INVESTIGATE_HAZARDOUS_RELEASE", l:"Good Intent — Investigate Hazardous Release"}] },

  { code:"LAWENFORCE", label:"Law Enforcement", subtypes:[
    {c:"LAWENFORCE", l:"Law Enforcement Assist"}] },

  { code:"UNDETERMINED", label:"Undetermined", subtypes:[
    {c:"UNDETERMINED", l:"Undetermined"}] },
];
// NERIS location/use types (replaces old property-occupancy list)
const LOCATION_USE_TYPES = ["Residential — single family","Residential — multi family","Commercial/Business","Industrial/Manufacturing","Assembly/Institutional","Educational/School","Healthcare","Storage/Warehouse","Agricultural/Farm","Vehicle","Roadway/Highway","Outdoor/Open Land","Vacant/Abandoned","Other","N/A"];
const RESPONSE_MODES = ["Emergency (lights & siren)","Non-Emergency (cold)","Cancelled En Route","Standby/Cover Assignment"];
const ARRIVAL_CONDITIONS = ["Nothing Showing","Smoke Showing","Fire Showing","Working Fire","Fully Involved","Already Extinguished","Patient(s) on Scene","Hazard Present","Cancelled En Route","Nothing Found","Other"];
// ── NERIS Actions & Tactics (tactic category → actions) ──
// Mirrors the official NERIS Actions & Tactics taxonomy. A practical subset
// of categories/actions for a volunteer FD; specialized ones (USAR K9,
// cave/mine, fenceline monitoring) are omitted for brevity but the wording
// matches NERIS exactly. Selections are stored as "Category: Action".
const NERIS_TACTICS = [
  { cat:"Command & Control", actions:[
    "Establish Incident Command","Incident Assessment (360 Completed)","Accountability",
    "Officer Assigned","Safety Officer Assigned","Notify Other Agencies"] },
  { cat:"Suppression", actions:[
    "Structural Fire Suppression — Interior","Structural Fire Suppression — Exterior",
    "Structural Fire Suppression — Interior and Exterior","Outside Fire Suppression",
    "Established Fire Lines","Confinement","Structure Protection","Fire Control/Extinguishment"] },
  { cat:"Ventilation", actions:[
    "Ventilation Performed"] },
  { cat:"Forcible Entry", actions:[
    "Forcible Entry Performed"] },
  { cat:"Search — Structure", actions:[
    "Primary Search","Secondary Search"] },
  { cat:"Search — Non-Structure", actions:[
    "Wide Area / Outdoor Search","Search Waterway","Search Area of Collapse","Body Recovery"] },
  { cat:"Emergency Medical Care", actions:[
    "Patient Assessment","Provide Basic Life Support","Provide Advanced Life Support",
    "Provide Transport","Patient Referral"] },
  { cat:"Salvage & Overhaul", actions:[
    "Overhaul","Salvage / Property Conservation"] },
  { cat:"Hazardous Situation Mitigation", actions:[
    "Leak Stop","Spill Control","Remove Hazard","Decontamination","Atmospheric Monitoring (Interior)","Take Samples"] },
  { cat:"Evacuation", actions:[
    "Nearby Buildings","Large Area","Connected Interior Spaces"] },
  { cat:"Equipment", actions:[
    "Provide Light","Provide Electrical Power","Provide Drone / Video Equipment","Provide Special Equipment"] },
  { cat:"Services", actions:[
    "Control Traffic","Control Crowd","Assist Uninjured Person","Assist Animal",
    "Provide Apparatus/Water","Remove Water","Secure Property","Damage Assessment",
    "Shut Down Alarm","Restore/Reset Alarm System","Shut Down Sprinkler System","Restore Sprinkler System"] },
  { cat:"Information / Enforcement", actions:[
    "Enforce Code or Law","Provide Public Information","Refer to Proper AHJ"] },
  { cat:"No Action", actions:[
    "No Action Required"] },
];

// Suggested actions by NERIS category — used to auto-expand the relevant
// tactic categories and outline the likely actions. These are HINTS ONLY;
// nothing is auto-checked (NERIS requires coding what was actually done).
const TACTIC_SUGGESTIONS = {
  FIRE: [
    "Command & Control: Establish Incident Command",
    "Command & Control: Incident Assessment (360 Completed)",
    "Suppression: Structural Fire Suppression — Interior",
    "Suppression: Fire Control/Extinguishment",
    "Ventilation: Ventilation Performed",
    "Search — Structure: Primary Search",
    "Search — Structure: Secondary Search",
    "Salvage & Overhaul: Overhaul",
    "Salvage & Overhaul: Salvage / Property Conservation"
  ],
  MEDICAL: [
    "Command & Control: Establish Incident Command",
    "Emergency Medical Care: Patient Assessment",
    "Emergency Medical Care: Provide Basic Life Support",
    "Emergency Medical Care: Provide Transport"
  ],
  HAZSIT: [
    "Command & Control: Establish Incident Command",
    "Hazardous Situation Mitigation: Remove Hazard",
    "Hazardous Situation Mitigation: Leak Stop",
    "Hazardous Situation Mitigation: Spill Control",
    "Services: Control Traffic",
    "Evacuation: Nearby Buildings"
  ],
  RESCUE: [
    "Command & Control: Establish Incident Command",
    "Command & Control: Safety Officer Assigned",
    "Emergency Medical Care: Patient Assessment",
    "Emergency Medical Care: Provide Basic Life Support",
    "Services: Control Traffic",
    "Equipment: Provide Special Equipment"
  ],
  PUBSERV: [
    "Command & Control: Establish Incident Command",
    "Services: Assist Uninjured Person",
    "Services: Shut Down Alarm",
    "Services: Restore/Reset Alarm System",
    "Services: Secure Property"
  ],
  NOEMERG: [
    "No Action: No Action Required",
    "Information / Enforcement: Provide Public Information"
  ],
  LAWENFORCE: [
    "Command & Control: Notify Other Agencies",
    "Services: Control Traffic",
    "Information / Enforcement: Refer to Proper AHJ"
  ]
};
const WATER_SUPPLY = ["N/A","Hydrant","Tanker Shuttle","Draft/Static Source","Booster Tank Only","Mutual Aid Tankers"];
const DISPOSITIONS = ["Fire Extinguished","Fire Controlled","Out on Arrival","Patient Transported","Patient Refused","Turned Over to Owner","Turned Over to PD","Turned Over to Other Agency","Investigation Pending","False Alarm","No Incident Found","Cancelled"];
const CAUSES = ["Undetermined","Under Investigation","Accidental","Electrical","Cooking","Heating Equipment","Smoking","Open Flame","Vehicle/Mechanical","Intentional","Natural (lightning/weather)","N/A"];

const APPARATUS = ["Rescue 2","Engine 1","Engine 2","Rescue 1","Chief's Vehicle","Quint 1","Squad 1","Squad 2","Squad 3","Tanker 1"];
const TABS = ["Dispatch","Command","Times","Incident","Apparatus","Personnel","MVC","EMS","Law","Narrative","Review","Finalize"];

const EMPTY = {
  date:"", runNum:"", ic:"", icRank:"",
  disp:"", clear:"", inQ:"",
  dispActual:"", address:"",
  nerisCat:"", nerisType:"", nerisTypeOther:"", nerisCode:"", locationUse:"", locationUseOther:"", responseMode:"", arrivalCond:"", arrivalCondOther:"", actionsTaken:[], waterSupply:"", disposition:"", cause:"", narrative:"",
  mvcVehicles:"", mvcExtrication:"", mvcEntrapped:"", mvcHazards:[],
  apparatus:{}, apparatusDriver:{}, apparatusEnroute:{}, apparatusArrived:{}, personnel:{},
  emtCt:"", intCt:"", totalCt:"",
  injName:"", injNum:"", rptFiled:"",
  numPatients:"",
  amb:[{svc:"",custom:"",pcr:"",hospital:"",hospitalOther:""},{svc:"",custom:"",pcr:"",hospital:"",hospitalOther:""},{svc:"",custom:"",pcr:"",hospital:"",hospitalOther:""}],
  refusedPcr:["","",""],
  law:["","",""],
  cars:[{model:"",plate:"",color:""},{model:"",plate:"",color:""},{model:"",plate:"",color:""},{model:"",plate:"",color:""},{model:"",plate:"",color:""},{model:"",plate:"",color:""}],
  mutual:[], mutualDir:"", remarks:"", reportBy:"",
};

