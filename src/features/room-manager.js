/**
 * Room Registry & Firebase Integration Module
 * Manages multiplayer room tracking, Discord room registry, and Firebase polling
 *
 * Features:
 * - Room registry with Discord rooms (play1-play50, country rooms)
 * - Magic Circle public rooms (MG1-MG15, SLAY)
 * - Custom room support
 * - Firebase API stubbing with /info endpoint polling
 * - Room status reporting and player count tracking
 * - Discord environment detection
 *
 * @module RoomManager
 */
import { productionLog, productionError, productionWarn, debugLog } from '../core/logging.js';


/**
 * Firebase configuration for room status tracking
 * @constant {object}
 */
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBfFW74PLBfLIpYj5dakmKar2wRpLu1ZOA',
  authDomain: 'mg-rooms.firebaseapp.com',
  databaseURL: 'https://mg-rooms-default-rtdb.firebaseio.com',
  projectId: 'mg-rooms',
  storageBucket: 'mg-rooms.firebasestorage.app',
  messagingSenderId: '175773159635',
  appId: '1:175773159635:web:6676c5a625c3fe1da74426'
};

/**
 * Report interval for room player counts
 * @constant {number}
 */
export const REPORT_INTERVAL = 5000; // Report room count every 5 seconds

/**
 * Default tracked rooms
 * @constant {string[]}
 */
export const DEFAULT_ROOMS = [
  'MG1',
  'MG2',
  'MG3',
  'MG4',
  'MG5',
  'MG6',
  'MG7',
  'MG8',
  'MG9',
  'MG10',
  'MG11',
  'MG12',
  'MG13',
  'MG14',
  'MG15',
  'SLAY'
];

/**
 * Legacy Discord play rooms constant (kept for compatibility)
 * @constant {Array}
 */
export const DISCORD_PLAY_ROOMS = []; // Legacy constant kept for compatibility

/**
 * Create Room Registry with Discord and Magic Circle rooms
 * Centralized room data with categories for the 2-tab interface
 *
 * @param {object} dependencies - Injected dependencies
 * @param {object} dependencies.UnifiedState - UnifiedState for custom rooms access
 * @returns {object} Room registry object with methods
 */
export function createRoomRegistry(dependencies = {}) {
  const { UnifiedState } = dependencies;

  return {
    // Discord rooms from Garlic Bread's Server and Magic Circle Discord
    discord: [
      // Garlic Bread's Server (play1-play10 - NO HYPHEN)
      { id: 'i-1425232387037462538-gc-1399110335469977781-1411124424676999308', name: 'play1', category: 'discord' },
      { id: 'i-1426213334721757305-gc-1399110335469977781-1411801827674030191', name: 'play2', category: 'discord' },
      { id: 'i-1426696111514456277-gc-1399110335469977781-1411801899489034471', name: 'play3', category: 'discord' },
      { id: 'i-1425131188074319992-gc-1399110335469977781-1411801931373875240', name: 'play4', category: 'discord' },
      { id: 'i-1426523715059056691-gc-1399110335469977781-1411801958616141864', name: 'play5', category: 'discord' },
      { id: 'i-1426962425999130785-gc-1399110335469977781-1411801990345916496', name: 'play6', category: 'discord' },
      { id: 'i-1426782888900296754-gc-1399110335469977781-1411802027255660644', name: 'play7', category: 'discord' },
      { id: 'i-1426963026216751124-gc-1399110335469977781-1411802063876128980', name: 'play8', category: 'discord' },
      { id: 'i-1426736748104515747-gc-1399110335469977781-1411802098533666837', name: 'play9', category: 'discord' },
      { id: 'i-1426972080355807252-gc-1399110335469977781-1411802136911548467', name: 'play10', category: 'discord' },

      // Magic Circle Numbered Rooms (play-2 through play-50 - WITH HYPHEN)
      { id: 'i-1416705483108257912-gc-808935495543160852-1389438720427425894', name: 'play-2', category: 'discord' },
      { id: 'i-1414738624276205699-gc-808935495543160852-1389979453957996705', name: 'play-3', category: 'discord' },
      { id: 'i-1426270545699405844-gc-808935495543160852-1389979475336233000', name: 'play-4', category: 'discord' },
      { id: 'i-1424918072380231760-gc-808935495543160852-1391350549944733768', name: 'play-5', category: 'discord' },
      { id: 'i-1424940435679477782-gc-808935495543160852-1391629723687452802', name: 'play-6', category: 'discord' },
      { id: 'i-1414738652449345536-gc-808935495543160852-1392897701087019028', name: 'play-7', category: 'discord' },
      { id: 'i-1426340656351150221-gc-808935495543160852-1417928182505672877', name: 'play-8', category: 'discord' },
      { id: 'i-1426648328271167558-gc-808935495543160852-1392928961679331541', name: 'play-9', category: 'discord' },
      { id: 'i-1424650709747499109-gc-808935495543160852-1394338319411970198', name: 'play-10', category: 'discord' },
      { id: 'i-1421249275131859125-gc-808935495543160852-1394338344753959032', name: 'play-11', category: 'discord' },
      { id: 'i-1417583142918950943-gc-808935495543160852-1394338361631703181', name: 'play-12', category: 'discord' },
      { id: 'i-1426272039320158390-gc-808935495543160852-1394714064575271032', name: 'play-13', category: 'discord' },
      { id: 'i-1421215237289545901-gc-808935495543160852-1394714079448399962', name: 'play-14', category: 'discord' },
      { id: 'i-1426260441730125874-gc-808935495543160852-1394714101065974021', name: 'play-15', category: 'discord' },
      { id: 'i-1425314797603520553-gc-808935495543160852-1394714159857270936', name: 'play-16', category: 'discord' },
      { id: 'i-1422642064910319697-gc-808935495543160852-1395445292664488088', name: 'play-17', category: 'discord' },
      { id: 'i-1425331756999118868-gc-808935495543160852-1395445357495718081', name: 'play-18', category: 'discord' },
      { id: 'i-1426661481679945920-gc-808935495543160852-1421303964225372294', name: 'play-19', category: 'discord' },
      { id: 'i-1425346474035646574-gc-808935495543160852-1395445408737788064', name: 'play-20', category: 'discord' },
      { id: 'i-1426272183986163772-gc-808935495543160852-1406700719272104188', name: 'play-21', category: 'discord' },
      { id: 'i-1418751419091124374-gc-808935495543160852-1413559836976873672', name: 'play-22', category: 'discord' },
      { id: 'i-1426656896491978895-gc-808935495543160852-1414650590323277904', name: 'play-23', category: 'discord' },
      { id: 'i-1424941680062369792-gc-808935495543160852-1414650614415102163', name: 'play-24', category: 'discord' },
      { id: 'i-1426340142351781950-gc-808935495543160852-1414650635642732564', name: 'play-25', category: 'discord' },
      { id: 'i-1426361682346901595-gc-808935495543160852-1415547820177625139', name: 'play-26', category: 'discord' },
      { id: 'i-1426942108480180385-gc-808935495543160852-1415547932303687690', name: 'play-27', category: 'discord' },
      { id: 'i-1425073932637048884-gc-808935495543160852-1415547947315236864', name: 'play-28', category: 'discord' },
      { id: 'i-1426290019294908498-gc-808935495543160852-1415550373145350183', name: 'play-29', category: 'discord' },
      { id: 'i-1425336873709998170-gc-808935495543160852-1420055125409661008', name: 'play-30', category: 'discord' },
      { id: 'i-1426645924557361315-gc-808935495543160852-1415737760005755021', name: 'play-31', category: 'discord' },
      { id: 'i-1426363145806418082-gc-808935495543160852-1415737783116628101', name: 'play-32', category: 'discord' },
      { id: 'i-1424670769790586900-gc-808935495543160852-1415737800992751696', name: 'play-33', category: 'discord' },
      { id: 'i-1426648937850474538-gc-808935495543160852-1415737817056940203', name: 'play-34', category: 'discord' },
      { id: 'i-1426634638595592222-gc-808935495543160852-1415737832332329112', name: 'play-35', category: 'discord' },
      { id: 'i-1426636340619116576-gc-808935495543160852-1415737848279335024', name: 'play-36', category: 'discord' },
      { id: 'i-1426633119934582926-gc-808935495543160852-1415737865761194066', name: 'play-37', category: 'discord' },
      { id: 'i-1426691900710322276-gc-808935495543160852-1415737879208001689', name: 'play-38', category: 'discord' },
      { id: 'i-1426659673783930890-gc-808935495543160852-1415737894144053428', name: 'play-39', category: 'discord' },
      { id: 'i-1421247473728622632-gc-808935495543160852-1415737913324605450', name: 'play-40', category: 'discord' },
      { id: 'i-1426432879709392917-gc-808935495543160852-1426432790832087211', name: 'play-41', category: 'discord' },
      { id: 'i-1426433582888648848-gc-808935495543160852-1426433415455965305', name: 'play-42', category: 'discord' },
      { id: 'i-1426434402606387240-gc-808935495543160852-1426434222825930814', name: 'play-43', category: 'discord' },
      { id: 'i-1426434430360227840-gc-808935495543160852-1426434241947893902', name: 'play-44', category: 'discord' },
      { id: 'i-1426434453651193888-gc-808935495543160852-1426434265268097025', name: 'play-45', category: 'discord' },
      { id: 'i-1426434474119397456-gc-808935495543160852-1426434292162101278', name: 'play-46', category: 'discord' },
      { id: 'i-1426434494306455603-gc-808935495543160852-1426434306888171530', name: 'play-47', category: 'discord' },
      { id: 'i-1426434520390832228-gc-808935495543160852-1426434330770804898', name: 'play-48', category: 'discord' },
      { id: 'i-1426434545942659085-gc-808935495543160852-1426434349049577553', name: 'play-49', category: 'discord' },
      { id: 'i-1426434571775381634-gc-808935495543160852-1426434382196904006', name: 'play-50', category: 'discord' },

      // Magic Circle Country/Regional Rooms
      { id: 'i-1426792268613816442-gc-808935495543160852-1413592763617775657', name: 'play-🇧🇩', category: 'discord' },
      { id: 'i-1426912200731131945-gc-808935495543160852-1413628673810239550', name: 'play-🇧🇷', category: 'discord' },
      { id: 'i-1426725151986286703-gc-808935495543160852-1413627931644661800', name: 'play-🇨🇦', category: 'discord' },
      { id: 'i-1426827100626751498-gc-808935495543160852-1413586163511328839', name: 'play-🇩🇪', category: 'discord' },
      { id: 'i-1426830750170484746-gc-808935495543160852-1413586384098427002', name: 'play-🇪🇸', category: 'discord' },
      { id: 'i-1426946558137597963-gc-808935495543160852-1413589376025235508', name: 'play-🇫🇮', category: 'discord' },
      { id: 'i-1426458931898617916-gc-808935495543160852-1413592562136252417', name: 'play-🇫🇷', category: 'discord' },
      { id: 'i-1426814239305240627-gc-808935495543160852-1413586233791086745', name: 'play-🇬🇧', category: 'discord' },
      { id: 'i-1426946909162967225-gc-808935495543160852-1414314377615642904', name: 'play-🇮🇩', category: 'discord' },
      { id: 'i-1426491363075031082-gc-808935495543160852-1413618707871301712', name: 'play-🇮🇹', category: 'discord' },
      { id: 'i-1424645601508851743-gc-808935495543160852-1413590129213309089', name: 'play-🇯🇵', category: 'discord' },
      { id: 'i-1419121202450141266-gc-808935495543160852-1415708269762187294', name: 'play-🇰🇷', category: 'discord' },
      { id: 'i-1426943939231092838-gc-808935495543160852-1413590246691569794', name: 'play-🇲🇳', category: 'discord' },
      { id: 'i-1426972888908566672-gc-808935495543160852-1413622408766689373', name: 'play-🇲🇽', category: 'discord' },
      { id: 'i-1424661883863953488-gc-808935495543160852-1413628856426635264', name: 'play-🇳🇱', category: 'discord' },
      { id: 'i-1426816652437721092-gc-808935495543160852-1413628948064219236', name: 'play-🇵🇭', category: 'discord' },
      { id: 'i-1426957485669175436-gc-808935495543160852-1413630205695512607', name: 'play-🇵🇱', category: 'discord' },
      { id: 'i-1426901797056778311-gc-808935495543160852-1413630342379880468', name: 'play-🇵🇹', category: 'discord' },
      { id: 'i-1426887346990665869-gc-808935495543160852-1413630567003844619', name: 'play-🇷🇴', category: 'discord' },
      { id: 'i-1426939853031968799-gc-808935495543160852-1413630623656435742', name: 'play-🇷🇺', category: 'discord' },
      { id: 'i-1421302686969557062-gc-808935495543160852-1413630845351010336', name: 'play-🇸🇪', category: 'discord' },
      { id: 'i-1426974695889502248-gc-808935495543160852-1413593072447705118', name: 'play-🇹🇭', category: 'discord' },
      { id: 'i-1426925686738731140-gc-808935495543160852-1413630992336257034', name: 'play-🇹🇷', category: 'discord' },
      { id: 'i-1426975329226395671-gc-808935495543160852-1413631114369695744', name: 'play-🇺🇦', category: 'discord' },
      { id: 'i-1426868636468084817-gc-808935495543160852-1413586285082361857', name: 'play-🇺🇸', category: 'discord' },
      { id: 'i-1426956652857069662-gc-808935495543160852-1413631297003737108', name: 'play-🇻🇳', category: 'discord' },

      // Magic Circle Special Rooms
      {
        id: 'i-1424646014697267220-gc-808935495543160852-1417643699050270741',
        name: 'play-québec',
        category: 'discord'
      },
      { id: 'i-1424646193404747847-gc-808935495543160852-1389442193931571271', name: 'play', category: 'discord' }
    ],

    // Magic Circle public rooms
    magicCircle: [
      { id: 'MG1', name: 'MG1', category: 'public' },
      { id: 'MG2', name: 'MG2', category: 'public' },
      { id: 'MG3', name: 'MG3', category: 'public' },
      { id: 'MG4', name: 'MG4', category: 'public' },
      { id: 'MG5', name: 'MG5', category: 'public' },
      { id: 'MG6', name: 'MG6', category: 'public' },
      { id: 'MG7', name: 'MG7', category: 'public' },
      { id: 'MG8', name: 'MG8', category: 'public' },
      { id: 'MG9', name: 'MG9', category: 'public' },
      { id: 'MG10', name: 'MG10', category: 'public' },
      { id: 'MG11', name: 'MG11', category: 'public' },
      { id: 'MG12', name: 'MG12', category: 'public' },
      { id: 'MG13', name: 'MG13', category: 'public' },
      { id: 'MG14', name: 'MG14', category: 'public' },
      { id: 'MG15', name: 'MG15', category: 'public' },
      { id: 'SLAY', name: 'SLAY', category: 'special' }
    ],

    /**
     * Get all rooms (discord + MG + custom)
     * @returns {Array} Combined array of all room objects
     */
    getAllRooms() {
      const custom = (UnifiedState.data.customRooms || [])
        .filter(code => !this.discord.some(r => r.id === code) && !this.magicCircle.some(r => r.id === code))
        .map(code => ({ id: code, name: code, category: 'custom' }));
      return [...this.discord, ...this.magicCircle, ...custom];
    },

    /**
     * Get combined MG + custom rooms
     * @returns {Array} Combined array of Magic Circle and custom room objects
     */
    getMGAndCustomRooms() {
      const custom = (UnifiedState.data.customRooms || [])
        .filter(code => !this.discord.some(r => r.id === code) && !this.magicCircle.some(r => r.id === code))
        .map(code => ({ id: code, name: code, category: 'custom' }));
      return [...this.magicCircle, ...custom];
    }
  };
}

/**
 * Detect if running in Discord environment
 * @param {object} dependencies - Injected dependencies
 * @param {Window} dependencies.window - Window object
 * @param {object} dependencies.UnifiedState - UnifiedState for settings access
 * @param {Function} dependencies.productionLog - Production log function
 * @returns {boolean} True if in Discord environment
 */
export function isDiscordEnvironment(dependencies = {}) {
  const {
    window: win = typeof window !== 'undefined' ? window : null,
    UnifiedState,
    productionLog = console.log.bind(console)
  } = dependencies;

  try {
    // Check if in Discord iframe or Discord-hosted URL
    const isIframe = win.location !== win.parent.location;
    const isDiscordHost =
      win.location.host.includes('discordsays.com') || win.location.host.endsWith('.discordsays.com');
    const isDiscordActivity = isIframe || isDiscordHost;

    if (UnifiedState?.data?.settings?.debugMode) {
      productionLog('[Discord Detection]', {
        isIframe,
        isDiscordHost,
        isDiscordActivity,
        host: win.location.host
      });
    }

    return isDiscordActivity;
  } catch (err) {
    productionError('Failed to detect Discord environment:', err);
    return false;
  }
}

/**
 * Get current room code from URL
 * @param {object} dependencies - Injected dependencies
 * @param {Window} dependencies.window - Window object
 * @returns {string|null} Room code or null
 */
export function getCurrentRoomCode(dependencies = {}) {
  const { window: win = typeof window !== 'undefined' ? window : null } = dependencies;

  try {
    const match = win.location.pathname.match(/\/r\/([^/]+)/);
    return match ? match[1].toUpperCase() : null;
  } catch (err) {
    productionError('Failed to get room code:', err);
    return null;
  }
}

/**
 * Get actual player count from game's room state
 * @param {object} dependencies - Injected dependencies
 * @param {Window} dependencies.targetWindow - Target window for room connection
 * @param {object} dependencies.UnifiedState - UnifiedState for settings access
 * @returns {number|null} Player count or null
 */
export function getActualPlayerCount(dependencies = {}) {
  const { targetWindow, UnifiedState } = dependencies;

  try {
    const roomState = targetWindow.MagicCircle_RoomConnection?.lastRoomStateJsonable;
    if (!roomState?.child?.data?.userSlots) {
      if (UnifiedState.data.settings.roomDebugMode) {
        productionLog('[Room Status] No userSlots data available', {
          hasRoomConnection: !!targetWindow.MagicCircle_RoomConnection,
          hasRoomState: !!roomState,
          hasChild: !!roomState?.child,
          hasData: !!roomState?.child?.data
        });
      }
      return null;
    }
    const userSlots = roomState.child.data.userSlots;
    const count = userSlots.filter(slot => slot !== null && slot !== undefined).length;
    if (UnifiedState.data.settings.roomDebugMode) {
      productionLog('[Room Status] Player count:', count, 'userSlots:', userSlots);
    }
    return count;
  } catch (err) {
    productionError('[Room Status] Failed to get player count:', err);
    return null;
  }
}

/**
 * Generate unique reporter ID for Firebase
 * @param {object} dependencies - Injected dependencies
 * @param {object} dependencies.UnifiedState - UnifiedState for reporter ID storage
 * @param {Crypto} dependencies.crypto - Crypto API for UUID generation
 * @returns {string} Reporter ID
 */
export function getReporterId(dependencies = {}) {
  const { UnifiedState, crypto: cryptoApi = typeof crypto !== 'undefined' ? crypto : null } = dependencies;

  if (!UnifiedState.data.roomStatus.reporterId) {
    if (cryptoApi && cryptoApi.randomUUID) {
      UnifiedState.data.roomStatus.reporterId = cryptoApi.randomUUID();
    } else {
      UnifiedState.data.roomStatus.reporterId =
        'reporter_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
  }
  return UnifiedState.data.roomStatus.reporterId;
}

/**
 * Build room API URL for /info endpoint
 * @param {string} roomIdOrCode - Room ID or code
 * @param {string} endpoint - API endpoint (default: 'info')
 * @param {object} dependencies - Injected dependencies
 * @param {Location} dependencies.location - Location object for origin
 * @returns {string} API URL
 */
export function buildRoomApiUrl(roomIdOrCode, endpoint = 'info', dependencies = {}) {
  const { location: loc = typeof location !== 'undefined' ? location : null } = dependencies;

  return `${loc.origin}/api/rooms/${encodeURIComponent(roomIdOrCode)}/${endpoint}`;
}

/**
 * Request room endpoint with timeout
 * @param {string} roomIdOrCode - Room ID or code
 * @param {object} options - Request options
 * @param {string} options.endpoint - API endpoint (default: 'info')
 * @param {number} options.timeoutMs - Timeout in milliseconds (default: 10000)
 * @param {object} dependencies - Injected dependencies
 * @param {object} dependencies.Network - Network module for fetch
 * @param {Location} dependencies.location - Location object
 * @param {Function} dependencies.AbortController - AbortController constructor
 * @param {Function} dependencies.setTimeout - setTimeout function
 * @param {Function} dependencies.clearTimeout - clearTimeout function
 * @returns {Promise<object>} Response object with status, ok, body, parsed
 */
export async function requestRoomEndpoint(roomIdOrCode, options = {}, dependencies = {}) {
  const {
    Network,
    location: loc,
    AbortController: AbortCtrl = typeof AbortController !== 'undefined' ? AbortController : null,
    setTimeout: setTimeoutFn = typeof setTimeout !== 'undefined' ? setTimeout : null,
    clearTimeout: clearTimeoutFn = typeof clearTimeout !== 'undefined' ? clearTimeout : null
  } = dependencies;

  const endpoint = options.endpoint ?? 'info';
  const url = buildRoomApiUrl(roomIdOrCode, endpoint, { location: loc });
  const timeoutMs = options.timeoutMs ?? 10000;

  const controller = new AbortCtrl();
  const timeout = setTimeoutFn(() => controller.abort(), timeoutMs);

  try {
    const res = await Network.fetch(url, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal
    });
    const body = await res.text();
    const parsed = res.ok ? JSON.parse(body) : undefined;
    return { status: res.status, ok: res.ok, body, parsed };
  } catch (err) {
    throw new Error(`Room endpoint fetch failed: ${err.message}`);
  } finally {
    clearTimeoutFn(timeout);
  }
}

/**
 * Initialize Firebase stub with /info endpoint polling
 * Creates a Firebase-compatible API that polls room /info endpoints instead of using Firebase SDK
 *
 * @param {object} dependencies - Injected dependencies
 * @param {object} dependencies.RoomRegistry - Room registry object
 * @param {object} dependencies.UnifiedState - UnifiedState for custom rooms
 * @param {Function} dependencies.requestRoomEndpoint - Room endpoint request function
 * @param {Function} dependencies.getReporterId - Reporter ID getter
 * @param {Function} dependencies.productionLog - Production log function
 * @param {Function} dependencies.setInterval - setInterval function
 * @param {Function} dependencies.clearInterval - clearInterval function
 * @returns {Promise<object>} Firebase stub object
 */
export async function initializeFirebase(dependencies = {}) {
  const {
    RoomRegistry,
    UnifiedState,
    requestRoomEndpoint: requestEndpoint,
    getReporterId: getReporter,
    productionLog = console.log.bind(console),
    setInterval: setIntervalFn = typeof setInterval !== 'undefined' ? setInterval : null,
    clearInterval: clearIntervalFn = typeof clearInterval !== 'undefined' ? clearInterval : null
  } = dependencies;

  // Replaced Firebase with /info poller stub - integrates with existing listener
  try {
    const firebase = {
      __useInfo: true,
      getDatabase() {
        return {};
      },
      ref(_db, path) {
        return { path };
      },
      onValue(_refObj, callback) {
        let abort = false;
        const fetchInfo = async room => {
          try {
            // Use /api/rooms/{id}/info endpoint - works for both simple codes and Discord IDs
            const response = await requestEndpoint(room, { endpoint: 'info', timeoutMs: 10000 }, dependencies);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const payload = response.parsed;
            // Extract numPlayers from response (standard pattern)
            const players = typeof payload?.numPlayers === 'number' ? payload.numPlayers : 0;
            const count = Math.max(0, Math.min(6, Math.floor(players)));

            return { count, lastUpdate: Date.now(), reporter: getReporter(dependencies) };
          } catch (err) {
            if (UnifiedState.data.settings?.roomDebugMode) {
              productionWarn(`[Room API] Failed to fetch ${room}:`, err.message);
            }
            return { count: 0, lastUpdate: Date.now(), reporter: getReporter(dependencies) };
          }
        };
        async function tick() {
          if (abort) return;
          const out = {};

          // Poll custom rooms (MG1-15, SLAY, user-added)
          for (const rc of UnifiedState.data.customRooms) {
            out[rc] = await fetchInfo(rc);
          }

          // Poll Discord rooms (play1-play50, country rooms)
          if (RoomRegistry && RoomRegistry.discord) {
            for (const room of RoomRegistry.discord) {
              out[room.id] = await fetchInfo(room.id);
            }
          }

          const snapshot = { val: () => out };
          try {
            callback(snapshot);
          } catch (e) {
            productionError('rooms onValue cb error', e);
          }
        }
        tick();
        const iv = setIntervalFn(tick, 5000);
        return function unsubscribe() {
          abort = true;
          clearIntervalFn(iv);
        };
      },
      set() {
        /* no-op in /info mode */
      },
      onDisconnect() {
        return { remove() {} };
      }
    };
    productionLog('✅ /info rooms mode enabled (Firebase stubbed)');
    return firebase;
  } catch (err) {
    productionError('❌ initializeFirebase (/info) failed', err);
    return null;
  }
}
